import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

/**
 * Select — native `<select>` styled to match the brand. Native keeps keyboard
 * and mobile behaviour solid; for richly-rendered options the app uses the
 * `@base-ui` Select primitive in `src/components/ui/select.tsx`.
 */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, invalid, children, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            "h-10 w-full appearance-none rounded-xl border bg-white pl-3 pr-9 text-sm text-expresso transition-colors outline-none focus-visible:border-coffee-fruit focus-visible:ring-2 focus-visible:ring-coffee-fruit/20 disabled:cursor-not-allowed disabled:bg-warm-roast/5 disabled:opacity-50 dark:bg-input/30",
            invalid
              ? "border-destructive focus-visible:ring-destructive/20"
              : "border-warm-roast/30 dark:border-warm-roast/20",
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-expresso/40"
          aria-hidden
        />
      </div>
    );
  },
);
Select.displayName = "Select";
