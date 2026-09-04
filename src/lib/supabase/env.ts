/**
 * Reads and validates the env vars the Supabase client factories and the QR
 * signer need.
 *
 * Adapted from the POS app's utils/supabase/env.ts. The reasoning carries over
 * verbatim: a missing var surfaced as `undefined` either throws deep inside
 * `@supabase/ssr` or, worse, builds a client pointed at "https://undefined"
 * that fails opaquely on the first request. Failing loudly here, once, at the
 * call site is a much shorter path from "the app won't start" to "here's the
 * .env line to fix" — see .env.example for the keys this expects.
 */
export function getSupabaseEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const missing = [
    !url && "NEXT_PUBLIC_SUPABASE_URL",
    !anonKey && "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ].filter(Boolean);

  if (missing.length > 0) {
    throw new Error(
      `Missing required env var(s): ${missing.join(", ")}. Copy .env.example to .env.local and fill in your Supabase project's URL and anon key.`
    );
  }

  return { url, anonKey } as { url: string; anonKey: string };
}

/**
 * The QR signing key. Server-only — deliberately not NEXT_PUBLIC_, since
 * anyone holding it can mint a loyalty card that scans as genuine.
 *
 * The length floor matters: this key is the only thing standing between a
 * customer and a self-issued card, and a short secret is brute-forceable
 * offline against any single published QR.
 */
export function getQrSecret(): string {
  const secret = process.env.LOYALTY_QR_SECRET;

  if (!secret) {
    throw new Error(
      "Missing required env var: LOYALTY_QR_SECRET. Generate one with `openssl rand -base64 32` and add it to .env.local."
    );
  }

  if (secret.length < 32) {
    throw new Error(
      "LOYALTY_QR_SECRET is too short (needs at least 32 characters). Generate one with `openssl rand -base64 32`."
    );
  }

  return secret;
}

/** Absolute origin, needed to build the OAuth redirect URL. */
export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
}
