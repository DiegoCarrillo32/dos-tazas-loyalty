import * as React from "react";
import { Info, CircleCheck, TriangleAlert, OctagonX } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const alertVariants = cva("flex gap-3 rounded-xl border p-4 text-sm", {
  variants: {
    tone: {
      info: "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-200",
      success:
        "border-green-200 bg-green-50 text-green-900 dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-200",
      warning:
        "border-yellow-200 bg-yellow-50 text-yellow-900 dark:border-yellow-900/40 dark:bg-yellow-900/20 dark:text-yellow-200",
      danger: "border-red-200 bg-red-50 text-red-900 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200",
      brand: "border-warm-roast/15 bg-warm-roast/5 text-expresso",
    },
  },
  defaultVariants: { tone: "brand" },
});

const toneIcon = {
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  danger: OctagonX,
  brand: Info,
} as const;

export interface AlertProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title">,
    VariantProps<typeof alertVariants> {
  title?: React.ReactNode;
  icon?: React.ReactNode;
  /** Optional action node rendered on the trailing edge. */
  action?: React.ReactNode;
}

/** Alert — inline callout for info / success / warning / error / brand notices. */
export function Alert({ className, tone = "brand", title, icon, action, children, ...props }: AlertProps) {
  const Icon = toneIcon[tone ?? "brand"];
  return (
    <div role="alert" className={cn(alertVariants({ tone }), className)} {...props}>
      <span className="mt-0.5 shrink-0 [&_svg]:size-5">{icon ?? <Icon aria-hidden />}</span>
      <div className="flex-1">
        {title && <p className="font-bold">{title}</p>}
        {children && <div className={cn(title && "mt-0.5", "text-current/80")}>{children}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
