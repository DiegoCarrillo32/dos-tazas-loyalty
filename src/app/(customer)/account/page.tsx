import type { Metadata } from "next";

import { AccountPanel } from "@/components/AccountPanel";
import { StaffAccountPanel } from "@/components/StaffAccountPanel";
import { SignInPanel } from "@/components/SignInPanel";
import { signCardToken } from "@/lib/crypto";
import { createClient } from "@/lib/supabase/server";
import type { LedgerEntry, MemberCard, Reward } from "@/types";

export const metadata: Metadata = {
  title: "Mi cuenta · Dos Tazas",
};

/**
 * The authenticated tier.
 *
 * Three states, resolved server-side:
 *   1. no session          -> sign in with Google or email
 *   2. session, no card    -> link an existing cédula + phone to this account
 *   3. session, linked     -> full member view
 *
 * State 3 reads `members` directly rather than through an RPC: the
 * members_select_own policy in migration 00002 already scopes the query to
 * `auth_user_id = auth.uid()`, so RLS is doing the filtering.
 */
export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error: authError } = await searchParams;
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return <SignInPanel authError={authError} />;
  }

  // Staff reach this page too — a barista who taps the logo, or signs in here
  // out of habit. They must not be asked for a cédula: their job is the
  // scanner. If they also happen to hold a card, it renders below as usual.
  const { data: isStaff } = await supabase.rpc("is_staff");

  const { data: member } = await supabase
    .from("members")
    .select("card_token, full_name, national_id, points_balance, tier, auth_user_id")
    .eq("auth_user_id", userData.user.id)
    .maybeSingle();

  if (!member && isStaff) {
    return <StaffAccountPanel email={userData.user.email ?? ""} />;
  }

  if (!member) {
    // Google hands back the profile in user_metadata, so the name field can be
    // prefilled and the customer only has to supply the cédula. Email+password
    // signups have no such data and type both.
    const meta = userData.user.user_metadata ?? {};
    const suggestedName =
      typeof meta.full_name === "string"
        ? meta.full_name
        : typeof meta.name === "string"
          ? meta.name
          : "";

    return (
      <AccountPanel
        email={userData.user.email ?? ""}
        card={null}
        rewards={[]}
        history={[]}
        suggestedName={suggestedName}
      />
    );
  }

  const [{ data: rewardRows }, { data: historyRows }] = await Promise.all([
    supabase
      .from("rewards")
      .select("id, name, description, points_cost, member_only")
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("point_transactions")
      .select("id, kind, points, purchase_amount, created_at, rewards(name)")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const card: MemberCard = {
    cardToken: member.card_token,
    fullName: member.full_name,
    nationalId: member.national_id,
    pointsBalance: member.points_balance,
    tier: member.tier,
    linked: member.auth_user_id !== null,
    qrPayload: signCardToken(member.card_token),
  };

  const rewards: Reward[] = (rewardRows ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    pointsCost: r.points_cost,
    memberOnly: r.member_only,
    redeemable: member.points_balance >= r.points_cost,
  }));

  const history: LedgerEntry[] = (historyRows ?? []).map((h) => {
    const reward = h.rewards as { name: string } | null;
    return {
      id: h.id,
      kind: h.kind,
      points: h.points,
      purchaseAmount: h.purchase_amount,
      createdAt: h.created_at,
      rewardName: reward?.name ?? null,
    };
  });

  return (
    <AccountPanel
      email={userData.user.email ?? ""}
      card={card}
      rewards={rewards}
      history={history}
    />
  );
}
