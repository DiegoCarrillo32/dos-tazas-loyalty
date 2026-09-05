import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Email link landing: magic links, signup confirmations, password recovery.
 *
 * This is separate from /auth/callback on purpose. The two flows deliver
 * different things:
 *
 *   /auth/callback  <- OAuth (Google). Carries `?code=`, exchanged with
 *                      exchangeCodeForSession().
 *   /auth/confirm   <- email links. Carry `?token_hash=` + `type=`, redeemed
 *                      with verifyOtp().
 *
 * Using token_hash rather than the default `{{ .ConfirmationURL }}` matters for
 * a server-rendered app: ConfirmationURL sends the browser through GoTrue's own
 * /verify endpoint, which hands the session back in a URL *fragment*. Fragments
 * are never sent to the server, so a server component can't see the session and
 * the user lands back looking signed out. token_hash is redeemed server-side
 * and the session is written straight to cookies.
 *
 * It also survives the common real-world case of the link being opened in a
 * different browser than the one that requested it — a phone mail app, say —
 * where a PKCE code verifier from the original browser would not exist.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  // A recovery link exists to change a password, so default it to the form
  // that does that rather than to the account page — the Supabase email
  // template may not set `next` at all.
  const next = searchParams.get("next") ?? (type === "recovery" ? "/reset-password" : "/account");

  // Same guard as /auth/callback: only ever redirect to a path on this origin.
  const safeNext =
    next.startsWith("/") && !next.startsWith("//") && !next.includes("\\")
      ? next
      : "/account";

  if (!tokenHash || !type) {
    return NextResponse.redirect(`${origin}/account?error=link`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

  if (error) {
    // Almost always an expired or already-used link. The copy on /account says so.
    return NextResponse.redirect(`${origin}/account?error=link`);
  }

  return NextResponse.redirect(`${origin}${safeNext}`);
}
