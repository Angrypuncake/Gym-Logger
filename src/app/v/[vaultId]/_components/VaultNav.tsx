// src/app/v/[vaultId]/_components/VaultNav.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

type Item = {
  href: string;
  label: string;
};

export default function VaultNav({
  vaultId,
  active,
}: {
  vaultId: string;
  active?: "home" | "sessions" | "exercises" | "tendon_insights";
}) {
  const items: Array<Item & { key: NonNullable<typeof active> }> = [
    { key: "home", label: "Home", href: `/v/${vaultId}` },
    { key: "exercises", label: "Exercises", href: `/v/${vaultId}/exercises` },
    { key: "tendon_insights", label: "Tendon insights", href: `/v/${vaultId}/tendon-insights` },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {items.map((it) => (
        <Button
          key={it.key}
          asChild
          size="sm"
          variant={active === it.key ? "default" : "secondary"}
        >
          <Link href={it.href}>{it.label}</Link>
        </Button>
      ))}
    </div>
  );
}
