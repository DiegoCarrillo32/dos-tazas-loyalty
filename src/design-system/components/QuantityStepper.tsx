"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";

import { cn } from "@/lib/utils";

export interface QuantityStepperProps {
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  onValueChange?: (value: number) => void;
  /** Unit suffix shown after the value, e.g. "bags". */
  unit?: React.ReactNode;
  className?: string;
}

/**
 * QuantityStepper — coffee-themed numeric stepper for order/bag counts.
 * Clamped to `[min, max]`, with round brand buttons flanking the value.
 */
export function QuantityStepper({
  value,
  defaultValue = 1,
  min = 0,
  max = 99,
  step = 1,
  onValueChange,
  unit,
  className,
}: QuantityStepperProps) {
  const [internal, setInternal] = React.useState(defaultValue);
  const isControlled = value !== undefined;
  const current = isControlled ? value : internal;

  const set = (next: number) => {
    const clamped = Math.max(min, Math.min(max, next));
    if (!isControlled) setInternal(clamped);
    onValueChange?.(clamped);
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-warm-roast/20 bg-card p-1",
        className,
      )}
    >
      <button
        type="button"
        aria-label="Decrease"
        onClick={() => set(current - step)}
        disabled={current <= min}
        className="flex size-8 items-center justify-center rounded-full text-expresso transition-colors hover:bg-warm-roast/10 disabled:pointer-events-none disabled:opacity-30"
      >
        <Minus className="size-4" />
      </button>
      <span className="min-w-12 text-center text-sm font-bold text-expresso tabular-nums">
        {current}
        {unit && <span className="ml-1 text-xs font-medium text-expresso/50">{unit}</span>}
      </span>
      <button
        type="button"
        aria-label="Increase"
        onClick={() => set(current + step)}
        disabled={current >= max}
        className="flex size-8 items-center justify-center rounded-full bg-warm-roast text-white transition-colors hover:bg-coffee-fruit disabled:pointer-events-none disabled:opacity-30"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
