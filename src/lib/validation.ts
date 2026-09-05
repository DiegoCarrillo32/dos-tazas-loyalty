import { z } from "zod";

/**
 * Input normalization and schemas, shared by the forms and the route handlers.
 *
 * These mirror normalize_national_id() / normalize_phone() in migration 00003.
 * The duplication is deliberate: the client copy exists to give instant, kind
 * feedback in the form, and the database copy exists because that is the one
 * that is actually load-bearing. A route handler always re-validates — it never
 * trusts that the browser ran this file.
 */

/** Strip formatting so "1-2345-6789" and "102345678" are the same key. */
export function normalizeNationalId(value: string): string {
  return value.replace(/\D/g, "");
}

/** Strip formatting and a pasted +506 country code. */
export function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("506")) return digits.slice(3);
  return digits;
}

// 9 digits = cédula nacional; 11-12 = DIMEX for foreign residents.
const nationalIdSchema = z
  .string()
  .transform(normalizeNationalId)
  .refine((v) => [9, 11, 12].includes(v.length), {
    message: "Ingresá una cédula válida (9 dígitos) o un DIMEX (11 o 12 dígitos).",
  });

const fullNameSchema = z
  .string()
  .transform((v) => v.trim().replace(/\s+/g, " "))
  .refine((v) => v.length >= 2 && v.length <= 80, {
    message: "Ingresá tu nombre completo.",
  });

/**
 * A card needs only a cédula and a name. The phone is optional contact detail
 * — nothing authenticates against it any more, so an empty string is fine and
 * a present value still has to be a real number.
 */
export const registerSchema = z.object({
  nationalId: nationalIdSchema,
  fullName: fullNameSchema,
  phone: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() !== "" ? normalizePhone(v) : undefined))
    .refine((v) => v === undefined || /^[245678]\d{7}$/.test(v), {
      message: "Ingresá un teléfono costarricense de 8 dígitos, o dejalo en blanco.",
    }),
});

/**
 * Claiming a card is authorized by possession of its signed QR payload, not by
 * knowing a cédula — a cédula is semi-public, so cédula-based claiming would be
 * a trivial account takeover.
 */
export const claimSchema = z.object({
  payload: z.string().min(1).max(200),
});

/** Email + password sign-in, handled entirely by Supabase Auth. */
export const credentialsSchema = z.object({
  email: z.string().email({ message: "Ingresá un correo válido." }),
  password: z.string().min(8, { message: "La contraseña debe tener al menos 8 caracteres." }),
});

const uuidSchema = z.string().uuid();

export const validateScanSchema = z.object({
  payload: z.string().min(1).max(200),
});

export const pointsSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("earn"),
    payload: z.string().min(1).max(200),
    // Colones. The ceiling is a typo guard mirroring staff_add_points().
    amount: z.number().positive().max(1_000_000),
    clientRequestId: uuidSchema,
  }),
  z.object({
    action: z.literal("redeem"),
    payload: z.string().min(1).max(200),
    rewardId: uuidSchema,
    clientRequestId: uuidSchema,
  }),
]);

export type RegisterInput = z.infer<typeof registerSchema>;
export type ClaimInput = z.infer<typeof claimSchema>;
export type PointsInput = z.infer<typeof pointsSchema>;
