import type { Metadata } from "next";

import { requireCompleteProfile } from "@/lib/require-profile";

import { LoyaltyPortal } from "@/components/LoyaltyPortal";
import { getColonesPerPoint } from "@/lib/loyalty-settings";
import { createClient } from "@/lib/supabase/server";
import type { Reward } from "@/types";

export const metadata: Metadata = {
  title: "Club de Lealtad · Dos Tazas",
};

/**
 * The reward catalogue and the earn rate are fetched on the server and passed
 * down, so someone arriving with no card still sees what the points are
 * actually for and what they cost. Both are readable by anonymous visitors
 * (rewards_select_active in migration 00002, loyalty_settings_select_public in
 * 00011); nothing else in the schema is.
 */
export default async function LoyaltyPage() {
  await requireCompleteProfile();

  const supabase = await createClient();
  const [{ data }, colonesPerPoint] = await Promise.all([
    supabase
      .from("rewards")
      .select("id, name, description, points_cost, member_only")
      .eq("is_active", true)
      .order("sort_order"),
    getColonesPerPoint(),
  ]);

  const rewards: Reward[] = (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    pointsCost: r.points_cost,
    memberOnly: r.member_only,
    redeemable: false,
  }));

  return <LoyaltyPortal rewards={rewards} colonesPerPoint={colonesPerPoint} />;
}
