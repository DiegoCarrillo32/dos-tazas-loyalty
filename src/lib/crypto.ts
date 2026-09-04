import { createHmac, timingSafeEqual } from "node:crypto";

import { getQrSecret } from "./supabase/env";

/**
 * QR payload signing.
 *
 * The QR encodes `DT1.<card_token>.<tag>`, where the tag is an HMAC-SHA256
 * over `DT1.<card_token>` keyed with LOYALTY_QR_SECRET.
 *
 * Why an HMAC and deliberately *not* a JWT: the loyalty card is downloaded as
 * a PNG and lives in the customer's photo roll indefinitely. A JWT's `exp`
 * would silently brick every saved card the day it passed; a JWT without `exp`
 * is just a bulkier HMAC carrying a JSON header nobody reads. Neither buys
 * anything here, and both make the QR denser and slower to scan.
 *
 * What the signature is actually for: `card_token` is already an unguessable
 * uuid, so the tag's job is to let the server reject a forged or corrupted
 * code *before* it touches the database, and to make the printed card
 * unforgeable even by someone who learns a token. Revocation is separate — it
 * happens by rotating `card_token`, which invalidates every card ever issued
 * to that member.
 *
 * This module is server-only. LOYALTY_QR_SECRET has no NEXT_PUBLIC_ prefix and
 * must never reach the browser, which is exactly why signing and verification
 * live in route handlers rather than in the card component.
 */

export const QR_PREFIX = "DT1";

/** 32 base64url chars ≈ 192 bits — far past forgery reach, and short enough
 *  that the QR stays low-density and scans fast on a cheap phone camera. */
const TAG_LENGTH = 32;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function tagFor(body: string): string {
  return createHmac("sha256", getQrSecret())
    .update(body)
    .digest("base64url")
    .slice(0, TAG_LENGTH);
}

/** Build the string that goes into the customer's QR code. */
export function signCardToken(cardToken: string): string {
  if (!UUID_RE.test(cardToken)) {
    throw new Error("signCardToken: card token must be a uuid");
  }
  const body = `${QR_PREFIX}.${cardToken}`;
  return `${body}.${tagFor(body)}`;
}

export type VerifyResult =
  | { ok: true; cardToken: string }
  | { ok: false; reason: "malformed" | "bad_signature" };

/** Verify a scanned payload. Returns the card token only if the tag checks out. */
export function verifyQrPayload(payload: unknown): VerifyResult {
  if (typeof payload !== "string" || payload.length > 200) {
    return { ok: false, reason: "malformed" };
  }

  const parts = payload.trim().split(".");
  if (parts.length !== 3) return { ok: false, reason: "malformed" };

  const [prefix, cardToken, tag] = parts;
  if (prefix !== QR_PREFIX) return { ok: false, reason: "malformed" };
  if (!UUID_RE.test(cardToken)) return { ok: false, reason: "malformed" };
  if (tag.length !== TAG_LENGTH) return { ok: false, reason: "malformed" };

  const expected = Buffer.from(tagFor(`${prefix}.${cardToken}`), "utf8");
  const actual = Buffer.from(tag, "utf8");

  // Length is already equal via the check above, but timingSafeEqual throws on
  // a mismatch rather than returning false, so this stays explicit.
  if (expected.length !== actual.length) return { ok: false, reason: "bad_signature" };
  if (!timingSafeEqual(expected, actual)) return { ok: false, reason: "bad_signature" };

  return { ok: true, cardToken: cardToken.toLowerCase() };
}
