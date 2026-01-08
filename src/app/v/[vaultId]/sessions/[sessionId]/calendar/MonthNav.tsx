"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function MonthNav({
  vaultId,
  year,
  month0,
}: {
  vaultId: string;
  year: number;
  month0: number;
}) {
  const router = useRouter();

  const monthLabel = new Date(year, month0, 1).toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  });

  function go(delta: number) {
    const d = new Date(year, month0, 1);
    d.setMonth(d.getMonth() + delta);
    router.push(`/v/${vaultId}/sessions?y=${d.getFullYear()}&m=${d.getMonth()}`);
  }

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" variant="secondary" onClick={() => go(-1)}>
        ←
      </Button>
      <div className="text-sm font-semibold">{monthLabel}</div>
      <Button size="sm" variant="secondary" onClick={() => go(1)}>
        →
      </Button>
    </div>
  );
}
