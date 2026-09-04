import { Coffee, Lock } from "lucide-react";

import { Badge } from "@/design-system";
import { formatPoints } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Reward } from "@/types";

/** Read-only reward catalogue. The scanner has its own interactive version. */
export function RewardList({ rewards, balance }: { rewards: Reward[]; balance?: number }) {
  if (rewards.length === 0) {
    return <p className="text-sm text-expresso/50">Todavía no hay recompensas disponibles.</p>;
  }

  return (
    <ul className="divide-y divide-warm-roast/10">
      {rewards.map((reward) => {
        const affordable = balance !== undefined && balance >= reward.pointsCost;
        return (
          <li key={reward.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
            <span
              className={cn(
                "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
                affordable ? "bg-coffee-fruit/10 text-coffee-fruit" : "bg-warm-roast/10 text-warm-roast"
              )}
            >
              {reward.memberOnly ? <Lock className="size-4" /> : <Coffee className="size-4" />}
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm font-bold text-expresso">{reward.name}</p>
                <span className="shrink-0 text-sm font-bold text-coffee-fruit">
                  {formatPoints(reward.pointsCost)} pts
                </span>
              </div>
              {reward.description && (
                <p className="mt-0.5 text-xs text-expresso/60">{reward.description}</p>
              )}
              {reward.memberOnly && (
                <Badge variant="outline" className="mt-1.5">
                  Solo miembros
                </Badge>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
