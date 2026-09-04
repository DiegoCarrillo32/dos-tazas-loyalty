import * as React from "react";

import { cn } from "@/lib/utils";

const baseInput =
  "h-10 w-full min-w-0 rounded-xl border bg-white px-3 py-2 text-sm text-expresso transition-colors outline-none placeholder:text-expresso/40 focus-visible:border-coffee-fruit focus-visible:ring-2 focus-visible:ring-coffee-fruit/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-warm-roast/5 disabled:opacity-50 dark:bg-input/30";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  invalid?: boolean;
}

/**
 * Input — text field matching the app's `src/components/ui/input.tsx` styling,
 * with optional leading/trailing adornments and an `invalid` state.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, leadingIcon, trailingIcon, invalid, ...props }, ref) => {
    const borderState = invalid
      ? "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20"
      : "border-warm-roast/30 dark:border-warm-roast/20";

    if (!leadingIcon && !trailingIcon) {
      return <input ref={ref} className={cn(baseInput, borderState, className)} {...props} />;
    }

    return (
      <div className="relative flex items-center">
        {leadingIcon && (
          <span className="pointer-events-none absolute left-3 flex text-expresso/40 [&_svg]:size-4">
            {leadingIcon}
          </span>
        )}
        <input
          ref={ref}
          className={cn(baseInput, borderState, leadingIcon && "pl-9", trailingIcon && "pr-9", className)}
          {...props}
        />
        {trailingIcon && (
          <span className="absolute right-3 flex text-expresso/40 [&_svg]:size-4">{trailingIcon}</span>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";
