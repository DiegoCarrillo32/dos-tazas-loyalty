import { Smartphone } from "lucide-react";
import Link from "next/link";

import { Surface, buttonVariants } from "@/design-system";
import { cn } from "@/lib/utils";

/**
 * Shown after an anonymous registration.
 *
 * This is the one moment the customer must understand: with no account, the
 * downloaded card *is* the only way back to their points. Creating an account
 * is what makes the balance readable from any device — and claiming the card
 * later requires this QR, so losing it matters.
 */
export function SaveYourCardNotice() {
  return (
    <Surface className="bg-warm-roast/5">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-coffee-fruit/10 text-coffee-fruit">
            <Smartphone className="size-4" />
          </span>
          <div>
            <h2 className="text-base font-heading text-expresso">Guardá tu tarjeta</h2>
            <p className="mt-1 text-sm text-expresso/70">
              Descargala y mostrala en caja. Sin cuenta, esta imagen es tu única forma de
              volver a tus puntos.
            </p>
          </div>
        </div>

        <p className="text-sm text-expresso/70">
          Creá una cuenta para consultar tu saldo desde cualquier dispositivo y desbloquear
          recompensas de miembro.
        </p>

        <Link
          href="/account"
          className={cn(buttonVariants({ variant: "secondary", size: "lg", pill: true }), "w-full")}
        >
          Crear mi cuenta
        </Link>
      </div>
    </Surface>
  );
}
