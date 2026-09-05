"use client";

import { Check, Gift, Plus, RotateCcw } from "lucide-react";
import { useState } from "react";

import {
  Alert,
  Badge,
  Button,
  Field,
  Input,
  Modal,
  Surface,
  SurfaceHeader,
  toast,
} from "@/design-system";
import { ApiRequestError, postJson } from "@/lib/api-client";
import { formatColones, formatPoints } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PointsMutationResult, Reward, ScanResult } from "@/types";
import { LedgerList } from "./LedgerList";

/** Kept in step with loyalty_settings.colones_per_point (default ₡1.000 = 1 punto). */
const COLONES_PER_POINT = 1000;

export function ScanResultPanel({
  result,
  onUpdated,
  onDone,
}: {
  result: ScanResult;
  onUpdated: (next: ScanResult) => void;
  onDone: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<Reward | null>(null);

  const parsedAmount = Number(amount.replace(/[^\d]/g, ""));
  const previewPoints = Number.isFinite(parsedAmount)
    ? Math.floor(parsedAmount / COLONES_PER_POINT)
    : 0;

  /**
   * A fresh idempotency key per attempt. If the request times out on café wifi
   * and the barista taps again, the retry carries a *new* key and is a genuine
   * second transaction — but a double-tap that fires two requests from one
   * intent shares the key and is collapsed server-side into one.
   */
  function newRequestId() {
    return crypto.randomUUID();
  }

  async function addPoints() {
    if (previewPoints <= 0) return;
    setBusy(true);
    setError(null);

    const clientRequestId = newRequestId();
    try {
      const res = await postJson<PointsMutationResult>("/api/points", {
        action: "earn",
        payload: result.qrPayload,
        amount: parsedAmount,
        clientRequestId,
      });

      applyBalance(res.pointsBalance);
      setAmount("");
      toast.success(
        `+${res.pointsAwarded} ${res.pointsAwarded === 1 ? "punto" : "puntos"}`,
        `${res.fullName} ahora tiene ${res.pointsBalance}.`
      );
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "No se pudo acumular.");
    } finally {
      setBusy(false);
    }
  }

  async function redeem(reward: Reward) {
    setBusy(true);
    setError(null);
    setConfirming(null);

    const clientRequestId = newRequestId();
    try {
      const res = await postJson<PointsMutationResult>("/api/points", {
        action: "redeem",
        payload: result.qrPayload,
        rewardId: reward.id,
        clientRequestId,
      });

      applyBalance(res.pointsBalance);
      toast.success("Canje realizado", `${reward.name} · saldo ${res.pointsBalance}.`);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "No se pudo canjear.");
    } finally {
      setBusy(false);
    }
  }

  /**
   * Re-derives which rewards are reachable at the new balance, so the buttons
   * enable and disable in step with what just happened rather than waiting for
   * a re-scan.
   */
  function applyBalance(pointsBalance: number) {
    onUpdated({
      ...result,
      pointsBalance,
      rewards: result.rewards.map((r) => ({
        ...r,
        redeemable:
          r.pointsCost <= pointsBalance && (!r.memberOnly || result.tier === "member"),
      })),
    });
  }

  return (
    <div className="space-y-5">
      <Surface>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-warm-roast">Cliente</p>
            {/* Wraps rather than truncates: the barista is using this line to
                confirm they have the right customer in front of them, and
                "María Rodrigu…" does not let them do that. */}
            <h1 className="mt-0.5 text-2xl font-heading text-expresso [overflow-wrap:anywhere]">
              {result.fullName}
            </h1>
          </div>
          {result.tier === "member" ? (
            <Badge variant="solid">Miembro</Badge>
          ) : (
            <Badge variant="soft">Básico</Badge>
          )}
        </div>

        <div className="mt-5 flex items-baseline gap-2">
          <span className="text-4xl font-heading text-coffee-fruit">
            {formatPoints(result.pointsBalance)}
          </span>
          <span className="text-sm font-medium text-expresso/60">
            {result.pointsBalance === 1 ? "punto" : "puntos"}
          </span>
        </div>
      </Surface>

      {error && (
        <Alert tone="danger" title="No se completó">
          {error}
        </Alert>
      )}

      <Surface>
        <SurfaceHeader
          title="Acumular puntos"
          description={`1 punto por cada ${formatColones(COLONES_PER_POINT)}`}
          className="mb-4"
        />

        <div className="space-y-3">
          <Field label="Monto de la compra" htmlFor="amount">
            <Input
              id="amount"
              maxLength={9}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="numeric"
              placeholder="3500"
              disabled={busy}
              leadingIcon={<span className="text-sm font-bold">₡</span>}
            />
          </Field>

          {previewPoints > 0 && (
            <p className="text-sm font-medium text-expresso/70">
              {formatColones(parsedAmount)} ={" "}
              <span className="font-bold text-coffee-fruit">
                +{previewPoints} {previewPoints === 1 ? "punto" : "puntos"}
              </span>
            </p>
          )}

          <Button variant="accent"
            onClick={addPoints}
            loading={busy}
            disabled={previewPoints <= 0}
            leadingIcon={<Plus />}
            pill
            size="lg"
            className="w-full"
          >
            Acumular
          </Button>
        </div>
      </Surface>

      <Surface>
        <SurfaceHeader
          title="Canjear recompensa"
          description={`${result.fullName.split(" ")[0]} tiene ${result.pointsBalance} puntos.`}
          className="mb-4"
        />

        <ul className="space-y-2">
          {result.rewards.map((reward) => (
            <li key={reward.id}>
              <button
                type="button"
                disabled={!reward.redeemable || busy}
                onClick={() => setConfirming(reward)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                  "disabled:cursor-not-allowed disabled:opacity-45",
                  reward.redeemable
                    ? "border-coffee-fruit/30 bg-coffee-fruit/5 hover:bg-coffee-fruit/10"
                    : "border-warm-roast/10"
                )}
              >
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-full",
                    reward.redeemable
                      ? "bg-coffee-fruit text-white"
                      : "bg-warm-roast/10 text-warm-roast"
                  )}
                >
                  <Gift className="size-4" />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-expresso">
                    {reward.name}
                  </span>
                  <span className="block text-xs text-expresso/55">
                    {reward.pointsCost} pts
                    {reward.memberOnly && result.tier !== "member" && " · solo miembros"}
                  </span>
                </span>

                {reward.redeemable && <Check className="size-4 shrink-0 text-coffee-fruit" />}
              </button>
            </li>
          ))}
        </ul>
      </Surface>

      {result.history.length > 0 && (
        <Surface>
          <SurfaceHeader title="Últimos movimientos" className="mb-3" />
          <LedgerList entries={result.history} compact />
        </Surface>
      )}

      <Button
        variant="outline"
        pill
        size="lg"
        className="w-full"
        leadingIcon={<RotateCcw />}
        onClick={onDone}
      >
        Escanear otra tarjeta
      </Button>

      {/* Redemption is irreversible from the barista's side, so it gets an
          explicit confirmation. Accumulating does not — a wrong amount is
          fixable by adding the difference. */}
      <Modal
        open={confirming !== null}
        onClose={() => setConfirming(null)}
        title="Confirmar canje"
        description={
          confirming
            ? `${result.fullName} canjea "${confirming.name}" por ${confirming.pointsCost} puntos.`
            : undefined
        }
        footer={
          <div className="flex gap-3">
            <Button variant="ghost" pill className="flex-1" onClick={() => setConfirming(null)}>
              Cancelar
            </Button>
            <Button variant="accent"
              pill
              className="flex-1"
              loading={busy}
              onClick={() => confirming && redeem(confirming)}
            >
              Confirmar
            </Button>
          </div>
        }
      >
        {confirming && (
          <p className="text-sm text-expresso/70">
            Saldo después del canje:{" "}
            <span className="font-bold text-expresso">
              {result.pointsBalance - confirming.pointsCost} puntos
            </span>
          </p>
        )}
      </Modal>
    </div>
  );
}
