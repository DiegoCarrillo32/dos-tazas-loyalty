"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Alert, Button, Field, Input, Surface } from "@/design-system";
import { ApiRequestError, postJson } from "@/lib/api-client";
import { registerSchema } from "@/lib/validation";
import type { MemberCard } from "@/types";
import { IdentityFields } from "./IdentityFields";
import { LoyaltyCardPanel } from "./LoyaltyCardPanel";
import { PageHeader } from "./PageHeader";
import { UpgradeAccountCard } from "./UpgradeAccountCard";

export function RegisterForm() {
  const [fullName, setFullName] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [card, setCard] = useState<MemberCard | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    // Client-side validation exists to answer instantly, not to be trusted —
    // /api/loyalty/register re-runs the same schema, and the RPC validates
    // again in SQL.
    const parsed = registerSchema.safeParse({ fullName, nationalId, phone });
    if (!parsed.success) {
      setError({ code: "validation", message: parsed.error.issues[0]?.message ?? "Revisá los datos." });
      return;
    }

    setSubmitting(true);
    try {
      const result = await postJson<MemberCard>("/api/loyalty/register", parsed.data);
      setCard(result);
    } catch (err) {
      if (err instanceof ApiRequestError) setError({ code: err.code, message: err.message });
      else setError({ code: "server_error", message: "Algo salió mal. Intentá de nuevo." });
    } finally {
      setSubmitting(false);
    }
  }

  if (card) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="¡Listo!"
          subtitle="Tu tarjeta ya está activa. Guardala para mostrarla en caja."
        />
        <LoyaltyCardPanel card={card} />
        <UpgradeAccountCard />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Crear mi tarjeta"
        subtitle="Sin contraseñas. Solo tu cédula y tu teléfono."
      />

      <Surface>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Nombre completo" htmlFor="fullName" required>
            <Input
              id="fullName"
              name="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
              placeholder="María Rodríguez"
              maxLength={80}
              disabled={submitting}
              required
            />
          </Field>

          <IdentityFields
            nationalId={nationalId}
            phone={phone}
            onNationalIdChange={setNationalId}
            onPhoneChange={setPhone}
            disabled={submitting}
          />

          {error && (
            <Alert tone={error.code === "member_exists" ? "info" : "danger"}>
              {error.message}
              {error.code === "member_exists" && (
                <>
                  {" "}
                  <Link href="/loyalty" className="font-bold underline underline-offset-2">
                    Consultar mis puntos
                  </Link>
                </>
              )}
            </Alert>
          )}

          <Button variant="accent"
            type="submit"
            loading={submitting}
            trailingIcon={<ArrowRight />}
            pill
            size="lg"
            className="w-full"
          >
            Crear mi tarjeta
          </Button>
        </form>
      </Surface>

      <p className="text-center text-sm text-expresso/60">
        ¿Ya tenés tarjeta?{" "}
        <Link href="/loyalty" className="font-bold text-coffee-fruit hover:underline">
          Consultá tus puntos
        </Link>
      </p>
    </div>
  );
}
