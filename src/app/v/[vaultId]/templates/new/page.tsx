import Link from "next/link";
import { createTemplate } from "./actions";

export default async function NewTemplatePage({
  params,
}: {
  params: Promise<{ vaultId: string }>;
}) {
  const { vaultId } = await params;

  return (
    <div style={{ padding: 16, maxWidth: 560, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <h1 style={{ margin: 0 }}>New template</h1>
        <Link href={`/v/${vaultId}`}>Back</Link>
      </div>

      <form action={createTemplate.bind(null, vaultId)} style={{ marginTop: 16, display: "grid", gap: 10 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ opacity: 0.8 }}>Name</span>
          <input name="name" placeholder="e.g., Pull + Push" autoFocus />
        </label>

        <button type="submit">Create</button>

        <p style={{ opacity: 0.7, marginTop: 8 }}>
          Next: add exercises on the editor page.
        </p>
      </form>
    </div>
  );
}
