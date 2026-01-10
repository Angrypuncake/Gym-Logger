// src/app/v/[vaultId]/analytics/page.tsx
import { fetchMuscleMetrics, fetchTendonMetrics, type Grain } from "@/db/analytics";
import AnalyticsClient from "./_components/AnalyticsClient";
import { addDays, clampInt, pickFirst, SearchParams, toISODate } from "./utils";

export default async function AnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ vaultId: string }>;
  searchParams?: Promise<SearchParams>;
}) {
  const { vaultId } = await params;
  const sp = (await (searchParams as any)) as SearchParams;

  const tabRaw = (pickFirst(sp?.tab) ?? "muscles").toLowerCase();
  const tab = (tabRaw === "tendons" ? "tendons" : "muscles") as "muscles" | "tendons";

  const grainRaw = (pickFirst(sp?.grain) ?? "week").toLowerCase();
  const grain: Grain = grainRaw === "day" ? "day" : "week";

  const weeks = clampInt(parseInt(pickFirst(sp?.weeks) ?? "12", 10) || 12, 4, 52);
  const q = (pickFirst(sp?.q) ?? "").trim();
  const targetId = pickFirst(sp?.target);

  const sortDefault =
    tab === "muscles" ? "effective_sets" : "iso_load";
  const sort = (pickFirst(sp?.sort) ?? sortDefault).toLowerCase();

  const to = new Date();
  const from = addDays(to, -(weeks * 7 - 1));
  const fromISO = toISODate(from);
  const toISO = toISODate(to);

  const rawRows =
    tab === "muscles"
      ? await fetchMuscleMetrics({ vaultId, fromISO, toISO, grain })
      : await fetchTendonMetrics({ vaultId, fromISO, toISO, grain });

  return (
    <AnalyticsClient
      vaultId={vaultId}
      tab={tab}
      grain={grain}
      weeks={weeks}
      q={q}
      sort={sort}
      targetId={targetId}
      fromISO={fromISO}
      toISO={toISO}
      rawRows={rawRows as any}
    />
  );
}
