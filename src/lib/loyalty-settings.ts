import { createClient } from "./supabase/server";

/**
 * Matches `loyalty_settings.colones_per_point`'s schema default (00001). Used
 * only if the settings row cannot be read — the copy still reads sensibly and
 * the real award is computed in Postgres either way.
 */
export const DEFAULT_COLONES_PER_POINT = 1000;

/**
 * How many colones buy one point, straight from `loyalty_settings`.
 *
 * The rate lives in one row that an admin can change, so every screen that
 * quotes it has to read it rather than repeat it. Before this, three
 * components hardcoded ₡1.000 and all three lied the day the rate became ₡500.
 *
 * Readable by anyone since migration 00011, so this works for the signed-out
 * landing page as well as for staff.
 */
export async function getColonesPerPoint(): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("loyalty_settings")
    .select("colones_per_point")
    .maybeSingle();

  return data?.colones_per_point ?? DEFAULT_COLONES_PER_POINT;
}
