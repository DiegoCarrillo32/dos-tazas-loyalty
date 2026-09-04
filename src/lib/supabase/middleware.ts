import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/types/database";
import { getSupabaseEnv } from "./env";

/**
 * Session refresh + the /admin gate.
 *
 * Adapted from the POS app's utils/supabase/middleware.ts, with one important
 * inversion: in the POS every route needs a session, whereas here almost
 * nothing does. The customer portal being reachable with no account at all is
 * the entire premise of the product, so this only guards /admin.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const { url, anonKey } = getSupabaseEnv();
  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname.startsWith("/admin");
  const isAdminLogin = pathname === "/admin/login";

  // Always call getUser(): besides answering the auth question, it is what
  // refreshes an expiring token and writes the rotated cookies onto
  // supabaseResponse. Skipping it on public routes would log customers who
  // *have* upgraded straight back out.
  let authed = false;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (data.user) {
      authed = true;
    } else if (error) {
      // getUser() re-validates against the auth server on every request, so a
      // network hiccup on café wifi reads as "logged out" for a barista who
      // plainly is not. Fall back to a pure cookie read so a real session
      // survives Supabase being briefly unreachable. This only decides whether
      // to redirect — RLS and is_staff() remain the actual authorization
      // boundary on every query.
      const { data: sessionData } = await supabase.auth.getSession();
      authed = !!sessionData.session;
    }
  } catch {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      authed = !!sessionData.session;
    } catch {
      authed = false;
    }
  }

  if (isAdminRoute && !isAdminLogin && !authed) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/admin/login";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // A signed-in barista landing on the login page belongs at the scanner.
  if (isAdminLogin && authed) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/admin/scanner";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
