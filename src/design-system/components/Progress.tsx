import * as React from "react";

import { cn } from "@/lib/utils";

export interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  /** Tint of the fill — defaults to the coffee-fruit accent. */
  tone?: "accent" | "roast" | "success";
  showLabel?: boolean;
}

const toneFill = {
  accent: "bg-coffee-fruit",
  roast: "bg-warm-roast",
  success: "bg-green-500",
} as const;

/** Progress — determinate horizontal bar. */
export function Progress({ value, max = 100, className, tone = "accent", showLabel }: ProgressProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 flex-1 overflow-hidden rounded-full bg-warm-roast/15"
      >
        <div
          className={cn("h-full rounded-full transition-[width] duration-500", toneFill[tone])}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="w-9 shrink-0 text-right text-xs font-bold text-expresso/70">{Math.round(pct)}%</span>
      )}
    </div>
  );
}
