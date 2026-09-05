import { NextResponse } from "next/server";

import { apiError, codeFromPostgrestError } from "@/lib/api-errors";
import { signCardToken, verifyQrPayload } from "@/lib/crypto";
import { errorFromRpcResult } from "@/lib/rpc-result";
import { assertSameOrigin } from "@/lib/same-origin";
import { createClient } from "@/lib/supabase/server";
import { validateScanSchema } from "@/lib/validation";
import type { ScanResult } from "@/types";

/**
 * POST /api/validate-scan — identify the customer a barista is serving.
 *
 * Two ways in:
 *
 *   { payload }    a scanned QR. The HMAC is checked first, so a forged or
 *                  garbled code is rejected before the database is touched.
 *   { nationalId } a cédula typed at the till, for a customer who lost their
 *                  card or forgot their phone. Gated on is_staff() inside the
 *                  RPC — staff can already read every member row, so this adds
 *                  no capability, only convenience.
 *
 * Both return the same shape, including a freshly signed `qrPayload`. Point
 * mutations then send that rather than whatever the scanner read, so the two
 * paths converge and /api/points has exactly one thing to verify.
 *
 * A successful response is not a capability: /api/points re-verifies the
 * signature from scratch on every call.
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

  const parsed = validateScanSchema.safeParse(body);
  if (!parsed.success) {
    // A cédula that fails validation deserves its own message: telling a
    // barista "this QR is invalid" when they typed a short cédula is exactly
    // the confusion this endpoint used to cause.
    const looksLikeCedula = typeof (body as { nationalId?: unknown })?.nationalId === "string";
    return apiError(looksLikeCedula ? "invalid_national_id" : "invalid_qr");
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return apiError("not_authenticated");

  let data: unknown;
  let error: { message: string } | null;

  if ("payload" in parsed.data) {
    const verified = verifyQrPayload(parsed.data.payload);
    if (!verified.ok) return apiError("invalid_qr");

    ({ data, error } = await supabase.rpc("staff_lookup_member", {
      p_card_token: verified.cardToken,
    }));
  } else {
    ({ data, error } = await supabase.rpc("staff_lookup_by_cedula", {
      p_national_id: parsed.data.nationalId,
    }));
  }

  if (error) return apiError(codeFromPostgrestError(error.message));

  const rpcError = errorFromRpcResult(data);
  if (rpcError) return apiError(rpcError);

  const row = data as Record<string, unknown>;
  const cardToken = String(row.card_token);

  const result: ScanResult = {
    cardToken,
    qrPayload: signCardToken(cardToken),
    fullName: String(row.full_name),
    pointsBalance: Number(row.points_balance ?? 0),
    tier: row.tier === "member" ? "member" : "basic",
    memberSince: String(row.member_since),
    rewards: (row.rewards as Array<Record<string, unknown>>).map((r) => ({
      id: String(r.id),
      name: String(r.name),
      description: r.description === null ? null : String(r.description),
      pointsCost: Number(r.points_cost),
      memberOnly: Boolean(r.member_only),
      redeemable: Boolean(r.redeemable),
    })),
    history: (row.history as Array<Record<string, unknown>>).map((h) => ({
      id: String(h.id),
      kind: h.kind as ScanResult["history"][number]["kind"],
      points: Number(h.points),
      purchaseAmount: h.purchase_amount === null ? null : Number(h.purchase_amount),
      createdAt: String(h.created_at),
      rewardName: h.reward_name === null ? null : String(h.reward_name),
    })),
  };

  return NextResponse.json(result);
}
