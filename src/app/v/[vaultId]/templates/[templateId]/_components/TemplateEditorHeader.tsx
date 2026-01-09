// templates/[templateId]/_components/TemplateEditorHeader.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function TemplateEditorHeader({
  vaultId,
  templateName,
}: {
  vaultId: string;
  templateName: string;
}) {
  return (
    <header className="flex items-start justify-between gap-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Button asChild type="button" variant="secondary" size="sm">
            <Link href={`/v/${vaultId}`}>← Back</Link>
          </Button>
          <h1 className="text-sm font-semibold">
            Template editor: <span className="font-semibold">{templateName}</span>
          </h1>
        </div>
        <div className="text-xs text-muted-foreground">Vault: {vaultId}</div>
      </div>

      <Button asChild type="button" variant="ghost" size="sm">
        <Link href={`/v/${vaultId}`}>Done</Link>
      </Button>
    </header>
  );
}
