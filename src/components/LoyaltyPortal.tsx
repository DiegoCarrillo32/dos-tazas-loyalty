"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Alert, Button, Surface, SurfaceHeader, buttonVariants } from "@/design-system";
import { ApiRequestError, postJson } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { lookupSchema } from "@/lib/validation";
import type { MemberCard, Reward } from "@/types";
import { IdentityFields } from "./IdentityFields";
import { LoyaltyCardPanel } from "./LoyaltyCardPanel";
import { PageHeader } from "./PageHeader";
import { RewardList } from "./RewardList";
import { UpgradeAccountCard } from "./UpgradeAccountCard";

export function LoyaltyPortal({ rewards }: { rewards: Reward[] }) {
  const [nationalId, setNationalId] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [card, setCard] = useState<MemberCard | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const parsed = lookupSchema.safeParse({ nationalId, phone });
    if (!parsed.success) {
      setError({ code: "validation", message: parsed.error.issues[0]?.message ?? "Revisá los datos." });
      return;
    }

    setSubmitting(true);
    try {
      const result = await postJson<MemberCard>("/api/loyalty/lookup", parsed.data);
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
        <PageHeader title={`Hola, ${card.fullName.split(" ")[0]}`} subtitle="Esta es tu tarjeta." />

        <LoyaltyCardPanel card={card} />

        <Surface>
          <SurfaceHeader
            title="Recompensas"
            description={`Tenés ${card.pointsBalance} ${card.pointsBalance === 1 ? "punto" : "puntos"}.`}
            className="mb-4"
          />
          <RewardList rewards={rewards} balance={card.pointsBalance} />
        </Surface>

        {card.tier === "basic" && <UpgradeAccountCard />}

        <Button
          variant="ghost"
          pill
          className="w-full"
          onClick={() => {
            setCard(null);
            setNationalId("");
            setPhone("");
          }}
        >
          Consultar otra tarjeta
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mis puntos"
        subtitle="Ingresá tu cédula y teléfono para ver tu tarjeta."
      />

      <Surface>
        <form onSubmit={handleSubmit} className="space-y-4">
          <IdentityFields
            nationalId={nationalId}
            phone={phone}
            onNationalIdChange={setNationalId}
            onPhoneChange={setPhone}
            disabled={submitting}
          />

          {error && (
            <Alert tone={error.code === "not_found" ? "warning" : "danger"}>
              {error.message}
              {error.code === "not_found" && (
                <>
                  {" "}
                  <Link href="/register" className="font-bold underline underline-offset-2">
                    Crear una tarjeta
                  </Link>
                </>
              )}
            </Alert>
          )}

          <Button variant="accent"
            type="submit"
            loading={submitting}
            leadingIcon={<Search />}
            pill
            size="lg"
            className="w-full"
          >
            Ver mis puntos
          </Button>
        </form>
      </Surface>

      <Surface>
        <SurfaceHeader
          title="Qué podés canjear"
          description="Acumulá 1 punto por cada ₡1.000 de compra."
          className="mb-4"
        />
        <RewardList rewards={rewards} />
      </Surface>

      <div className="space-y-2 text-center">
        <p className="text-sm text-expresso/60">¿Todavía no tenés tarjeta?</p>
        <Link
          href="/register"
          className={cn(buttonVariants({ variant: "accent", size: "lg", pill: true }), "w-full")}
        >
          Crear mi tarjeta
        </Link>
      </div>
    </div>
  );
}
