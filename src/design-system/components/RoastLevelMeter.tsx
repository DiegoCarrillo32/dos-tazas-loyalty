"use client";

import * as React from "react";
import { Coffee } from "lucide-react";

import { cn } from "@/lib/utils";

export const ROAST_LEVELS = ["Light", "Medium", "Medium-Dark", "Dark"] as const;
export type RoastLevel = (typeof ROAST_LEVELS)[number];

export interface RoastLevelMeterProps {
  value?: RoastLevel;
  defaultValue?: RoastLevel;
  onValueChange?: (value: RoastLevel) => void;
  /** When false, renders as a read-only indicator. */
  interactive?: boolean;
  className?: string;
}

/**
 * RoastLevelMeter — a brand-signature control. Four coffee beans deepen from
 * fruit-light to expresso as the roast gets darker; pick a level (or display
 * one read-only). Shows the palette working as a sequential scale.
 */
export function RoastLevelMeter({
  value,
  defaultValue = "Medium",
  onValueChange,
  interactive = true,
  className,
}: RoastLevelMeterProps) {
  const [internal, setInternal] = React.useState<RoastLevel>(defaultValue);
  const isControlled = value !== undefined;
  const current = isControlled ? value : internal;
  const activeIndex = ROAST_LEVELS.indexOf(current);

  const select = (level: RoastLevel) => {
    if (!interactive) return;
    if (!isControlled) setInternal(level);
    onValueChange?.(level);
  };

  // Deepening fill, light → dark roast.
  const fillFor = ["text-fruit-light", "text-coffee-fruit", "text-warm-roast", "text-expresso"];

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center gap-1.5">
        {ROAST_LEVELS.map((level, i) => {
          const on = i <= activeIndex;
          const Wrapper = interactive ? "button" : "span";
          return (
            <Wrapper
              key={level}
              {...(interactive
                ? { type: "button" as const, onClick: () => select(level), "aria-label": level }
                : {})}
              className={cn(
                "rounded-full p-0.5 transition-transform",
                interactive && "cursor-pointer outline-none hover:scale-110 focus-visible:ring-2 focus-visible:ring-coffee-fruit/40",
              )}
            >
              <Coffee
                className={cn("size-6 transition-colors", on ? fillFor[i] : "text-warm-roast/20")}
                fill="currentColor"
                strokeWidth={1.5}
              />
            </Wrapper>
          );
        })}
      </div>
      <span className="text-xs font-bold text-expresso/70">{current} roast</span>
    </div>
  );
}
