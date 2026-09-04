"use client";

import { ScanLine } from "lucide-react";
import { useState } from "react";

import { Alert, Button, Surface } from "@/design-system";
import { ApiRequestError, postJson } from "@/lib/api-client";
import type { ScanResult } from "@/types";
import { PageHeader } from "./PageHeader";
import { QRScanner } from "./QRScanner";
import { ScanResultPanel } from "./ScanResultPanel";

type Phase =
  | { name: "scanning" }
  | { name: "loading" }
  | { name: "result"; payload: string; result: ScanResult }
  | { name: "error"; message: string };

export function ScannerWorkspace() {
  const [phase, setPhase] = useState<Phase>({ name: "scanning" });

  async function handleScan(payload: string) {
    setPhase({ name: "loading" });
    try {
      const result = await postJson<ScanResult>("/api/validate-scan", { payload });
      setPhase({ name: "result", payload, result });
    } catch (err) {
      setPhase({
        name: "error",
        message: err instanceof ApiRequestError ? err.message : "No pudimos leer la tarjeta.",
      });
    }
  }

  function reset() {
    setPhase({ name: "scanning" });
  }

  if (phase.name === "result") {
    return (
      <ScanResultPanel
        payload={phase.payload}
        result={phase.result}
        onUpdated={(next) => setPhase({ ...phase, result: next })}
        onDone={reset}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Escanear tarjeta" subtitle="Acumulá o canjeá puntos del cliente." />

      {phase.name === "loading" && (
        <Surface className="flex items-center justify-center gap-3 py-10">
          <ScanLine className="size-5 animate-pulse text-coffee-fruit" />
          <span className="text-sm font-medium text-expresso/70">Buscando cliente…</span>
        </Surface>
      )}

      {phase.name === "error" && (
        <div className="space-y-4">
          <Alert tone="danger" title="No se pudo leer">
            {phase.message}
          </Alert>
          <Button variant="accent" pill size="lg" className="w-full" onClick={reset}>
            Escanear de nuevo
          </Button>
        </div>
      )}

      {/* Remounting the scanner on each reset is deliberate: it gives the
          component a fresh camera session and clears the fire-once latch. */}
      {phase.name === "scanning" && <QRScanner key="scanner" onScan={handleScan} />}
    </div>
  );
}
