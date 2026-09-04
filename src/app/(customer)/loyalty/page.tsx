import type { Metadata } from "next";

import { LoyaltyPortal } from "@/components/LoyaltyPortal";
import { createClient } from "@/lib/supabase/server";
import type { Reward } from "@/types";

export const metadata: Metadata = {
  title: "Mis puntos · Dos Tazas",
};

/**
 * The reward catalogue is fetched on the server and passed down, so someone
 * arriving with no card still sees what the points are actually for. This is
 * the one table anonymous visitors can read directly (see the
 * rewards_select_active policy in migration 00002).
 */
export default async function LoyaltyPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("rewards")
    .select("id, name, description, points_cost, member_only")
    .eq("is_active", true)
    .order("sort_order");

  const rewards: Reward[] = (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    pointsCost: r.points_cost,
    memberOnly: r.member_only,
    redeemable: false,
  }));

  return <LoyaltyPortal rewards={rewards} />;
}
