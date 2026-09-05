"use client";

import { Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alert, Button, Field, Input, Surface, toast } from "@/design-system";
import { createClient } from "@/lib/supabase/client";
import { credentialsSchema } from "@/lib/validation";
import { GoogleMark } from "./GoogleMark";
import { PageHeader } from "./PageHeader";
import { UpgradeBenefits } from "./UpgradeBenefits";

type Mode = "signin" | "signup";

/**
 * Account sign-in: Google, or email + password.
 *
 * Everything here delegates to Supabase Auth. No password is hashed, stored,
 * compared or reset by this app — that machinery already exists, is tested, and
 * gets security fixes without us. It is also what makes "Google and password
 * reach the same account" true for free: Supabase attaches an OAuth identity to
 * the existing user with the same confirmed email.
 */
export function SignInPanel({ authError }: { authError?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(
    authError === "link"
      ? "Ese enlace ya venció o fue usado. Pedí uno nuevo."
      : authError === "auth"
        ? "No pudimos completar el inicio de sesión. Intentá de nuevo."
        : null
  );

  async function signInWithGoogle() {
    setError(null);
    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (oauthError) setError("No pudimos conectar con Google. Intentá de nuevo.");
  }

  async function submitCredentials(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const parsed = credentialsSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Revisá los datos.");
      return;
    }

    setBusy(true);
    try {
      const supabase = createClient();

      if (mode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
        });
        if (signUpError) throw signUpError;
        setSent(true);
        toast.success("Revisá tu correo", "Te enviamos un enlace para confirmar tu cuenta.");
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
      });
      if (signInError) {
        // One message for a wrong password and an unknown address alike: telling
        // them apart would confirm which emails have accounts here.
        setError("Correo o contraseña incorrectos.");
        return;
      }
      router.refresh();
    } catch {
      setError("No pudimos completar la operación. Intentá de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  async function sendReset() {
    const parsed = credentialsSchema.shape.email.safeParse(email);
    if (!parsed.success) {
      setError("Escribí tu correo primero y volvé a tocar “Olvidé mi contraseña”.");
      return;
    }
    setBusy(true);
    try {
      const supabase = createClient();
      await supabase.auth.resetPasswordForEmail(parsed.data, {
        redirectTo: `${window.location.origin}/auth/confirm?next=/reset-password`,
      });
      // Always report success: whether an address has an account is not
      // something this form should reveal.
      toast.success("Revisá tu correo", "Si esa dirección tiene cuenta, te enviamos un enlace.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={mode === "signup" ? "Crear mi cuenta" : "Iniciar sesión"}
        subtitle="Consultá tus puntos desde cualquier dispositivo."
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
            <Alert tone="success" title="Revisá tu correo">
              Te enviamos un enlace a <strong>{email}</strong> para confirmar tu cuenta.
            </Alert>
          ) : (
            <form onSubmit={submitCredentials} className="space-y-4">
              <Field label="Correo electrónico" htmlFor="email" required>
                <Input
                  id="email"
              maxLength={254}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="maria@correo.com"
                  autoComplete="email"
                  disabled={busy}
                  leadingIcon={<Mail />}
                  required
                />
              </Field>

              <Field
                label="Contraseña"
                htmlFor="password"
                hint={mode === "signup" ? "Al menos 8 caracteres." : undefined}
                required
              >
                <Input
                  id="password"
              maxLength={128}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  disabled={busy}
                  leadingIcon={<Lock />}
                  required
                />
              </Field>

              {error && <Alert tone="danger">{error}</Alert>}

              <Button variant="accent" type="submit" loading={busy} pill size="lg" className="w-full">
                {mode === "signup" ? "Crear cuenta" : "Entrar"}
              </Button>
            </form>
          )}

          <div className="flex items-center justify-between gap-3 text-sm">
            <button
              type="button"
              className="font-bold text-coffee-fruit hover:underline"
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setError(null);
                setSent(false);
              }}
            >
              {mode === "signin" ? "Crear una cuenta" : "Ya tengo cuenta"}
            </button>

            {mode === "signin" && (
              <button
                type="button"
                className="text-expresso/60 hover:underline"
                onClick={sendReset}
                disabled={busy}
              >
                Olvidé mi contraseña
              </button>
            )}
          </div>
        </div>
      </Surface>

      <p className="text-center text-sm text-expresso/60">
        ¿Todavía no tenés tarjeta?{" "}
        <Link href="/register" className="font-bold text-coffee-fruit hover:underline">
          Creala en segundos
        </Link>
      </p>
    </div>
  );
}
