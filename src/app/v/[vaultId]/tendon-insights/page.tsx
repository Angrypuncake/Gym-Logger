import Link from "next/link";
import { redirect } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { listTendons, listAllTendonExposure, listExercisesForTendon } from "@/db/anatomy";
import VaultNav from "../_components/VaultNav";

export const dynamic = "force-dynamic";

type SearchParams = {
  tendon?: string; // tendon_target_id
};

function buildHref(vaultId: string, params: { tendon?: string }) {
  const sp = new URLSearchParams();
  if (params.tendon) sp.set("tendon", params.tendon);
  const qs = sp.toString();
  return `/v/${vaultId}/tendon-insights${qs ? `?${qs}` : ""}`;
}

export default async function TendonInsightsPage({
  params,
  searchParams,
}: {
  params: Promise<{ vaultId: string }>;
  searchParams?: Promise<SearchParams>;
}) {
  const { vaultId } = await params;
  const sp = searchParams ? await searchParams : undefined;

  if (!vaultId || vaultId === "undefined") redirect(`/`);

  const tendons = await listTendons(vaultId);
  const exposure = await listAllTendonExposure(vaultId);

  // counts by tendon
  const countByTendon = new Map<string, number>();
  for (const r of exposure) countByTendon.set(r.tendon_target_id, (countByTendon.get(r.tendon_target_id) ?? 0) + 1);

  const selectedTendonId = sp?.tendon ?? null;
  const selectedTendon = selectedTendonId
    ? tendons.find((t: any) => t.id === selectedTendonId) ?? null
    : null;

  const exercises = selectedTendonId ? await listExercisesForTendon(vaultId, selectedTendonId) : [];

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-6 space-y-6">
      <VaultNav vaultId={vaultId} active="tendon_insights" />

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        {/* Left: tendon list */}
        <Card className="h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Tendons</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="divide-y">
              {tendons.map((t: any) => {
                const isSelected = t.id === selectedTendonId;
                const n = countByTendon.get(t.id) ?? 0;
                const href = buildHref(vaultId, { tendon: t.id });

                return (
                  <Link
                    key={t.id}
                    href={href}
                    scroll={false}
                    className={`block py-3 px-2 -mx-2 rounded-md hover:bg-muted/40 ${
                      isSelected ? "bg-muted/40" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{t.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{t.slug}</div>
                      </div>
                      <Badge variant="outline">{n}</Badge>
                    </div>
                  </Link>
                );
              })}

              {tendons.length === 0 && (
                <div className="py-6 text-sm text-muted-foreground">No tendons found.</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right: exercises for selected tendon */}
        <Card className="h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">
              {selectedTendon ? selectedTendon.name : "Exercises"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {!selectedTendon ? (
              <div className="text-sm text-muted-foreground">Pick a tendon on the left.</div>
            ) : exercises.length === 0 ? (
              <div className="text-sm text-muted-foreground">No mapped exercises yet.</div>
            ) : (
              <div className="divide-y">
                {exercises.map(({ exercise, confidence }) => (
                  <div key={exercise.id} className="py-3 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{exercise.name}</div>
                      <div className="flex items-center gap-2 flex-wrap mt-1">
                        <Badge variant="outline">{exercise.modality}</Badge>
                        {exercise.uses_bodyweight ? <Badge variant="secondary">Bodyweight</Badge> : null}
                        <Badge variant="outline">{confidence}</Badge>
                      </div>
                    </div>

                    <Button asChild size="sm" variant="secondary">
                      <Link href={`/v/${vaultId}/exercises?edit=${exercise.id}`} scroll={false}>
                        Edit
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
