import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

/** Textarea — multiline input sharing the Input look. */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "min-h-20 w-full resize-y rounded-xl border bg-white px-3 py-2 text-sm text-expresso transition-colors outline-none placeholder:text-expresso/40 focus-visible:border-coffee-fruit focus-visible:ring-2 focus-visible:ring-coffee-fruit/20 disabled:cursor-not-allowed disabled:bg-warm-roast/5 disabled:opacity-50 dark:bg-input/30",
          invalid
            ? "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20"
            : "border-warm-roast/30 dark:border-warm-roast/20",
          className,
        )}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";
