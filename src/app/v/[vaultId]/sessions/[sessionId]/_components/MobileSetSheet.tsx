"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

export function MobileSetSheet({
  open,
  title = "Set editor",
  onClose,
  children,
}: {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="absolute bottom-0 left-0 right-0 max-h-[80vh] overflow-y-auto rounded-t-2xl border border-border bg-background shadow-lg">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-border bg-background px-4 py-3">
          <div className="text-sm font-semibold">{title}</div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            className="h-8 px-2"
          >
            Close
          </Button>
        </div>

        <div className="px-3 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
          {children}
        </div>
      </div>
    </div>
  );
}
