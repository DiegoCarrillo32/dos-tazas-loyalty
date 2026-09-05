import { formatPoints } from "@/lib/format";
import type { Reward } from "@/types";

/**
 * The headline above the path: balance, next goal, and a bar between them.
 *
 * Deliberately phrased as "te faltan N" rather than a percentage — the number
 * a customer can act on is how many more visits they need, not an abstraction.
 */
export function NextRewardHeadline({ points, next }: { points: number; next?: Reward }) {
  const remaining = next ? Math.max(next.pointsCost - points, 0) : 0;
  const pct = next ? Math.min(100, Math.round((points / next.pointsCost) * 100)) : 100;

  return (
    <div className="rounded-2xl bg-warm-roast/5 p-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-warm-roast">
            Tus puntos
          </p>
          <p className="text-3xl font-heading leading-none text-coffee-fruit">
            {formatPoints(points)}
          </p>
        </div>

        {next && (
          <p className="text-right text-xs text-expresso/70">
            Te faltan{" "}
            <span className="text-sm font-bold text-expresso">{formatPoints(remaining)}</span>
            <br />
            para <span className="font-bold text-expresso">{next.name}</span>
          </p>
        )}
      </div>

      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-warm-roast/15"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={next ? `Progreso hacia ${next.name}` : "Todas las recompensas desbloqueadas"}
      >
        <div
          className="h-full rounded-full bg-coffee-fruit transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
