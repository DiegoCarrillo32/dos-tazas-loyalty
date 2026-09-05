import { NextResponse } from "next/server";

import { apiError, codeFromPostgrestError } from "@/lib/api-errors";
import { toMemberCard } from "@/lib/member-response";
import { assertSameOrigin } from "@/lib/same-origin";
import { createClient } from "@/lib/supabase/server";
import { registerSchema } from "@/lib/validation";

/**
 * POST /api/loyalty/register — create a card.
 *
 * Cédula and name only; the phone is optional contact detail. If the caller
 * happens to have a session, register_member() attaches the new card to it, so
 * someone signing up at home never has to claim it separately.
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

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation", message: parsed.error.issues[0]?.message ?? "Revisá los datos." },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("register_member", {
    p_national_id: parsed.data.nationalId,
    p_full_name: parsed.data.fullName,
    p_phone: parsed.data.phone ?? null,
  });

  if (error) return apiError(codeFromPostgrestError(error.message));

  return NextResponse.json(toMemberCard(data as Record<string, unknown>), { status: 201 });
}
