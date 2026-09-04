import * as React from "react";

import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

/** EmptyState — friendly placeholder for empty lists, searches, and tabs. */
export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-warm-roast/20 bg-warm-roast/5 px-6 py-12 text-center",
        className,
      )}
    >
      {icon && (
        <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-warm-roast/10 text-warm-roast [&_svg]:size-7">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-heading text-expresso">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-expresso/60">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
