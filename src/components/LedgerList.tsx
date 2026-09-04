import { Coffee, Gift, Minus, Plus } from "lucide-react";

import { formatColones, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { LedgerEntry } from "@/types";

/** Point history, newest first. */
export function LedgerList({ entries, compact }: { entries: LedgerEntry[]; compact?: boolean }) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center">
        <Coffee className="size-6 text-expresso/30" />
        <p className="text-sm text-expresso/50">Todavía no hay movimientos.</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-warm-roast/10">
      {entries.map((entry) => {
        const isEarn = entry.points > 0;
        return (
          <li key={entry.id} className={cn("flex items-center gap-3", compact ? "py-2" : "py-3")}>
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full",
                isEarn ? "bg-coffee-fruit/10 text-coffee-fruit" : "bg-warm-roast/10 text-warm-roast"
              )}
            >
              {isEarn ? <Plus className="size-4" /> : <Gift className="size-4" />}
            </span>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-expresso">
                {entry.rewardName ??
                  (entry.purchaseAmount !== null
                    ? `Compra de ${formatColones(entry.purchaseAmount)}`
                    : "Ajuste")}
              </p>
              <p className="text-xs text-expresso/50">{formatDateTime(entry.createdAt)}</p>
            </div>

            <span
              className={cn(
                "shrink-0 text-sm font-bold tabular-nums",
                isEarn ? "text-coffee-fruit" : "text-warm-roast"
              )}
            >
              {isEarn ? <Plus className="inline size-3" /> : <Minus className="inline size-3" />}
              {Math.abs(entry.points)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
