import { Check, Coffee, Lock, Sparkles } from "lucide-react";

import { formatPoints } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Reward } from "@/types";
import { NextRewardHeadline } from "./NextRewardHeadline";

/**
 * The reward catalogue as a journey rather than a price list.
 *
 * A flat list of costs makes someone compute their own progress. A path
 * answers the only two questions a customer actually has — what have I
 * unlocked, and how far is the next one — by showing the rewards in ascending
 * cost as milestones along a track that fills to the current balance.
 *
 * Rendered as a server component: it is pure presentation over data the page
 * already has, so it costs no client JavaScript.
 */
export function RewardPath({
  rewards,
  balance,
  tier = "member",
}: {
  rewards: Reward[];
  /** Omitted for the signed-out catalogue, where there is no progress to show. */
  balance?: number;
  tier?: "basic" | "member";
}) {
  if (rewards.length === 0) {
    return <p className="text-sm text-expresso/50">Todavía no hay recompensas disponibles.</p>;
  }

  // Cheapest first: the path only reads as progress if it ascends.
  const sorted = [...rewards].sort((a, b) => a.pointsCost - b.pointsCost);
  const showProgress = balance !== undefined;
  const points = balance ?? 0;

  const next = showProgress
    ? sorted.find((r) => r.pointsCost > points && (!r.memberOnly || tier === "member"))
    : undefined;
  const goal = next?.pointsCost ?? sorted[sorted.length - 1].pointsCost;

  return (
    <div className="space-y-5">
      {showProgress && <NextRewardHeadline points={points} next={next} />}

      <ol className="relative">
        {/* The track itself. Sits behind the milestones and is inset by half a
            marker so it starts and ends at their centres. */}
        <span
          aria-hidden
          className="absolute left-[19px] top-4 bottom-4 w-0.5 rounded-full bg-warm-roast/15"
        />
        {showProgress && (
          <span
            aria-hidden
            className="absolute left-[19px] top-4 w-0.5 rounded-full bg-coffee-fruit transition-[height]"
            style={{ height: `${fillPercent(sorted, points)}%` }}
          />
        )}

        {sorted.map((reward) => {
          const reached = showProgress && points >= reward.pointsCost;
          const blocked = reward.memberOnly && tier !== "member";
          const isNext = next?.id === reward.id;

          return (
            <li key={reward.id} className="relative flex gap-4 pb-6 last:pb-0">
              <span
                className={cn(
                  "relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  reached
                    ? "border-coffee-fruit bg-coffee-fruit text-white"
                    : isNext
                      ? "border-coffee-fruit bg-background text-coffee-fruit"
                      : "border-warm-roast/20 bg-background text-warm-roast/50"
                )}
              >
                {reached ? (
                  <Check className="size-4" />
                ) : blocked ? (
                  <Lock className="size-4" />
                ) : reward.memberOnly ? (
                  <Sparkles className="size-4" />
                ) : (
                  <Coffee className="size-4" />
                )}
              </span>

              <div className={cn("min-w-0 flex-1 pt-1", !reached && !isNext && "opacity-70")}>
                <div className="flex items-baseline justify-between gap-3">
                  <p
                    className={cn(
                      "text-sm font-bold",
                      reached ? "text-expresso" : "text-expresso/80"
                    )}
                  >
                    {reward.name}
                  </p>
                  <span
                    className={cn(
                      "shrink-0 text-sm font-bold tabular-nums",
                      reached ? "text-coffee-fruit" : "text-expresso/50"
                    )}
                  >
                    {formatPoints(reward.pointsCost)}
                  </span>
                </div>

                {reward.description && (
                  <p className="mt-0.5 text-xs text-expresso/60">{reward.description}</p>
                )}

                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  {reached && (
                    <span className="rounded-full bg-coffee-fruit/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-coffee-fruit">
                      Disponible
                    </span>
                  )}
                  {isNext && !reached && (
                    <span className="rounded-full bg-warm-roast/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-warm-roast">
                      Te faltan {reward.pointsCost - points}
                    </span>
                  )}
                  {reward.memberOnly && (
                    <span className="rounded-full border border-warm-roast/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-expresso/55">
                      Solo miembros
                    </span>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {showProgress && !next && (
        <p className="text-center text-sm font-medium text-coffee-fruit">
          ¡Desbloqueaste todas las recompensas! 🎉
        </p>
      )}

      {!showProgress && (
        <p className="text-center text-xs text-expresso/55">
          Acumulá 1 punto por cada ₡1.000 de compra.
        </p>
      )}

      <span className="sr-only">
        {showProgress
          ? `Tenés ${points} puntos. ${
              next ? `Te faltan ${next.pointsCost - points} para ${next.name}.` : "Alcanzaste todas las recompensas."
            }`
          : `Recompensas disponibles desde ${sorted[0].pointsCost} puntos hasta ${goal}.`}
      </span>
    </div>
  );
}

/** How far up the track the fill should reach, as a percentage of its height. */
function fillPercent(sorted: Reward[], points: number): number {
  const max = sorted[sorted.length - 1].pointsCost;
  if (max <= 0) return 0;
  // Each milestone occupies an equal slice of the track regardless of its cost,
  // so interpolate between the two it currently sits between rather than
  // against the raw point range — otherwise a single expensive reward at the
  // end squashes all the early progress into a sliver.
  const idx = sorted.findIndex((r) => r.pointsCost > points);
  const slice = 100 / Math.max(sorted.length - 1, 1);

  if (idx === -1) return 100;
  if (idx === 0) {
    return Math.min(slice, (points / sorted[0].pointsCost) * slice);
  }

  const prev = sorted[idx - 1].pointsCost;
  const span = sorted[idx].pointsCost - prev;
  const within = span > 0 ? (points - prev) / span : 0;
  return Math.min(100, (idx - 1 + within) * slice + slice);
}
