"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Alert, Button, Field, Input, Surface } from "@/design-system";
import { ApiRequestError, postJson } from "@/lib/api-client";
import { registerSchema } from "@/lib/validation";
import type { MemberCard } from "@/types";
import { LoyaltyCardPanel } from "./LoyaltyCardPanel";
import { PageHeader } from "./PageHeader";
import { SaveYourCardNotice } from "./SaveYourCardNotice";

/**
 * The counter flow: cédula and name, nothing else required.
 *
 * The phone is optional contact detail, not a credential — nothing
 * authenticates against it. Keeping the required fields to two is the whole
 * point: this is filled in while someone waits for a coffee.
 */
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

    const parsed = registerSchema.safeParse({ fullName, nationalId, phone });
    if (!parsed.success) {
      setError({ code: "validation", message: parsed.error.issues[0]?.message ?? "Revisá los datos." });
      return;
    }

    setSubmitting(true);
    try {
      setCard(await postJson<MemberCard>("/api/loyalty/register", parsed.data));
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
          subtitle="Tu tarjeta ya está activa. Mostrala en caja para acumular puntos."
        />
        <LoyaltyCardPanel card={card} />
        {!card.linked && <SaveYourCardNotice />}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Crear mi tarjeta" subtitle="Solo tu cédula y tu nombre." />

      <Surface>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Nombre completo" htmlFor="fullName" required>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
              placeholder="María Rodríguez"
              maxLength={80}
              disabled={submitting}
              required
            />
          </Field>

          <Field
            label="Cédula"
            htmlFor="nationalId"
            hint="Sin guiones. También aceptamos DIMEX."
            required
          >
            <Input
              id="nationalId"
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value)}
              inputMode="numeric"
              autoComplete="off"
              placeholder="1 2345 6789"
              maxLength={16}
              disabled={submitting}
              required
            />
          </Field>

          <Field
            label="Teléfono"
            htmlFor="phone"
            hint="Opcional. Solo para contactarte sobre tus recompensas."
          >
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              autoComplete="tel"
              placeholder="8888 7777"
              maxLength={15}
              disabled={submitting}
            />
          </Field>

          {error && (
            <Alert tone={error.code === "member_exists" ? "info" : "danger"}>
              {error.message}
              {error.code === "member_exists" && (
                <>
                  {" "}
                  <Link href="/account" className="font-bold underline underline-offset-2">
                    Iniciá sesión para verla
                  </Link>
                </>
              )}
            </Alert>
          )}

          <Button
            variant="accent"
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
        ¿Ya tenés cuenta?{" "}
        <Link href="/account" className="font-bold text-coffee-fruit hover:underline">
          Iniciá sesión
        </Link>
      </p>
    </div>
  );
}
