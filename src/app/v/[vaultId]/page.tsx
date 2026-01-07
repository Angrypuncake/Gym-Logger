import { redirect } from "next/navigation";

export default async function Page({
  params,
}: {
  params: Promise<{ vaultId: string }>;
}) {
  const { vaultId } = await params;

  // defensive: avoid /v/undefined loops while debugging
  if (!vaultId || vaultId === "undefined") redirect("/v");

  redirect(`/v/${vaultId}/sessions`);
}
