import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Surface — the canonical Dos Tazas card. Warm `rounded-2xl` container with a
 * soft `shadow-warm-roast/5` and `border-warm-roast/10`. `interactive` adds the
 * hover-elevation used for clickable cards.
 */
const surfaceVariants = cva("bg-card text-card-foreground", {
  variants: {
    elevation: {
      flat: "border border-warm-roast/10",
      resting: "border border-warm-roast/10 shadow-sm shadow-warm-roast/5",
      raised: "border border-warm-roast/10 shadow-md shadow-warm-roast/10",
    },
    radius: {
      xl: "rounded-xl",
      "2xl": "rounded-2xl",
    },
    padding: {
      none: "",
      sm: "p-4",
      md: "p-6",
    },
    interactive: {
      true: "transition-shadow hover:shadow-md hover:shadow-warm-roast/10",
      false: "",
    },
  },
  defaultVariants: { elevation: "resting", radius: "2xl", padding: "md", interactive: false },
});

export interface SurfaceProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof surfaceVariants> {}

export function Surface({ className, elevation, radius, padding, interactive, ...props }: SurfaceProps) {
  return (
    <div
      data-slot="surface"
      className={cn(surfaceVariants({ elevation, radius, padding, interactive }), className)}
      {...props}
    />
  );
}

export function SurfaceHeader({
  title,
  description,
  action,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div>
        <h3 className="text-lg font-heading text-expresso">{title}</h3>
        {description && <p className="mt-0.5 text-sm text-expresso/60">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
