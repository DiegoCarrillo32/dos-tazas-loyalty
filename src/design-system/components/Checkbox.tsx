"use client";

import * as React from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: React.ReactNode;
  description?: React.ReactNode;
}

/**
 * Checkbox — accessible native checkbox with a brand-styled box. The real
 * `<input>` is visually hidden but keeps focus/keyboard semantics; the
 * coffee-fruit fill and check icon are layered on top via peer state.
 */
export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, id, ...props }, ref) => {
    const reactId = React.useId();
    const inputId = id ?? reactId;
    return (
      <label
        htmlFor={inputId}
        className={cn("group flex items-start gap-2.5", props.disabled ? "opacity-50" : "cursor-pointer", className)}
      >
        <span className="relative mt-0.5 flex">
          <input ref={ref} id={inputId} type="checkbox" className="peer sr-only" {...props} />
          <span className="flex size-5 items-center justify-center rounded-md border-2 border-warm-roast/30 bg-white transition-colors peer-checked:border-coffee-fruit peer-checked:bg-coffee-fruit peer-focus-visible:ring-2 peer-focus-visible:ring-coffee-fruit/30 dark:bg-input/30">
            <Check className="size-3.5 text-white opacity-0 transition-opacity peer-checked:opacity-100" strokeWidth={3} aria-hidden />
          </span>
        </span>
        {(label || description) && (
          <span className="flex flex-col">
            {label && <span className="text-sm font-medium text-expresso">{label}</span>}
            {description && <span className="text-xs text-expresso/50">{description}</span>}
          </span>
        )}
      </label>
    );
  },
);
Checkbox.displayName = "Checkbox";
