import { DosTazasLogo } from "@/components/DosTazasLogo";

/**
 * Staff shell. The session check lives in middleware; being a *barista* rather
 * than merely signed in is enforced per-query by is_staff() inside the RPCs,
 * so this layout is presentation only.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-warm-roast/10 bg-card">
        <div className="mx-auto flex max-w-lg items-center gap-2.5 px-5 py-4">
          <DosTazasLogo className="size-8" />
          <span className="text-sm font-heading text-expresso leading-none">Caja · Lealtad</span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg px-5 py-6 pb-16">{children}</main>
    </div>
  );
}
