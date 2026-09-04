import { signCardToken } from "./crypto";
import type { MemberCard } from "@/types";

/**
 * Shapes an RPC result into the MemberCard the browser gets.
 *
 * This is the single place a card token becomes a signed QR payload. Doing it
 * here — server-side, on the way out — is what keeps LOYALTY_QR_SECRET off the
 * client while still letting the card component render a real QR.
 */
export function toMemberCard(row: Record<string, unknown>): MemberCard {
  const cardToken = String(row.card_token);
  return {
    cardToken,
    fullName: String(row.full_name),
    nationalId: String(row.national_id),
    pointsBalance: Number(row.points_balance ?? 0),
    tier: row.tier === "member" ? "member" : "basic",
    qrPayload: signCardToken(cardToken),
  };
}
