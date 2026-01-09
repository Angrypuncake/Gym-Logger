import Link from "next/link";
import CalendarClient from "./calendar/CalendarClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import VaultNav from "../_components/VaultNav";
import { getSessionSummariesForMonth, getTemplatesForVault, getTrainedDaysInRange } from "@/db/sessions";
import { computeStreak, computeWeekCount } from "@/lib/adherence";
import { sydneyWeekStartDate } from "@/lib/datesSydney";

type SummaryRow = {
  session_id: string;
  vault_id: string;
  template_id: string;
  template_name: string;
  session_date: string; // YYYY-MM-DD
  started_at: string | null;
  finished_at: string | null; // timekeeping only
  planned_sets: number;
  logged_sets: number;
  total_reps: number;
  total_iso_sec: number;
  modalities: string[];
  has_pr: boolean;
};

export default async function SessionsCalendarPage({
  params,
  searchParams,
}: {
  params: Promise<{ vaultId: string }>;
  searchParams: Promise<{ y?: string; m?: string }>;
}) {
  const { vaultId } = await params;
  const sp = await searchParams;

  const now = new Date();
  const y = sp.y ? Number(sp.y) : now.getUTCFullYear();
  const m = sp.m ? Number(sp.m) : now.getUTCMonth();

  let summaries: SummaryRow[] = [];
  let templates: { id: string; name: string; sort_order: number }[] = [];
  let trainedDays = new Set<string>();

  try {
    summaries = await getSessionSummariesForMonth(vaultId, y, m);
    templates = await getTemplatesForVault(vaultId);

    const since = new Date(now);
    since.setUTCDate(now.getUTCDate() - 180);
    trainedDays = await getTrainedDaysInRange(vaultId, since, now);
  } catch (e: any) {
    return <pre>{e?.message ?? "Unknown error"}</pre>;
  }

  const streak = computeStreak(trainedDays, now);
  const weekStart = sydneyWeekStartDate(now);
  const weekCount = computeWeekCount(trainedDays, weekStart);

  return (
    
    <div className="mx-auto max-w-[1200px] px-4 py-6 space-y-4">
      <VaultNav vaultId={vaultId} active="home" />
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-sm text-muted-foreground">
          Streak: <span className="font-medium text-foreground">{streak}</span> · This week:{" "}
          <span className="font-medium text-foreground">{weekCount}</span>
        </div>

      </div>
  
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <CalendarClient
          vaultId={vaultId}
          year={y}
          month0={m}
          summaries={summaries as any}
          templates={(templates ?? []) as any}
        />
  
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-sm">Templates</CardTitle>
                <Link href={`/v/${vaultId}/templates/new`}>
                  <Button size="sm" variant="secondary">
                    New
                  </Button>
                </Link>
              </div>
            </CardHeader>
  
            <CardContent className="pt-0">
              <div className="divide-y">
                {(templates ?? []).map((t: any) => (
                  <div key={t.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{t.name}</div>
     
                    </div>
  
                    <div className="flex items-center gap-2 shrink-0">
                      <Link href={`/v/${vaultId}/templates/${t.id}`}>
                        <Button size="sm" variant="ghost">
                          Edit
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
                {(templates ?? []).length === 0 && (
                  <div className="py-3 text-sm text-muted-foreground">No templates yet.</div>
                )}
              </div>
            </CardContent>
          </Card>
  
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Quick links</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 flex flex-col gap-2">
  
              <Link href={`/v/${vaultId}/exercises`}>
                <Button variant="secondary" size="sm" className="w-full justify-start">
                  Manage exercises
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
  
}
