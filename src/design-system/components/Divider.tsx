import * as React from "react";

import { cn } from "@/lib/utils";

export interface DividerProps {
  orientation?: "horizontal" | "vertical";
  /** Optional centered label, e.g. "or". */
  label?: React.ReactNode;
  className?: string;
}

/** Divider — subtle warm-roast hairline, optionally with a centered label. */
export function Divider({ orientation = "horizontal", label, className }: DividerProps) {
  if (orientation === "vertical") {
    return <div role="separator" aria-orientation="vertical" className={cn("w-px self-stretch bg-warm-roast/15", className)} />;
  }
  if (label) {
    return (
      <div className={cn("flex items-center gap-3", className)} role="separator">
        <span className="h-px flex-1 bg-warm-roast/15" />
        <span className="text-xs font-medium text-expresso/50">{label}</span>
        <span className="h-px flex-1 bg-warm-roast/15" />
      </div>
    );
  }
  return <div role="separator" aria-orientation="horizontal" className={cn("h-px w-full bg-warm-roast/15", className)} />;
}
