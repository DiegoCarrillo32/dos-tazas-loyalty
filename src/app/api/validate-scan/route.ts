import { NextResponse } from "next/server";

import { apiError, codeFromPostgrestError } from "@/lib/api-errors";
import { verifyQrPayload } from "@/lib/crypto";
import { assertSameOrigin } from "@/lib/same-origin";
import { createClient } from "@/lib/supabase/server";
import { validateScanSchema } from "@/lib/validation";
import type { ScanResult } from "@/types";

/**
 * POST /api/validate-scan — verify a scanned QR, then describe its owner.
 *
 * Order matters: the HMAC is checked first, so a forged or garbled code is
 * rejected without the database being touched at all. Only a payload that
 * carries a genuine signature is worth a query.
 *
 * Note that a successful response here is *not* a capability. /api/points
 * re-verifies the payload from scratch rather than trusting that this endpoint
 * already blessed it, so nothing is granted by having scanned once.
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
  if (!parsed.success) return apiError("invalid_qr");

  const verified = verifyQrPayload(parsed.data.payload);
  if (!verified.ok) return apiError("invalid_qr");

  const supabase = await createClient();

  // The staff member's own session client, so RLS applies and
  // staff_lookup_member() can check is_staff() against a real auth.uid().
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return apiError("not_authenticated");

  const { data, error } = await supabase.rpc("staff_lookup_member", {
    p_card_token: verified.cardToken,
  });

  if (error) return apiError(codeFromPostgrestError(error.message));

  const row = data as Record<string, unknown>;
  const result: ScanResult = {
    cardToken: String(row.card_token),
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
