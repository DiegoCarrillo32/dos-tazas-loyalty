"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type Placement = "top" | "bottom" | "left" | "right";

const placementClasses: Record<Placement, string> = {
  top: "bottom-full left-1/2 mb-2 -translate-x-1/2",
  bottom: "top-full left-1/2 mt-2 -translate-x-1/2",
  left: "right-full top-1/2 mr-2 -translate-y-1/2",
  right: "left-full top-1/2 ml-2 -translate-y-1/2",
};

export interface TooltipProps {
  content: React.ReactNode;
  placement?: Placement;
  children: React.ReactNode;
  className?: string;
}

/**
 * Tooltip — lightweight hover/focus label on a dark espresso surface.
 * Self-contained (CSS-driven visibility) so it needs no provider.
 */
export function Tooltip({ content, placement = "top", children, className }: TooltipProps) {
  return (
    <span className="group/tooltip relative inline-flex">
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute z-50 whitespace-nowrap rounded-lg bg-expresso px-2.5 py-1.5 text-xs font-medium text-white-pergamino opacity-0 shadow-md shadow-warm-roast/20 transition-opacity duration-150 group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100",
          placementClasses[placement],
          className,
        )}
      >
        {content}
      </span>
    </span>
  );
}
