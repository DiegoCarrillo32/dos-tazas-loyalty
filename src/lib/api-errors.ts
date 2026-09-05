import { NextResponse } from "next/server";

import type { ApiError } from "@/types";

/**
 * Maps the stable error codes raised by the Postgres RPCs onto Spanish copy
 * and an HTTP status.
 *
 * Keeping the translation here rather than in the database means the SQL stays
 * language-neutral and the customer-facing wording can change without a
 * migration. Anything not in this table becomes a generic 500 — an unmapped
 * Postgres error is a bug, and leaking its text to the browser would expose
 * schema details.
 */
const ERRORS: Record<string, { status: number; message: string }> = {
  invalid_national_id: {
    status: 400,
    message: "Ingresá una cédula válida (9 dígitos) o un DIMEX (11 o 12 dígitos).",
  },
  invalid_phone: {
    status: 400,
    message: "Ingresá un teléfono costarricense de 8 dígitos.",
  },
  invalid_name: {
    status: 400,
    message: "Ingresá tu nombre completo.",
  },
  invalid_amount: {
    status: 400,
    message: "Ingresá un monto de compra válido.",
  },
  amount_below_minimum: {
    status: 400,
    message: "El monto es muy bajo para acumular al menos 1 punto.",
  },
  member_exists: {
    status: 409,
    message: "Ya tenés una tarjeta con esta cédula. Consultá tus puntos para verla.",
  },
  not_found: {
    status: 404,
    message: "No encontramos una tarjeta con esos datos. Revisá la cédula y el teléfono.",
  },
  reward_not_found: {
    status: 404,
    message: "Esa recompensa ya no está disponible.",
  },
  insufficient_points: {
    status: 409,
    message: "Puntos insuficientes para canjear esta recompensa.",
  },
  member_only_reward: {
    status: 403,
    message: "Esta recompensa es solo para miembros con cuenta creada.",
  },
  account_already_linked: {
    status: 409,
    message: "Esta cuenta ya está vinculada a otra tarjeta.",
  },
  card_already_linked: {
    status: 409,
    message: "Esta tarjeta ya pertenece a otra cuenta.",
  },
  invalid_email: {
    status: 400,
    message: "Ingresá un correo válido.",
  },
  rate_limited: {
    status: 429,
    message: "Demasiados intentos. Esperá unos minutos y volvé a probar.",
  },
  not_authenticated: {
    status: 401,
    message: "Iniciá sesión para continuar.",
  },
  forbidden: {
    status: 403,
    message: "No tenés permiso para hacer esto.",
  },
  invalid_qr: {
    status: 400,
    message: "Este código QR no es válido.",
  },
};

export function apiError(code: string, fallbackStatus = 500): NextResponse<ApiError> {
  const known = ERRORS[code];
  if (known) {
    return NextResponse.json({ error: code, message: known.message }, { status: known.status });
  }
  return NextResponse.json(
    { error: "server_error", message: "Algo salió mal. Intentá de nuevo." },
    { status: fallbackStatus }
  );
}

/**
 * Pull our raised code out of a PostgREST error. `raise exception 'not_found'`
 * arrives as `{ message: 'not_found', code: 'P0001' }`, but Supabase sometimes
 * prefixes it, so match on a known code appearing anywhere in the text.
 */
export function codeFromPostgrestError(message: string | undefined): string {
  if (!message) return "server_error";
  const found = Object.keys(ERRORS).find((key) => message.includes(key));
  return found ?? "server_error";
}
