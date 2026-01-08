import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function TemplatesPanel({
  vaultId,
  templates,
  itemsByTemplate,
}: {
  vaultId: string;
  templates: { id: string; name: string }[];
  itemsByTemplate: Map<string, string[]>;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-sm">Templates</CardTitle>
          <Link href={`/v/${vaultId}/templates/new`}>
            <Button size="sm" variant="secondary">New</Button>
          </Link>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="divide-y">
          {templates.map((t) => {
            const ex = itemsByTemplate.get(t.id) ?? [];
            const count = ex.length;
            const preview = ex.slice(0, 4).join(" · ");

            return (
              <div key={t.id} className="py-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{t.name}</div>
                  {preview && (
                    <div className="text-xs text-muted-foreground truncate">
                      {preview}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline">{count}</Badge>
                  <Link href={`/v/${vaultId}/templates/${t.id}`}>
                    <Button size="sm" variant="ghost">Edit</Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
