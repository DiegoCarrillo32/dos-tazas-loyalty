import { redirect } from "next/navigation";

import { createClient } from "./supabase/server";

/**
 * Send a signed-in *customer* who has no card to finish signing up.
 *
 * Staff are exempt. A barista's job is to scan other people's cards, not to
 * hold one — asking them for a cédula before they can see any page was simply
 * wrong, and it blocked the till. Being staff and being a customer are also not
 * mutually exclusive: a barista who does register a card sees it normally.
 *
 * Anonymous visitors are untouched and pay for no queries at all, which is the
 * whole point of the counter tier.
 */
export async function requireCompleteProfile() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return;

  const { data: isStaff } = await supabase.rpc("is_staff");
  if (isStaff) return;

  const { data: member } = await supabase
    .from("members")
    .select("id")
    .eq("auth_user_id", userData.user.id)
    .maybeSingle();

  if (!member) redirect("/account");
}
