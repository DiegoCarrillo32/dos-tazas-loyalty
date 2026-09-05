"use client";

import { Lock, Mail } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Alert, Button, Field, Input, Surface } from "@/design-system";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "./PageHeader";

/**
 * Staff sign-in. Email + password, matching how baristas already log into the
 * POS app — no OAuth here, because these are provisioned accounts rather than
 * self-served ones.
 */
export function StaffLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

      if (signInError) {
        // One message for both a wrong password and an unknown address: a
        // login form that distinguishes them tells an attacker which staff
        // emails are real.
        setError("Correo o contraseña incorrectos.");
        return;
      }

      const next = searchParams.get("next");
      const safeNext = next?.startsWith("/admin") ? next : "/admin/scanner";
      router.push(safeNext);
      router.refresh();
    } catch {
      setError("No pudimos conectar. Revisá la red e intentá de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Ingreso de personal" subtitle="Solo para baristas de Dos Tazas." />

      <Surface>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Correo" htmlFor="email" required>
            <Input
              id="email"
              maxLength={254}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              disabled={submitting}
              leadingIcon={<Mail />}
              required
            />
          </Field>

          <Field label="Contraseña" htmlFor="password" required>
            <Input
              id="password"
              maxLength={128}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={submitting}
              leadingIcon={<Lock />}
              required
            />
          </Field>

          {error && <Alert tone="danger">{error}</Alert>}

          <Button variant="accent" type="submit" loading={submitting} pill size="lg" className="w-full">
            Entrar
          </Button>
        </form>
      </Surface>
    </div>
  );
}
