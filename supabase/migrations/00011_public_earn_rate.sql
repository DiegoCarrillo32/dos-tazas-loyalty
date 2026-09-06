-- Let everyone read the earn rate, not just staff.
--
-- `colones_per_point` is the one setting the UI advertises out loud: the
-- landing page, the reward path and the scanner all print "1 punto por cada
-- ₡X". Until now only staff could select the row, so every one of those places
-- carried its own hardcoded 1000 — and when the rate moved to ₡500 the whole
-- customer-facing app kept promising the old number.
--
-- There is nothing to protect here. The rate is printed on the counter and
-- derivable from any receipt: a purchase amount and the points it awarded give
-- it away. Writes stay admin-only (loyalty_settings_update_admin, 00002), so
-- this reveals a number the café already publishes and changes nothing else.

create policy loyalty_settings_select_public on public.loyalty_settings
  for select to anon, authenticated
  using (true);

-- 00002's staff-only read policy is now strictly narrower than the one above
-- and would only mislead the next reader into thinking the table is private.
drop policy loyalty_settings_select_staff on public.loyalty_settings;
