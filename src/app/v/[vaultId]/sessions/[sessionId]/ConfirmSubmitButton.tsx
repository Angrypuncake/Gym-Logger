"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

export default function ConfirmSubmitButton({
  confirmText,
  children,
  ...props
}: React.ComponentProps<typeof Button> & { confirmText: string }) {
  return (
    <Button
      {...props}
      onClick={(e) => {
        const ok = window.confirm(confirmText);
        if (!ok) e.preventDefault();
        props.onClick?.(e);
      }}
    >
      {children}
    </Button>
  );
}
