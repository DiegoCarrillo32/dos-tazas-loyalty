import { NextResponse } from "next/server";

import { apiError, codeFromPostgrestError } from "@/lib/api-errors";
import { toMemberCard } from "@/lib/member-response";
import { errorFromRpcResult } from "@/lib/rpc-result";
import { createClient } from "@/lib/supabase/server";
import { lookupSchema } from "@/lib/validation";

/**
 * POST /api/loyalty/lookup — "check my points" with no password.
 *
 * POST rather than GET on purpose: a cédula and a phone number in a query
 * string end up in browser history, server logs and the Referer header.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("invalid_qr", 400);
  }

  const parsed = lookupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation", message: parsed.error.issues[0]?.message ?? "Revisá los datos." },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("lookup_member", {
    p_national_id: parsed.data.nationalId,
    p_phone: parsed.data.phone,
  });

  if (error) return apiError(codeFromPostgrestError(error.message));

  // lookup_member() returns its failures rather than raising them, so that the
  // failed-attempt row it writes survives the transaction.
  const rpcError = errorFromRpcResult(data);
  if (rpcError) return apiError(rpcError);

  return NextResponse.json(toMemberCard(data as Record<string, unknown>));
}
