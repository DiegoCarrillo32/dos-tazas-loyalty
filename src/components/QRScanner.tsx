"use client";

import {
  Html5Qrcode,
  Html5QrcodeScannerState,
  Html5QrcodeSupportedFormats,
} from "html5-qrcode";
import { CameraOff, Keyboard } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Alert, Button, Field, Input } from "@/design-system";
import { QR_PREFIX } from "@/lib/crypto-shared";
import { cn } from "@/lib/utils";

const ELEMENT_ID = "dos-tazas-qr-reader";

/**
 * Stop and tear down a scanner without caring what state it is in.
 *
 * html5-qrcode's `stop()` does `throw "Cannot stop, scanner is not running or
 * paused."` — a *synchronous* throw of a bare string, not a rejected promise.
 * A `.catch()` on the return value therefore never sees it, and the exception
 * escapes into React's cleanup. That happens on two completely ordinary paths:
 * a barista who denies camera permission, and React's StrictMode double-invoke
 * in development, where the first cleanup fires while `start()` is still in
 * flight. Hence the state check plus a try/catch around everything.
 */
async function safeStop(scanner: Html5Qrcode | null) {
  if (!scanner) return;
  try {
    const state = scanner.getState();
    if (
      state === Html5QrcodeScannerState.SCANNING ||
      state === Html5QrcodeScannerState.PAUSED
    ) {
      await scanner.stop();
    }
    scanner.clear();
  } catch {
    // Nothing here is actionable during teardown: the camera is either already
    // released or was never acquired.
  }
}

/**
 * Camera QR scanner.
 *
 * Beyond the teardown above, two behaviours matter in a café:
 *
 *  - **Fire once.** html5-qrcode invokes the success callback on *every*
 *    decoded frame, so a card held in view produces a steady stream of them.
 *    The `latched` ref makes only the first one count; without it a barista
 *    holding up a card would fire a dozen lookups a second.
 *
 *  - **Degrade to typing.** Camera permission gets denied and older café
 *    devices are unreliable, so manual entry means a barista is never fully
 *    blocked — they can read the code off the customer's screen.
 *
 * The camera also needs a secure context: this works on localhost, but on a
 * real device it requires HTTPS.
 */
export function QRScanner({
  onScan,
  disabled,
}: {
  /**
   * A camera decode always yields a payload. Manual entry yields whichever the
   * barista typed — the caller decides what to do with each.
   */
  onScan: (input: { payload: string } | { nationalId: string }) => void;
  disabled?: boolean;
}) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const latched = useRef(false);
  const [status, setStatus] = useState<"starting" | "scanning" | "error">("starting");
  const [manualOpen, setManualOpen] = useState(false);
  const [manualValue, setManualValue] = useState("");

  const handleDecoded = useCallback(
    (text: string) => {
      if (latched.current) return;
      latched.current = true;

      // Release the camera before handing off, so it is not held while the
      // barista works through the result panel.
      void safeStop(scannerRef.current).then(() => onScan({ payload: text }));
    },
    [onScan]
  );

  useEffect(() => {
    const scanner = new Html5Qrcode(ELEMENT_ID, {
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
      verbose: false,
    });
    scannerRef.current = scanner;

    let cancelled = false;
    const started = scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        handleDecoded,
        undefined // per-frame decode misses are normal; staying quiet here
      )
      .then(() => {
        if (!cancelled) setStatus("scanning");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
      // Wait for start() to settle first. Tearing down mid-start is exactly
      // the StrictMode case that used to throw.
      void started.then(() => safeStop(scanner));
    };
  }, [handleDecoded]);

  function submitManual(event: React.FormEvent) {
    event.preventDefault();
    const value = manualValue.trim();
    if (!value) return;

    // A barista types whichever they have. Signed payloads always start with
    // the QR prefix; anything else is treated as a cédula, which is the number
    // they actually know and the one the customer-facing copy points them at.
    if (value.toUpperCase().startsWith(`${QR_PREFIX}.`)) {
      onScan({ payload: value });
    } else {
      onScan({ nationalId: value });
    }
  }

  return (
    <div className="space-y-4">
      {/* The container is always mounted — html5-qrcode resolves ELEMENT_ID at
          construction time, so it must exist before start() runs — but it is
          collapsed once the camera has failed, otherwise a denied permission
          leaves an empty black bar above the fallback. */}
      <div
        className={cn(
          "overflow-hidden rounded-2xl",
          status === "error"
            ? "h-0 border-0"
            : "border border-warm-roast/10 bg-expresso/90"
        )}
      >
        <div id={ELEMENT_ID} className="[&_video]:w-full [&_video]:rounded-2xl" />
        {status === "starting" && (
          <p className="px-4 py-8 text-center text-sm text-white-pergamino/70">
            Abriendo la cámara…
          </p>
        )}
      </div>

      {status === "scanning" && !disabled && (
        <p className="text-center text-sm text-expresso/60">
          Apuntá al código QR de la tarjeta del cliente.
        </p>
      )}

      {status === "error" && (
        <Alert tone="warning" title="No pudimos abrir la cámara" icon={<CameraOff />}>
          Revisá los permisos del navegador. También podés buscar al cliente por su cédula.
        </Alert>
      )}

      {manualOpen ? (
        <form onSubmit={submitManual} className="space-y-3">
          <Field
            label="Cédula del cliente"
            htmlFor="manual-payload"
            hint="También podés pegar el código que aparece bajo el QR."
          >
            <Input
              id="manual-payload"
              maxLength={200}
              value={manualValue}
              onChange={(e) => setManualValue(e.target.value)}
              placeholder="1 2345 6789"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
            />
          </Field>
          <Button
            variant="accent"
            type="submit"
            pill
            className="w-full"
            disabled={!manualValue.trim()}
          >
            Buscar cliente
          </Button>
        </form>
      ) : (
        <Button
          variant="ghost"
          pill
          className="w-full"
          leadingIcon={<Keyboard />}
          onClick={() => setManualOpen(true)}
        >
          Buscar por cédula
        </Button>
      )}
    </div>
  );
}
