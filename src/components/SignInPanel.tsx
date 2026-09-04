"use client";

import { Mail } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Alert, Button, Field, Input, Surface, toast } from "@/design-system";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "./PageHeader";
import { UpgradeBenefits } from "./UpgradeBenefits";

/**
 * Sign-in for the upgraded tier: Google OAuth, or a magic link by email.
 *
 * Magic link rather than email + password on purpose. This whole product is
 * built around not asking a coffee customer to invent and remember a password,
 * and adding one here only for the optional tier would be an odd place to
 * start. It also removes password reset, rotation and storage from scope.
 */
export function SignInPanel() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signInWithGoogle() {
    setError(null);
    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (oauthError) setError("No pudimos conectar con Google. Intentá de nuevo.");
  }

  async function signInWithEmail(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSending(true);
    try {
      const supabase = createClient();
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (otpError) throw otpError;
      setSent(true);
      toast.success("Revisá tu correo", "Te enviamos un enlace para entrar.");
    } catch {
      setError("No pudimos enviar el enlace. Revisá el correo e intentá de nuevo.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mejorá tu cuenta"
        subtitle="Vinculá tu tarjeta a una cuenta y desbloqueá beneficios."
      />

      <Surface>
        <UpgradeBenefits />
      </Surface>

      <Surface>
        <div className="space-y-4">
          <Button onClick={signInWithGoogle} variant="outline" size="lg" pill className="w-full">
            <GoogleMark />
            Continuar con Google
          </Button>

          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-warm-roast/15" />
            <span className="text-xs font-medium text-expresso/40">o</span>
            <span className="h-px flex-1 bg-warm-roast/15" />
          </div>

          {sent ? (
            <Alert tone="success" title="Enlace enviado">
              Abrí el correo que te mandamos a <strong>{email}</strong> para entrar.
            </Alert>
          ) : (
            <form onSubmit={signInWithEmail} className="space-y-4">
              <Field label="Correo electrónico" htmlFor="email">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="maria@correo.com"
                  autoComplete="email"
                  disabled={sending}
                  leadingIcon={<Mail />}
                  required
                />
              </Field>
              <Button variant="accent" type="submit" loading={sending} pill size="lg" className="w-full">
                Enviarme un enlace
              </Button>
            </form>
          )}

          {error && <Alert tone="danger">{error}</Alert>}
        </div>
      </Surface>

      <p className="text-center text-sm text-expresso/60">
        ¿Solo querés ver tus puntos?{" "}
        <Link href="/loyalty" className="font-bold text-coffee-fruit hover:underline">
          No necesitás cuenta
        </Link>
      </p>
    </div>
  );
}

/** Google's mark. Inline so it works offline, like every other asset here. */
function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden className="size-4">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.2 17.6 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-3.1-.4-4.6H24v9.1h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.2 5.6c4.2-3.9 6.6-9.6 6.6-16.4z" />
      <path fill="#FBBC05" d="M10.4 28.7c-.5-1.4-.8-2.9-.8-4.7s.3-3.3.8-4.7l-7.8-6.1C.9 16.3 0 20 0 24s.9 7.7 2.6 10.8l7.8-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.2-5.6c-2 1.4-4.6 2.2-8.7 2.2-6.4 0-11.7-3.7-13.6-9.1l-7.8 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}
