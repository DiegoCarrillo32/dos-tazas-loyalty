import { NextResponse } from "next/server";

import { apiError, codeFromPostgrestError } from "@/lib/api-errors";
import { toMemberCard } from "@/lib/member-response";
import { createClient } from "@/lib/supabase/server";
import { registerSchema } from "@/lib/validation";

/** POST /api/loyalty/register — the no-auth onboarding. */
export async function POST(request: Request) {
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
    p_phone: parsed.data.phone,
    p_full_name: parsed.data.fullName,
  });

  if (error) return apiError(codeFromPostgrestError(error.message));

  return NextResponse.json(toMemberCard(data as Record<string, unknown>), { status: 201 });
}
