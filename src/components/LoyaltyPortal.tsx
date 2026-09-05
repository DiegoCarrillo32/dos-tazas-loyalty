import { CreditCard, LogIn } from "lucide-react";
import Link from "next/link";

import { Surface, SurfaceHeader, buttonVariants } from "@/design-system";
import { cn } from "@/lib/utils";
import type { Reward } from "@/types";
import { PageHeader } from "./PageHeader";
import { RewardPath } from "./RewardPath";

/**
 * The public landing page.
 *
 * There is deliberately no "check my points" form here any more. Reading a
 * balance used to take a cédula and a phone number, which meant a semi-public
 * identifier plus a guessable one stood between a stranger and someone's name
 * and points. Now a balance is visible only to whoever holds the card or is
 * signed in to the account it belongs to.
 */
export function LoyaltyPortal({ rewards }: { rewards: Reward[] }) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Club de Lealtad"
        subtitle="Acumulá 1 punto por cada ₡1.000 y canjealos por café."
      />

      <Surface>
        <div className="space-y-3">
          <Link
            href="/register"
            className={cn(
              buttonVariants({ variant: "accent", size: "lg", pill: true }),
              "w-full gap-2"
            )}
          >
            <CreditCard className="size-4" />
            Crear mi tarjeta
          </Link>
          <p className="text-center text-xs text-expresso/55">
            Solo tu cédula y tu nombre. Sin contraseñas.
          </p>

          <Link
            href="/account"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg", pill: true }),
              "w-full gap-2"
            )}
          >
            <LogIn className="size-4" />
            Ya tengo cuenta
          </Link>
        </div>
      </Surface>

      <Surface>
        <SurfaceHeader
          title="El camino"
          description="Desde tu primer café hasta una bolsa de grano."
          className="mb-4"
        />
        <RewardPath rewards={rewards} />
      </Surface>

      <Surface className="bg-warm-roast/5">
        <div className="space-y-2">
          <h2 className="text-base font-heading text-expresso">¿Cómo funciona?</h2>
          <ol className="space-y-2 text-sm text-expresso/70">
            <li>
              <span className="font-bold text-expresso">1.</span> Creá tu tarjeta con tu
              cédula y guardá el QR en tu teléfono.
            </li>
            <li>
              <span className="font-bold text-expresso">2.</span> Mostrala en caja cada vez
              que comprés y acumulá puntos.
            </li>
            <li>
              <span className="font-bold text-expresso">3.</span> Creá una cuenta para ver
              tu saldo desde cualquier dispositivo.
            </li>
          </ol>
        </div>
      </Surface>
    </div>
  );
}
