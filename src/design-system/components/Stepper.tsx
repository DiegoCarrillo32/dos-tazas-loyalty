import * as React from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export interface Step {
  label: React.ReactNode;
  description?: React.ReactNode;
}

export interface StepperProps {
  steps: Step[];
  /** Zero-based index of the active step; earlier steps render as complete. */
  current: number;
  className?: string;
}

/** Stepper — horizontal progress through a multi-step flow. */
export function Stepper({ steps, current, className }: StepperProps) {
  return (
    <ol className={cn("flex w-full items-center", className)}>
      {steps.map((step, i) => {
        const complete = i < current;
        const active = i === current;
        const last = i === steps.length - 1;
        return (
          <li key={i} className={cn("flex items-center", !last && "flex-1")}>
            <div className="flex flex-col items-center gap-1.5 text-center">
              <span
                className={cn(
                  "flex size-9 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors",
                  complete && "border-coffee-fruit bg-coffee-fruit text-white",
                  active && "border-coffee-fruit bg-coffee-fruit/10 text-coffee-fruit",
                  !complete && !active && "border-warm-roast/25 bg-card text-expresso/40",
                )}
              >
                {complete ? <Check className="size-4" strokeWidth={3} /> : i + 1}
              </span>
              <span className={cn("text-xs font-bold", active || complete ? "text-expresso" : "text-expresso/40")}>
                {step.label}
              </span>
              {step.description && <span className="text-[11px] text-expresso/40">{step.description}</span>}
            </div>
            {!last && (
              <span className={cn("mx-2 -mt-6 h-0.5 flex-1 rounded-full", complete ? "bg-coffee-fruit" : "bg-warm-roast/20")} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
