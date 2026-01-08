// src/app/v/[vaultId]/analytics/_components/AnalyticsHeader.tsx
"use client";

import Link from "next/link";
import VaultNav from "../../_components/VaultNav";
import { Tab } from "./AnalyticsUtils";


export default function AnalyticsHeader(props: {
  vaultId: string;
  tab: Tab;
  weeks: number;
  tabHref: (t: Tab) => string;
  rangeHref: (w: number) => string;
}) {
  const { vaultId, tab, weeks, tabHref, rangeHref } = props;

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
