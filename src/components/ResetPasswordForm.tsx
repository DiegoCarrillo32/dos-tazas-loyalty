"use client";

import { Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alert, Button, Field, Input, Surface, toast } from "@/design-system";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "./PageHeader";

/**
 * Set a new password after following a recovery link.
 *
 * updateUser() applies to whoever the current session belongs to, so the
 * recovery session established by /auth/confirm is what authorizes this. The
 * confirmation field is not security — it catches typos, which matter more
 * than usual here because the customer is locked out if they mistype twice.
 */
export function ResetPasswordForm({ email }: { email: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setBusy(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      toast.success("Contraseña actualizada", "Ya podés entrar con tu nueva contraseña.");
      router.push("/account");
      router.refresh();
    } catch {
      setError("No pudimos actualizar la contraseña. Pedí un enlace nuevo e intentá de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Nueva contraseña" subtitle={email} />

      <Surface>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Nueva contraseña" htmlFor="password" hint="Al menos 8 caracteres." required>
            <Input
              id="password"
              maxLength={128}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              disabled={busy}
              leadingIcon={<Lock />}
              required
            />
          </Field>

          <Field label="Repetí la contraseña" htmlFor="confirm" required>
            <Input
              id="confirm"
              maxLength={128}
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              disabled={busy}
              leadingIcon={<Lock />}
              required
            />
          </Field>

          {error && <Alert tone="danger">{error}</Alert>}

          <Button variant="accent" type="submit" loading={busy} pill size="lg" className="w-full">
            Guardar contraseña
          </Button>
        </form>
      </Surface>
    </div>
  );
}
