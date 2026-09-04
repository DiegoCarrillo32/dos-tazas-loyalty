"use client";

import { QRCodeSVG } from "qrcode.react";
import { forwardRef } from "react";

import { formatPoints, maskNationalId } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MemberCard } from "@/types";

/**
 * The visual loyalty card — on screen and, via html-to-image, as a downloaded
 * PNG.
 *
 * Two choices here are about the export rather than the screen:
 *
 *  1. The card renders in fixed brand colors instead of theme tokens. Every
 *     other surface in this app flips with the theme, but a PNG does not — it
 *     is a fixed image that ends up in a photo roll and gets shown to a
 *     barista under café lighting. A dark-mode capture scans badly, so the
 *     card commits to the light palette in both themes. These are the same
 *     five brand values the tokens resolve to; they are written literally
 *     because html-to-image rasterizes computed styles and must not inherit
 *     `.dark` from an ancestor.
 *
 *  2. The QR is an SVG, not a canvas. html-to-image inlines SVG cleanly at any
 *     pixelRatio, whereas a canvas would be captured at its own backing
 *     resolution and go soft when upscaled.
 */

const BRAND = {
  pergamino: "#fff5e1",
  expresso: "#410505",
  warmRoast: "#7a1318",
  coffeeFruit: "#b92323",
} as const;

export const LoyaltyCard = forwardRef<HTMLDivElement, { card: MemberCard; className?: string }>(
  function LoyaltyCard({ card, className }, ref) {
    return (
      <div
        ref={ref}
        className={cn("w-full overflow-hidden rounded-2xl", className)}
        style={{ backgroundColor: BRAND.pergamino, color: BRAND.expresso }}
      >
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ backgroundColor: BRAND.expresso }}
        >
          <span
            className="text-sm font-heading leading-none"
            style={{ color: BRAND.pergamino }}
          >
            DOS TAZAS
          </span>
          <span
            className="text-[10px] font-bold uppercase tracking-[0.18em]"
            style={{ color: BRAND.pergamino, opacity: 0.7 }}
          >
            Club de Lealtad
          </span>
        </div>

        <div className="flex items-start gap-4 px-6 py-6">
          <div className="min-w-0 flex-1">
            <p
              className="text-[10px] font-bold uppercase tracking-[0.16em]"
              style={{ color: BRAND.warmRoast }}
            >
              Miembro
            </p>
            {/* Wraps to two lines rather than truncating: at 375px the name
                column is ~170px, and "María Rodríguez" does not fit on one
                line at this size. A loyalty card that reads "María Rodri…"
                looks broken, and the name is the whole point of the card. */}
            <p
              className="mt-1 text-lg font-heading leading-tight [overflow-wrap:anywhere] line-clamp-2"
              style={{ color: BRAND.expresso }}
            >
              {card.fullName}
            </p>
            <p className="mt-0.5 text-xs" style={{ color: BRAND.warmRoast }}>
              {maskNationalId(card.nationalId)}
            </p>

            <p
              className="mt-5 text-[10px] font-bold uppercase tracking-[0.16em]"
              style={{ color: BRAND.warmRoast }}
            >
              Puntos
            </p>
            <p
              className="text-3xl font-heading leading-none"
              style={{ color: BRAND.coffeeFruit }}
            >
              {formatPoints(card.pointsBalance)}
            </p>

            {card.tier === "member" && (
              <span
                className="mt-3 inline-block rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
                style={{ backgroundColor: BRAND.coffeeFruit, color: BRAND.pergamino }}
              >
                Miembro Pleno
              </span>
            )}
          </div>

          {/* White plate behind the QR: scanners want maximum contrast, and the
              pergamino background is warm enough to cost a little of it. */}
          <div className="shrink-0 rounded-xl p-2.5" style={{ backgroundColor: "#ffffff" }}>
            <QRCodeSVG
              value={card.qrPayload}
              size={92}
              level="M"
              bgColor="#ffffff"
              fgColor={BRAND.expresso}
              marginSize={0}
            />
          </div>
        </div>

        <div
          className="px-6 pb-5 pt-1 text-[10px]"
          style={{ color: BRAND.warmRoast, opacity: 0.75 }}
        >
          Mostrá este código en caja para acumular y canjear.
        </div>
      </div>
    );
  }
);
