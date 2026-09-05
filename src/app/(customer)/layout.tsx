import Link from "next/link";

import { DosTazasLogo } from "@/components/DosTazasLogo";

/**
 * Customer shell. Public by design — registering and browsing the club must
 * work for someone who has never had an account.
 *
 * The incomplete-profile guard deliberately does NOT live here. A layout cannot
 * see the current path, and driving it off a forwarded header meant that any
 * request where the header went missing redirected /account to itself — an
 * infinite loop. The individual pages call requireCompleteProfile() instead,
 * where the path is known statically and cannot be got wrong.
 */
export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-warm-roast/10">
        <div className="mx-auto flex max-w-md items-center justify-between px-5 py-4">
          <Link href="/loyalty" className="flex items-center gap-2.5">
            <DosTazasLogo className="size-9" />
            <span className="text-base font-heading text-expresso leading-none">
              Club de Lealtad
            </span>
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md px-5 py-8 pb-16">{children}</main>

      <footer className="pb-8 text-center text-xs text-expresso/40">
        Dos Tazas · Café de Costa Rica
      </footer>
    </div>
  );
}
