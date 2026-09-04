import { NextResponse } from "next/server";

import { apiError, codeFromPostgrestError } from "@/lib/api-errors";
import { verifyQrPayload } from "@/lib/crypto";
import { createClient } from "@/lib/supabase/server";
import { pointsSchema } from "@/lib/validation";
import type { PointsMutationResult } from "@/types";

/**
 * POST /api/points — add or redeem points for a scanned card.
 *
 * Every call re-verifies the QR signature from scratch. A prior successful
 * /api/validate-scan grants nothing; the payload has to stand on its own each
 * time, so a stale or replayed scan cannot be turned into a mutation.
 *
 * Authorization is checked twice over: this handler needs a session, and the
 * RPCs underneath independently require is_staff(). A logged-in *customer*
 * calling this endpoint directly gets a 403 from Postgres, not points.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("invalid_qr", 400);
  }

  const parsed = pointsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation", message: parsed.error.issues[0]?.message ?? "Datos inválidos." },
      { status: 400 }
    );
  }

  const verified = verifyQrPayload(parsed.data.payload);
  if (!verified.ok) return apiError("invalid_qr");

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return apiError("not_authenticated");

  const input = parsed.data;
  const { data, error } =
    input.action === "earn"
      ? await supabase.rpc("staff_add_points", {
          p_card_token: verified.cardToken,
          p_purchase_amount: input.amount,
          p_client_request_id: input.clientRequestId,
        })
      : await supabase.rpc("staff_redeem_points", {
          p_card_token: verified.cardToken,
          p_reward_id: input.rewardId,
          p_client_request_id: input.clientRequestId,
        });

  if (error) return apiError(codeFromPostgrestError(error.message));

  const row = data as Record<string, unknown>;
  const result: PointsMutationResult = {
    fullName: String(row.full_name),
    pointsBalance: Number(row.points_balance ?? 0),
    replayed: Boolean(row.replayed),
    ...(row.points_awarded !== undefined ? { pointsAwarded: Number(row.points_awarded) } : {}),
    ...(row.points_spent !== undefined ? { pointsSpent: Number(row.points_spent) } : {}),
    ...(row.reward_name !== undefined ? { rewardName: String(row.reward_name) } : {}),
  };

  return NextResponse.json(result);
}
