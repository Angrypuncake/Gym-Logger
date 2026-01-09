// templates/[templateId]/_components/TemplateDetailsCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function TemplateDetailsCard({
  templateName,
  onRename,
}: {
  templateName: string;
  onRename: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Template details</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <form action={onRename} className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            name="name"
            defaultValue={templateName}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button type="submit" size="sm" className="active:scale-95 transition-transform">
            Rename
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
