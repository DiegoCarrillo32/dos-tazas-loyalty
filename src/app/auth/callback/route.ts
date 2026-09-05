import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * OAuth / email-confirmation landing. Exchanges the code for a session cookie
 * and sends the customer to their account page.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/account";

  if (!code) {
    return NextResponse.redirect(`${origin}/account?error=auth`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/account?error=auth`);
  }

  // Only ever redirect to a path on this origin — taking `next` as a full URL
  // would turn this into an open redirect from a trusted-looking auth link.
  // The backslash check is belt-and-braces: prefixing `origin` already keeps
  // the result local, but browsers normalize "\" inside URLs inconsistently
  // and this removes the need to reason about which ones do.
  const safeNext =
    next.startsWith("/") && !next.startsWith("//") && !next.includes("\\")
      ? next
      : "/account";
  return NextResponse.redirect(`${origin}${safeNext}`);
}
