import { NextResponse } from "next/server";

import { apiError, codeFromPostgrestError } from "@/lib/api-errors";
import { toMemberCard } from "@/lib/member-response";
import { errorFromRpcResult } from "@/lib/rpc-result";
import { createClient } from "@/lib/supabase/server";
import { linkSchema } from "@/lib/validation";

/**
 * POST /api/loyalty/link — attach an existing anonymous card to the signed-in
 * account, which is what flips the member to the `member` tier.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("invalid_qr", 400);
  }

  const parsed = linkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation", message: parsed.error.issues[0]?.message ?? "Revisá los datos." },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // link_member_to_auth() checks auth.uid() itself; this only turns a missing
  // session into a clean 401 instead of a Postgres exception.
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return apiError("not_authenticated");

  const { data, error } = await supabase.rpc("link_member_to_auth", {
    p_national_id: parsed.data.nationalId,
    p_phone: parsed.data.phone,
  });

  if (error) return apiError(codeFromPostgrestError(error.message));

  const rpcError = errorFromRpcResult(data);
  if (rpcError) return apiError(rpcError);

  return NextResponse.json(toMemberCard(data as Record<string, unknown>));
}
