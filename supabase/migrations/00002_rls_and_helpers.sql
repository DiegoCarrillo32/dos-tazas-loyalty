-- Row Level Security + the staff predicates everything else is built on.
--
-- The governing rule in this app: **no table is directly writable by anyone.**
-- Every mutation goes through a `security definer` RPC in 00003 that re-checks
-- authorization itself. RLS here is the backstop that makes those RPCs the
-- only door, rather than one door among several.
--
-- Anonymous customers have no session at all, so they get no policies
-- whatsoever on `members` — their entire access path is register_member() and
-- lookup_member(), which are security definer and therefore bypass RLS after
-- doing their own checks.

alter table public.members            enable row level security;
alter table public.rewards            enable row level security;
alter table public.point_transactions enable row level security;
alter table public.staff              enable row level security;
alter table public.loyalty_settings   enable row level security;
alter table public.lookup_attempts    enable row level security;

-- ---------------------------------------------------------------------------
-- Staff predicates
-- ---------------------------------------------------------------------------
-- `security definer` so they can read public.staff regardless of the caller's
-- own policies, which is what stops the staff policies below from recursing
-- into themselves. Same shape as the POS app's public.is_admin().

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.staff where id = auth.uid());
$$;

create or replace function public.is_staff_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.staff where id = auth.uid() and role = 'admin');
$$;

revoke execute on function public.is_staff()       from public, anon;
revoke execute on function public.is_staff_admin() from public, anon;
grant  execute on function public.is_staff()       to authenticated;
grant  execute on function public.is_staff_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- members
-- ---------------------------------------------------------------------------
-- An upgraded customer can read their own row directly (that is what makes
-- /cuenta a plain query instead of another RPC). Staff can read any member.
-- Nobody gets insert/update/delete — those are RPC-only.

create policy members_select_own on public.members
  for select to authenticated
  using (auth_user_id = auth.uid());

create policy members_select_staff on public.members
  for select to authenticated
  using (public.is_staff());

-- ---------------------------------------------------------------------------
-- rewards
-- ---------------------------------------------------------------------------
-- The only table anonymous visitors can read: the customer portal shows the
-- reward catalogue before you have a card, as a reason to sign up.

create policy rewards_select_active on public.rewards
  for select to anon, authenticated
  using (is_active);

create policy rewards_write_admin on public.rewards
  for all to authenticated
  using (public.is_staff_admin())
  with check (public.is_staff_admin());

-- ---------------------------------------------------------------------------
-- point_transactions
-- ---------------------------------------------------------------------------

create policy point_transactions_select_own on public.point_transactions
  for select to authenticated
  using (
    exists (
      select 1 from public.members m
      where m.id = point_transactions.member_id
        and m.auth_user_id = auth.uid()
    )
  );

create policy point_transactions_select_staff on public.point_transactions
  for select to authenticated
  using (public.is_staff());

-- ---------------------------------------------------------------------------
-- staff / loyalty_settings / lookup_attempts
-- ---------------------------------------------------------------------------
-- Staff-readable, never public. lookup_attempts in particular is a log of
-- which cédulas have been probed, which is exactly the data the rate limit
-- exists to protect.

create policy staff_select_staff on public.staff
  for select to authenticated
  using (public.is_staff());

create policy loyalty_settings_select_staff on public.loyalty_settings
  for select to authenticated
  using (public.is_staff());

create policy loyalty_settings_update_admin on public.loyalty_settings
  for update to authenticated
  using (public.is_staff_admin())
  with check (public.is_staff_admin());

create policy lookup_attempts_select_staff on public.lookup_attempts
  for select to authenticated
  using (public.is_staff());
