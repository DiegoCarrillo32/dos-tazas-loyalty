import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * OAuth / email-confirmation landing. Exchanges the code for a session cookie
 * and sends the customer to their account page.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/cuenta";

  if (!code) {
    return NextResponse.redirect(`${origin}/cuenta?error=auth`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/cuenta?error=auth`);
  }

  // Only ever redirect to a path on this origin — taking `next` as a full URL
  // would turn this into an open redirect from a trusted-looking auth link.
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/cuenta";
  return NextResponse.redirect(`${origin}${safeNext}`);
}
