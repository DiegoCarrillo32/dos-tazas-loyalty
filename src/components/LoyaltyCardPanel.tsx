"use client";

import { toPng } from "html-to-image";
import { Download } from "lucide-react";
import { useRef, useState } from "react";

import { Button, toast } from "@/design-system";
import type { MemberCard } from "@/types";
import { LoyaltyCard } from "./LoyaltyCard";

/** Past this, assume the capture will never settle and give the user a way out. */
const EXPORT_TIMEOUT_MS = 20_000;

/**
 * Resolves once the page is actually being rendered.
 *
 * html-to-image finishes its capture inside a `requestAnimationFrame`
 * callback (see createImage() in its util.js). A hidden page suspends rAF, so
 * that callback never runs and `toPng` never settles — not a rejection, just
 * a promise that hangs forever. On a phone this is an ordinary thing to do:
 * tap "Descargar tarjeta", switch to another app for a moment, come back to a
 * spinner that will never stop. Waiting for visibility before starting avoids
 * entering that state at all.
 */
function whenVisible(): Promise<void> {
  if (!document.hidden) return Promise.resolve();
  return new Promise((resolve) => {
    const onChange = () => {
      if (!document.hidden) {
        document.removeEventListener("visibilitychange", onChange);
        resolve();
      }
    };
    document.addEventListener("visibilitychange", onChange);
  });
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("export_timeout")), ms)
    ),
  ]);
}

/**
 * The card plus its download action.
 *
 * Two more export failure modes are handled here, both invisible until you
 * open the saved file:
 *
 *  1. **Fonts.** html-to-image inlines webfonts by fetching them, but it
 *     captures whatever the browser is painting at that instant. If Titan One
 *     has not finished loading, the PNG silently bakes in the fallback sans.
 *     Awaiting `document.fonts.ready` is what makes the file match the screen.
 *
 *  2. **Safari's first frame.** WebKit often returns a partially rasterized
 *     image on the first toPng call — typically the QR missing or the
 *     background flat. Rendering twice and keeping the second result is the
 *     standard workaround; the first pass warms the cloned-node cache.
 */
export function LoyaltyCardPanel({ card }: { card: MemberCard }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    const node = cardRef.current;
    if (!node) return;

    const options = { pixelRatio: 3, cacheBust: true, backgroundColor: "#fff5e1" } as const;

    /**
     * One capture attempt.
     *
     * The visibility wait sits deliberately OUTSIDE the timeout: a person who
     * taps download and then switches apps for two minutes should come back to
     * a finished card, not to an error for something they never watched fail.
     * The timeout guards only the capture itself, which is the part that can
     * genuinely wedge.
     */
    async function attempt(): Promise<string> {
      await whenVisible();
      if (document.fonts?.ready) await document.fonts.ready;
      return withTimeout(
        (async () => {
          await toPng(node!, options);
          return toPng(node!, options);
        })(),
        EXPORT_TIMEOUT_MS
      );
    }

    setDownloading(true);
    try {
      let dataUrl: string;
      try {
        dataUrl = await attempt();
      } catch (err) {
        // The realistic failure: the page went hidden partway through, rAF
        // stopped, and the capture stalled. Retrying re-waits for visibility
        // first, so this resolves the moment the user comes back.
        if (err instanceof Error && err.message === "export_timeout") {
          dataUrl = await attempt();
        } else {
          throw err;
        }
      }

      const link = document.createElement("a");
      link.download = `tarjeta-dos-tazas-${card.fullName.toLowerCase().replace(/\s+/g, "-")}.png`;
      link.href = dataUrl;
      link.click();

      toast.success("Tarjeta descargada", "Guardala en tu galería para mostrarla en caja.");
    } catch (err) {
      const timedOut = err instanceof Error && err.message === "export_timeout";
      toast.error(
        "No pudimos generar la imagen",
        timedOut
          ? "Mantené esta pantalla abierta mientras se genera y probá de nuevo."
          : "Probá de nuevo, o guardá esta página en favoritos."
      );
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-warm-roast/10 shadow-sm shadow-warm-roast/5">
        <LoyaltyCard ref={cardRef} card={card} />
      </div>

      <Button
        variant="accent"
        onClick={handleDownload}
        loading={downloading}
        leadingIcon={<Download />}
        pill
        size="lg"
        className="w-full"
      >
        Descargar tarjeta
      </Button>
    </div>
  );
}
