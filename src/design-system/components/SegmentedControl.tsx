"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export interface Segment {
  value: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
}

export interface SegmentedControlProps {
  options: Segment[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  size?: "sm" | "md";
  className?: string;
}

/**
 * SegmentedControl — pill-shaped exclusive toggle (think list/grid or
 * day/week/month). The active segment gets a raised white thumb.
 */
export function SegmentedControl({
  options,
  value,
  defaultValue,
  onValueChange,
  size = "md",
  className,
}: SegmentedControlProps) {
  const [internal, setInternal] = React.useState(defaultValue ?? options[0]?.value);
  const isControlled = value !== undefined;
  const current = isControlled ? value : internal;

  const select = (v: string) => {
    if (!isControlled) setInternal(v);
    onValueChange?.(v);
  };

  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-warm-roast/10 p-1",
        className,
      )}
    >
      {options.map((opt) => {
        const selected = opt.value === current;
        return (
          <button
            key={opt.value}
            role="tab"
            type="button"
            aria-selected={selected}
            onClick={() => select(opt.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full font-bold transition-all outline-none focus-visible:ring-2 focus-visible:ring-coffee-fruit/40 [&_svg]:size-4",
              size === "sm" ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-sm",
              selected
                ? "bg-card text-expresso shadow-sm shadow-warm-roast/10"
                : "text-expresso/60 hover:text-expresso",
            )}
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
