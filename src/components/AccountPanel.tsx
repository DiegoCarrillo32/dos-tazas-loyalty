"use client";

import { LogOut, QrCode } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alert, Badge, Button, Field, Input, Surface, SurfaceHeader } from "@/design-system";
import { ApiRequestError, postJson } from "@/lib/api-client";
import { createClient } from "@/lib/supabase/client";
import { registerSchema } from "@/lib/validation";
import type { LedgerEntry, MemberCard, Reward } from "@/types";
import { LedgerList } from "./LedgerList";
import { LoyaltyCardPanel } from "./LoyaltyCardPanel";
import { PageHeader } from "./PageHeader";
import { RewardPath } from "./RewardPath";

export function AccountPanel({
  email,
  card,
  rewards,
  history,
  suggestedName = "",
}: {
  email: string;
  card: MemberCard | null;
  rewards: Reward[];
  history: LedgerEntry[];
  /** Prefilled from the Google profile when there is one. */
  suggestedName?: string;
}) {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/loyalty");
    router.refresh();
  }

  if (!card) {
    return (
      <CompleteProfileForm
        email={email}
        suggestedName={suggestedName}
        onDone={() => router.refresh()}
        onSignOut={signOut}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <PageHeader title={`Hola, ${card.fullName.split(" ")[0]}`} subtitle={email} />
        <Badge variant="solid">Miembro</Badge>
      </div>

      <LoyaltyCardPanel card={card} />

      <Surface>
        <SurfaceHeader title="Tu camino" description="Cada compra te acerca." className="mb-4" />
        <RewardPath rewards={rewards} balance={card.pointsBalance} tier={card.tier} />
      </Surface>

      <Surface>
        <SurfaceHeader title="Movimientos" className="mb-4" />
        <LedgerList entries={history} />
      </Surface>

      <Button variant="ghost" pill className="w-full" leadingIcon={<LogOut />} onClick={signOut}>
        Cerrar sesión
      </Button>
    </div>
  );
}

/**
 * Mandatory onboarding: an account is not usable until it has a card.
 *
 * The cédula is what ties a person to their points — it is the number a
 * barista looks up and the key the card is built on — so it is required here
 * rather than offered later. There is no way past this screen without either
 * creating a card or connecting an existing one, which is deliberate: an
 * account with no card can neither earn nor redeem anything.
 *
 * register_member() reads auth.uid() itself, so a card created from here is
 * attached to this account in the same statement. No separate claim step, and
 * no window where a freshly made card sits unowned.
 */
function CompleteProfileForm({
  email,
  suggestedName,
  onDone,
  onSignOut,
}: {
  email: string;
  suggestedName: string;
  onDone: () => void;
  onSignOut: () => void;
}) {
  const [fullName, setFullName] = useState(suggestedName);
  const [nationalId, setNationalId] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [showClaim, setShowClaim] = useState(false);
  const [payload, setPayload] = useState("");
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  async function createCard(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const parsed = registerSchema.safeParse({ fullName, nationalId, phone });
    if (!parsed.success) {
      setError({ code: "validation", message: parsed.error.issues[0]?.message ?? "Revisá los datos." });
      return;
    }

    setSubmitting(true);
    try {
      await postJson<MemberCard>("/api/loyalty/register", parsed.data);
      onDone();
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError({ code: err.code, message: err.message });
        // A cédula that already has a card can only be attached by proving
        // possession of it, so open that path rather than leaving them stuck.
        if (err.code === "member_exists") setShowClaim(true);
      } else {
        setError({ code: "server_error", message: "Algo salió mal. Intentá de nuevo." });
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function claimCard(event: React.FormEvent) {
    event.preventDefault();
    setClaimError(null);
    setClaiming(true);
    try {
      await postJson<MemberCard>("/api/loyalty/claim", { payload: payload.trim() });
      onDone();
    } catch (err) {
      setClaimError(
        err instanceof ApiRequestError ? err.message : "Algo salió mal. Intentá de nuevo."
      );
    } finally {
      setClaiming(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Completá tu perfil"
        subtitle={`Sesión iniciada como ${email}`}
      />

      <Surface>
        <form onSubmit={createCard} className="space-y-4">
          <p className="text-sm text-expresso/70">
            Necesitamos tu cédula para crear tu tarjeta. Es el número que la caja usa para
            darte tus puntos.
          </p>

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

          <Field label="Teléfono" htmlFor="phone" hint="Opcional.">
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
            <Alert tone={error.code === "member_exists" ? "info" : "danger"}>{error.message}</Alert>
          )}

          <Button
            variant="accent"
            type="submit"
            loading={submitting}
            pill
            size="lg"
            className="w-full"
          >
            Crear mi tarjeta
          </Button>
        </form>
      </Surface>

      <Surface className="bg-warm-roast/5">
        {showClaim ? (
          <form onSubmit={claimCard} className="space-y-4">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-coffee-fruit/10 text-coffee-fruit">
                <QrCode className="size-4" />
              </span>
              <p className="text-sm text-expresso/70">
                Pegá el código que aparece debajo del QR de tu tarjeta para conectarla a
                esta cuenta.
              </p>
            </div>

            <Field label="Código de la tarjeta" htmlFor="payload" hint="Empieza con DT1.">
              <Input
                id="payload"
              maxLength={200}
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
                placeholder="DT1.…"
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                disabled={claiming}
              />
            </Field>

            {claimError && <Alert tone="danger">{claimError}</Alert>}

            <Button
              type="submit"
              variant="secondary"
              loading={claiming}
              pill
              size="lg"
              className="w-full"
              disabled={!payload.trim()}
            >
              Conectar tarjeta
            </Button>
            <p className="text-center text-xs text-expresso/55">
              ¿Perdiste el código? Pedile ayuda a la caja con tu cédula.
            </p>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setShowClaim(true)}
            className="flex w-full items-center justify-center gap-2 text-sm font-bold text-coffee-fruit hover:underline"
          >
            <QrCode className="size-4" />
            Ya tengo una tarjeta
          </button>
        )}
      </Surface>

      <Button variant="ghost" pill className="w-full" leadingIcon={<LogOut />} onClick={onSignOut}>
        Cerrar sesión
      </Button>
    </div>
  );
}
