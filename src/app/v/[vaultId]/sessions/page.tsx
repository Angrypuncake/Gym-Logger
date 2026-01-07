import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import CalendarClient from "./CalendarClient";

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
  // If your view exposes created_at, include it:
  // created_at: string;
};

function sydneyKey(d: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Australia/Sydney",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function monthStartKey(year: number, month0: number) {
  return sydneyKey(new Date(Date.UTC(year, month0, 1)));
}
function monthEndKey(year: number, month0: number) {
  return sydneyKey(new Date(Date.UTC(year, month0 + 1, 0)));
}

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

  const supabase = await createClient();

  const { data: summariesRaw, error } = await supabase
    .from("session_summaries" as any)
    .select("*")
    .eq("vault_id", vaultId)
    .gte("session_date", monthStartKey(y, m))
    .lte("session_date", monthEndKey(y, m))
    .order("session_date", { ascending: true })
    // started_at can be null; keep it secondary
    .order("started_at", { ascending: true });
    // If your view has created_at, prefer:
    // .order("created_at", { ascending: true });

  if (error) return <pre>{error.message}</pre>;
  const summaries = (summariesRaw ?? []) as SummaryRow[];

  const { data: templates, error: tErr } = await supabase
    .from("templates")
    .select("id,name,order")
    .eq("vault_id", vaultId)
    .order("order", { ascending: true });

  

  if (tErr) return <pre>{tErr.message}</pre>;

  console.log("vaultid", vaultId)

  console.log("templates", templates)

  // Adherence: streak + this-week count (Sydney)
  const since = new Date(now);
  since.setUTCDate(now.getUTCDate() - 180);

  const { data: adherenceRaw } = await supabase
    .from("session_summaries" as any)
    .select("session_date,logged_sets") // finished_at no longer used for adherence
    .eq("vault_id", vaultId)
    .gte("session_date", sydneyKey(since))
    .lte("session_date", sydneyKey(now));

  const trainedDays = new Set(
    (adherenceRaw ?? [])
      .filter((r: any) => Number(r.logged_sets ?? 0) > 0)
      .map((r: any) => r.session_date)
  );

  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(now);
    d.setUTCDate(now.getUTCDate() - i);
    const key = sydneyKey(d);
    if (trainedDays.has(key)) streak++;
    else break;
  }

  // Week count (Mon..Sun in Sydney)
  const weekdayShort = new Intl.DateTimeFormat("en-US", { timeZone: "Australia/Sydney", weekday: "short" }).format(now);
  const order = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const offset = Math.max(0, order.indexOf(weekdayShort));
  const weekStart = new Date(now);
  weekStart.setUTCDate(now.getUTCDate() - offset);

  let weekCount = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setUTCDate(weekStart.getUTCDate() + i);
    if (trainedDays.has(sydneyKey(d))) weekCount++;
  }

  return (
    <div className="mx-auto max-w-[980px] px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <Link href={`/v/${vaultId}`} className="text-sm text-muted-foreground hover:underline">
          ← Home
        </Link>
        <div className="text-sm text-muted-foreground">
          Streak: <span className="font-medium text-foreground">{streak}</span> · This week:{" "}
          <span className="font-medium text-foreground">{weekCount}</span>
        </div>
      </div>

      <CalendarClient
        vaultId={vaultId}
        year={y}
        month0={m}
        summaries={summaries as any}
        templates={(templates ?? []) as any}
      />
    </div>
  );
}
