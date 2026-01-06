import Link from "next/link";
import { listTemplates, listTemplateItemPreviews } from "@/db/templates";
import { getCurrentSession, getSessionProgressPct } from "@/db/sessions";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

export default async function VaultHome({
  params,
}: {
  params: Promise<{ vaultId: string }>;
}) {
  const { vaultId } = await params;

  const templates = await listTemplates(vaultId);
  const templateIds = templates.map((t) => t.id);
  const itemsByTemplate = await listTemplateItemPreviews(vaultId, templateIds);

  const currentSession = await getCurrentSession(vaultId);

  let current: null | {
    sessionId: string;
    templateName: string;
    pct: number;
  } = null;

  if (currentSession?.id) {
    const templateName =
      (currentSession.template as unknown as { name: string } | null)?.name ??
      "Workout";

    const pct = await getSessionProgressPct(vaultId, currentSession.id);
    current = { sessionId: currentSession.id, templateName, pct };
  }

  return (
    <div className="mx-auto max-w-[860px] px-4 py-6 space-y-6">
      <Link
        href={`/v/${vaultId}/sessions`}
        className="text-sm text-muted-foreground hover:underline"
      >
        See workout history
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-sm font-semibold">Program days</h1>
        <Link href={`/v/${vaultId}/templates/new`}>
          <Button size="sm" variant="secondary">
            Add new template
          </Button>
        </Link>
      </div>

      {current && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-sm">Current workout</CardTitle>
                <div className="text-sm text-muted-foreground">
                  {current.templateName} · {current.pct}%
                </div>
              </div>

              <Link href={`/v/${vaultId}/sessions/${current.sessionId}`}>
                <Button size="sm">Resume</Button>
              </Link>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <Progress value={current.pct} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Templates</CardTitle>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="divide-y">
            {templates.map((t) => {
              const ex = itemsByTemplate.get(t.id) ?? [];
              const count = ex.length;
              const preview = ex.slice(0, 4).join(" · ");

              return (
                <div key={t.id} className="py-4 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="font-medium text-sm">{t.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {preview}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{count} exercises</Badge>

                    <Link href={`/v/${vaultId}/templates/${t.id}`}>
                      <Button size="sm" variant="ghost">
                        Edit
                      </Button>
                    </Link>

                    <form action={`/v/${vaultId}/start`} method="post">
                      <input
                        type="hidden"
                        name="template_id"
                        value={t.id}
                      />
                      <Button size="sm" type="submit">
                        Start
                      </Button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
