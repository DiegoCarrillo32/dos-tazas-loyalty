import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/** IconButton — square, icon-only action. Used for toolbar / row actions. */
const iconButtonVariants = cva(
  "inline-flex items-center justify-center rounded-full transition-all outline-none focus-visible:ring-2 focus-visible:ring-coffee-fruit/40 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-warm-roast text-white hover:bg-coffee-fruit",
        soft: "bg-warm-roast/10 text-expresso hover:bg-warm-roast/20",
        ghost: "text-expresso/70 hover:bg-warm-roast/10 hover:text-expresso",
        outline: "border border-warm-roast/30 text-expresso hover:bg-warm-roast/5",
        destructive: "text-destructive hover:bg-destructive/10",
      },
      size: {
        sm: "size-8 [&_svg]:size-4",
        md: "size-10 [&_svg]:size-5",
        lg: "size-12 [&_svg]:size-6",
      },
    },
    defaultVariants: { variant: "soft", size: "md" },
  },
);

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {
  /** Accessible label — icon-only buttons must always have one. */
  label: string;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant, size, label, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        aria-label={label}
        title={label}
        className={cn(iconButtonVariants({ variant, size }), className)}
        {...props}
      >
        {children}
      </button>
    );
  },
);
IconButton.displayName = "IconButton";
