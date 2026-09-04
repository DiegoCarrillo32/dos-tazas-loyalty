import * as React from "react";
import { Loader2 } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Button — the workhorse action. The signature Dos Tazas CTA is the warm-roast
 * pill that warms to coffee-fruit on hover (`variant="primary" pill`).
 */
const buttonVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap font-bold transition-all outline-none select-none focus-visible:ring-2 focus-visible:ring-coffee-fruit/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-warm-roast text-white shadow-sm hover:bg-coffee-fruit",
        accent: "bg-coffee-fruit text-white shadow-sm hover:bg-fruit-light",
        secondary: "bg-warm-roast/10 text-expresso hover:bg-warm-roast/20",
        outline: "border border-warm-roast/30 text-expresso hover:bg-warm-roast/5 hover:border-warm-roast/50",
        ghost: "text-expresso/80 hover:bg-warm-roast/10 hover:text-expresso",
        destructive: "bg-destructive/10 text-destructive hover:bg-destructive/20",
        link: "text-coffee-fruit underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 px-3 text-xs [&_svg]:size-3.5",
        md: "h-10 px-4 text-sm [&_svg]:size-4",
        lg: "h-12 px-6 text-base [&_svg]:size-5",
      },
      pill: {
        true: "rounded-full",
        false: "rounded-xl",
      },
    },
    defaultVariants: { variant: "primary", size: "md", pill: false },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, pill, loading, leadingIcon, trailingIcon, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        data-slot="ds-button"
        disabled={disabled || loading}
        className={cn(buttonVariants({ variant, size, pill }), className)}
        {...props}
      >
        {loading && <Loader2 className="animate-spin" aria-hidden />}
        {!loading && leadingIcon}
        {children}
        {!loading && trailingIcon}
      </button>
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
