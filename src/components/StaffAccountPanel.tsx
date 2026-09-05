"use client";

import { LogOut, ScanLine } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button, Surface, buttonVariants } from "@/design-system";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { PageHeader } from "./PageHeader";

/**
 * What a staff member sees on /account when they hold no loyalty card.
 *
 * They are not asked for a cédula. Staff and customers share one Supabase Auth
 * account system — being staff is a row in `public.staff`, not a separate
 * login — so a barista can land here perfectly legitimately, and the right
 * answer is to point them at the till rather than at an onboarding form.
 *
 * Registering a card is still offered, because a barista is allowed to be a
 * customer of the café they work at. It is just not required of them.
 */
export function StaffAccountPanel({ email }: { email: string }) {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/loyalty");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Personal de Dos Tazas" subtitle={email} />

      <Surface>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-coffee-fruit/10 text-coffee-fruit">
              <ScanLine className="size-4" />
            </span>
            <p className="text-sm text-expresso/70">
              Tu cuenta es de personal. Desde la caja podés escanear tarjetas para acumular
              y canjear puntos.
            </p>
          </div>

          <Link
            href="/admin/scanner"
            className={cn(
              buttonVariants({ variant: "accent", size: "lg", pill: true }),
              "w-full gap-2"
            )}
          >
            <ScanLine className="size-4" />
            Ir al escáner
          </Link>
        </div>
      </Surface>

      <Surface className="bg-warm-roast/5">
        <div className="space-y-3">
          <h2 className="text-base font-heading text-expresso">¿Querés tu propia tarjeta?</h2>
          <p className="text-sm text-expresso/70">
            Podés crear una tarjeta de cliente con tu cédula. No es obligatorio.
          </p>
          <Link
            href="/register"
            className={cn(
              buttonVariants({ variant: "secondary", size: "lg", pill: true }),
              "w-full"
            )}
          >
            Crear mi tarjeta
          </Link>
        </div>
      </Surface>

      <Button variant="ghost" pill className="w-full" leadingIcon={<LogOut />} onClick={signOut}>
        Cerrar sesión
      </Button>
    </div>
  );
}
