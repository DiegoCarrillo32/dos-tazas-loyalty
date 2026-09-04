import * as React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

import { cn } from "@/lib/utils";

export interface StatCardProps {
  label: React.ReactNode;
  value: React.ReactNode;
  icon?: React.ReactNode;
  /** Signed percentage change; sign drives the up/down treatment. */
  change?: number;
  changeSuffix?: React.ReactNode;
  className?: string;
}

/** StatCard — KPI tile with icon and optional trend delta. */
export function StatCard({ label, value, icon, change, changeSuffix, className }: StatCardProps) {
  const up = (change ?? 0) >= 0;
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-warm-roast/10 bg-card p-5 shadow-sm shadow-warm-roast/5",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-expresso/60">{label}</span>
        {icon && (
          <span className="flex size-9 items-center justify-center rounded-full bg-coffee-fruit/10 text-coffee-fruit [&_svg]:size-4">
            {icon}
          </span>
        )}
      </div>
      <div className="flex items-end justify-between gap-2">
        <span className="text-3xl font-heading text-expresso">{value}</span>
        {change !== undefined && (
          <span
            className={cn(
              "mb-1 inline-flex items-center gap-0.5 text-xs font-bold",
              up ? "text-green-600 dark:text-green-400" : "text-coffee-fruit",
            )}
          >
            {up ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
            {Math.abs(change)}%{changeSuffix && <span className="ml-1 font-medium text-expresso/40">{changeSuffix}</span>}
          </span>
        )}
      </div>
    </div>
  );
}
