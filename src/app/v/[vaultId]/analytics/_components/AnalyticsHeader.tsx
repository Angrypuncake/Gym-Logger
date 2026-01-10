// src/app/v/[vaultId]/analytics/_components/AnalyticsHeader.tsx
"use client";

import Link from "next/link";
import VaultNav from "../../_components/VaultNav";
import { Tab } from "./AnalyticsUtils";
import type { Grain } from "@/db/analytics";

export default function AnalyticsHeader(props: {
  vaultId: string;
  tab: Tab;
  grain: Grain;
  weeks: number;
  tabHref: (t: Tab) => string;
  grainHref: (g: Grain) => string;
  rangeHref: (w: number) => string;
}) {
  const { vaultId, tab, grain, weeks, tabHref, grainHref, rangeHref } = props;

  return (
    <>
      <VaultNav vaultId={vaultId} active="analytics" />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link
            href={tabHref("muscles")}
            className={`rounded-md px-3 py-1 text-sm ${
              tab === "muscles" ? "bg-foreground text-background" : "border border-input"
            }`}
          >
            Muscles
          </Link>
          <Link
            href={tabHref("tendons")}
            className={`rounded-md px-3 py-1 text-sm ${
              tab === "tendons" ? "bg-foreground text-background" : "border border-input"
            }`}
          >
            Tendons
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={grainHref("week")}
            className={`rounded-md px-3 py-1 text-sm ${
              grain === "week" ? "bg-foreground text-background" : "border border-input"
            }`}
          >
            Week
          </Link>
          <Link
            href={grainHref("day")}
            className={`rounded-md px-3 py-1 text-sm ${
              grain === "day" ? "bg-foreground text-background" : "border border-input"
            }`}
          >
            Day
          </Link>

          <div className="mx-1 h-6 w-px bg-input" />

          {[4, 12, 26, 52].map((w) => (
            <Link
              key={w}
              href={rangeHref(w)}
              className={`rounded-md px-3 py-1 text-sm ${
                weeks === w ? "bg-foreground text-background" : "border border-input"
              }`}
            >
              {w}w
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
