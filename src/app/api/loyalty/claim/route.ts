import { NextResponse } from "next/server";

import { apiError, codeFromPostgrestError } from "@/lib/api-errors";
import { verifyQrPayload } from "@/lib/crypto";
import { toMemberCard } from "@/lib/member-response";
import { errorFromRpcResult } from "@/lib/rpc-result";
import { assertSameOrigin } from "@/lib/same-origin";
import { createClient } from "@/lib/supabase/server";
import { claimSchema } from "@/lib/validation";

/**
 * POST /api/loyalty/claim — attach an existing card to the signed-in account.
 *
 * Authorization is possession of the card: the request carries the signed QR
 * payload, whose HMAC is verified here before the token ever reaches the
 * database. Claiming by cédula would be an account takeover waiting to happen,
 * since a cédula is semi-public in Costa Rica.
 */
export async function POST(request: Request) {
  const crossSite = assertSameOrigin(request);
  if (crossSite) return crossSite;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("invalid_qr", 400);
  }

  const parsed = claimSchema.safeParse(body);
  if (!parsed.success) return apiError("invalid_qr");

  const verified = verifyQrPayload(parsed.data.payload);
  if (!verified.ok) return apiError("invalid_qr");

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return apiError("not_authenticated");

  const { data, error } = await supabase.rpc("claim_member_card", {
    p_card_token: verified.cardToken,
  });

  if (error) return apiError(codeFromPostgrestError(error.message));

  const rpcError = errorFromRpcResult(data);
  if (rpcError) return apiError(rpcError);

  return NextResponse.json(toMemberCard(data as Record<string, unknown>));
}
