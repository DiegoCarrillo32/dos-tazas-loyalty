"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alert, Badge, Button, Surface, SurfaceHeader } from "@/design-system";
import { ApiRequestError, postJson } from "@/lib/api-client";
import { createClient } from "@/lib/supabase/client";
import { lookupSchema } from "@/lib/validation";
import type { LedgerEntry, MemberCard, Reward } from "@/types";
import { IdentityFields } from "./IdentityFields";
import { LedgerList } from "./LedgerList";
import { LoyaltyCardPanel } from "./LoyaltyCardPanel";
import { PageHeader } from "./PageHeader";
import { RewardList } from "./RewardList";
import { UpgradeBenefits } from "./UpgradeBenefits";

export function AccountPanel({
  email,
  card,
  rewards,
  history,
}: {
  email: string;
  card: MemberCard | null;
  rewards: Reward[];
  history: LedgerEntry[];
}) {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/loyalty");
    router.refresh();
  }

  if (!card) {
    return <LinkCardForm email={email} onLinked={() => router.refresh()} onSignOut={signOut} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <PageHeader
          title={`Hola, ${card.fullName.split(" ")[0]}`}
          subtitle={email}
        />
        <Badge variant="solid">Miembro</Badge>
      </div>

      <LoyaltyCardPanel card={card} />

      <Surface>
        <SurfaceHeader
          title="Recompensas"
          description="Ya podés canjear las marcadas en rojo."
          className="mb-4"
        />
        <RewardList rewards={rewards} balance={card.pointsBalance} />
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
 * Shown when someone signs in but has not yet attached their existing card.
 *
 * This is the actual merge step for the upgrade tier: proving the cédula and
 * phone is what moves an anonymous card onto this account and flips the member
 * to the `member` tier.
 */
function LinkCardForm({
  email,
  onLinked,
  onSignOut,
}: {
  email: string;
  onLinked: () => void;
  onSignOut: () => void;
}) {
  const [nationalId, setNationalId] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const parsed = lookupSchema.safeParse({ nationalId, phone });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Revisá los datos.");
      return;
    }

    setSubmitting(true);
    try {
      await postJson<MemberCard>("/api/loyalty/link", parsed.data);
      onLinked();
    } catch (err) {
      setError(
        err instanceof ApiRequestError ? err.message : "Algo salió mal. Intentá de nuevo."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Vinculá tu tarjeta" subtitle={`Sesión iniciada como ${email}`} />

      <Surface>
        <UpgradeBenefits />
      </Surface>

      <Surface>
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-expresso/70">
            Ingresá la cédula y el teléfono de tu tarjeta actual para conectarla a esta cuenta.
          </p>

          <IdentityFields
            nationalId={nationalId}
            phone={phone}
            onNationalIdChange={setNationalId}
            onPhoneChange={setPhone}
            disabled={submitting}
          />

          {error && <Alert tone="danger">{error}</Alert>}

          <Button variant="accent" type="submit" loading={submitting} pill size="lg" className="w-full">
            Vincular mi tarjeta
          </Button>
        </form>
      </Surface>

      <Button variant="ghost" pill className="w-full" leadingIcon={<LogOut />} onClick={onSignOut}>
        Cerrar sesión
      </Button>
    </div>
  );
}
