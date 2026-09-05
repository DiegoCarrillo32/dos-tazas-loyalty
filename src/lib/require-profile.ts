import { redirect } from "next/navigation";

import { createClient } from "./supabase/server";

/**
 * Send a signed-in visitor who has no card to finish signing up.
 *
 * An account with no card can neither earn nor redeem anything, so there is
 * nothing useful for them anywhere else in the app. Called from the pages that
 * are *not* the onboarding form — never from /account, which is where that form
 * lives and would otherwise redirect to itself.
 *
 * Anonymous visitors are untouched: they pay no query and see the public pages
 * normally, which is the whole point of the counter tier.
 */
export async function requireCompleteProfile() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return;

  const { data: member } = await supabase
    .from("members")
    .select("id")
    .eq("auth_user_id", userData.user.id)
    .maybeSingle();

  if (!member) redirect("/account");
}
