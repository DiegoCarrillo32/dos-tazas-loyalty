import { cn } from "@/lib/utils";

/**
 * The documented Dos Tazas page-title recipe: `text-3xl font-heading
 * text-expresso` over a muted subtitle.
 *
 * The design system has no Typography component — headings are the
 * `font-heading` utility applied directly — so this exists purely to stop that
 * pairing being retyped on every screen, not to introduce a new abstraction.
 */
export function PageHeader({
  title,
  subtitle,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <h1 className="text-3xl font-heading text-expresso">{title}</h1>
      {subtitle && <p className="text-sm font-medium text-expresso/70">{subtitle}</p>}
    </div>
  );
}
