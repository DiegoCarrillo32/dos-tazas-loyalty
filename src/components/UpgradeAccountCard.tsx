"use client";

import { Cake, Sparkles, Star } from "lucide-react";
import Link from "next/link";

import { Surface, buttonVariants } from "@/design-system";
import { cn } from "@/lib/utils";

const BENEFITS = [
  { icon: Star, text: "Descuentos exclusivos para miembros" },
  { icon: Cake, text: "Bebida y repostería gratis en tu cumpleaños" },
  { icon: Sparkles, text: "Acceso anticipado a cada nuevo lote de grano" },
];

/**
 * The upgrade pitch shown to a `basic` member.
 *
 * Framed as additive on purpose: the passwordless card keeps working exactly
 * as it does today, and creating an account only adds to it. Nothing here
 * should read as though the customer is at risk of losing their points.
 */
export function UpgradeAccountCard() {
  return (
    <Surface className="bg-warm-roast/5">
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-heading text-expresso">Mejorá tu cuenta</h2>
          <p className="mt-0.5 text-sm text-expresso/70">
            Tu tarjeta sigue igual. Creá una cuenta y sumá estos beneficios:
          </p>
        </div>

        <ul className="space-y-2.5">
          {BENEFITS.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-2.5 text-sm text-expresso/80">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-coffee-fruit/10 text-coffee-fruit">
                <Icon className="size-3.5" />
              </span>
              {text}
            </li>
          ))}
        </ul>

        {/* The design system's Button is a plain <button> with no `asChild`
            escape hatch, so a navigation action borrows its variants rather
            than nesting a link inside a button. */}
        <Link
          href="/cuenta"
          className={cn(buttonVariants({ variant: "secondary", size: "lg", pill: true }), "w-full")}
        >
          Crear mi cuenta
        </Link>
      </div>
    </Surface>
  );
}
