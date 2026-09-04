-- The only doors into the loyalty data.
--
-- Every function here is `security definer` and re-checks authorization
-- itself: for staff functions that means calling is_staff() rather than
-- trusting that a session exists, because "is logged in" and "is a barista"
-- are different claims and only the second one may move points.
--
-- Errors are raised with a stable machine-readable message (`member_exists`,
-- `not_found`, `insufficient_points`, …). The Next.js route handlers map those
-- onto Spanish copy; nothing user-facing is spelled here.

-- ---------------------------------------------------------------------------
-- Normalization — shared by every entry point so that "1-2345-6789",
-- "102345678 9" and "102345678" are the same person.
-- ---------------------------------------------------------------------------

create or replace function public.normalize_national_id(p_value text)
returns text
language plpgsql
immutable
as $$
declare
  v text;
begin
  v := regexp_replace(coalesce(p_value, ''), '\D', '', 'g');
  -- 9 digits = cédula nacional. 11-12 = DIMEX (residente extranjero).
  if length(v) not in (9, 11, 12) then
    raise exception 'invalid_national_id';
  end if;
  return v;
end;
$$;

create or replace function public.normalize_phone(p_value text)
returns text
language plpgsql
immutable
as $$
declare
  v text;
begin
  v := regexp_replace(coalesce(p_value, ''), '\D', '', 'g');
  -- Tolerate a pasted +506 country code.
  if length(v) = 11 and left(v, 3) = '506' then
    v := right(v, 8);
  end if;
  -- Costa Rican mobile/landline numbers are 8 digits starting 2,4,5,6,7,8.
  if v !~ '^[245678]\d{7}$' then
    raise exception 'invalid_phone';
  end if;
  return v;
end;
$$;

-- ---------------------------------------------------------------------------
-- Rate limiting for the passwordless tier.
--
-- Keyed per cédula, which is the threat that actually matters here: a cédula
-- is semi-public in Costa Rica, so the secret protecting a balance is the
-- phone number, and this is what stops someone guessing it.
--
-- Note what this does NOT do: it will not slow an attacker sweeping many
-- different cédulas, because that is bounded per-key. Blunting that needs
-- per-IP limiting at the edge (middleware / WAF), which is a deployment
-- concern rather than a database one — see README.
-- ---------------------------------------------------------------------------

create or replace function public.assert_lookup_allowed(p_national_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_failures integer;
begin
  select count(*) into v_failures
  from public.lookup_attempts
  where national_id = p_national_id
    and not succeeded
    and created_at > now() - interval '15 minutes';

  if v_failures >= 5 then
    raise exception 'rate_limited';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- register_member — the ten-second onboarding.
-- ---------------------------------------------------------------------------

create or replace function public.register_member(
  p_national_id text,
  p_phone       text,
  p_full_name   text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_national_id text := public.normalize_national_id(p_national_id);
  v_phone       text := public.normalize_phone(p_phone);
  v_name        text := btrim(coalesce(p_full_name, ''));
  v_member      public.members;
begin
  if length(v_name) < 2 or length(v_name) > 80 then
    raise exception 'invalid_name';
  end if;

  begin
    insert into public.members (national_id, phone, full_name)
    values (v_national_id, v_phone, v_name)
    returning * into v_member;
  exception when unique_violation then
    -- Deliberate: we confirm the card exists but return no data with it, so
    -- this is not a way to read someone's balance. The customer is sent to
    -- the lookup form, which does demand the phone number.
    raise exception 'member_exists';
  end;

  return jsonb_build_object(
    'card_token',     v_member.card_token,
    'full_name',      v_member.full_name,
    'national_id',    v_member.national_id,
    'points_balance', v_member.points_balance,
    'tier',           v_member.tier
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- lookup_member — "check my points" with no password.
-- ---------------------------------------------------------------------------

create or replace function public.lookup_member(
  p_national_id text,
  p_phone       text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_national_id text := public.normalize_national_id(p_national_id);
  v_phone       text := public.normalize_phone(p_phone);
  v_member      public.members;
begin
  perform public.assert_lookup_allowed(v_national_id);

  select * into v_member
  from public.members
  where national_id = v_national_id
    and phone = v_phone;

  if not found then
    insert into public.lookup_attempts (national_id, succeeded) values (v_national_id, false);
    -- One error for both "no such cédula" and "wrong phone". Distinguishing
    -- them would turn this endpoint into a cédula-existence oracle.
    raise exception 'not_found';
  end if;

  insert into public.lookup_attempts (national_id, succeeded) values (v_national_id, true);

  return jsonb_build_object(
    'card_token',     v_member.card_token,
    'full_name',      v_member.full_name,
    'national_id',    v_member.national_id,
    'points_balance', v_member.points_balance,
    'tier',           v_member.tier
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- link_member_to_auth — the upgrade path. Merges an anonymous card into a
-- Google / email account, which is what actually unlocks member-only rewards.
-- ---------------------------------------------------------------------------

create or replace function public.link_member_to_auth(
  p_national_id text,
  p_phone       text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_national_id text := public.normalize_national_id(p_national_id);
  v_phone       text := public.normalize_phone(p_phone);
  v_uid         uuid := auth.uid();
  v_member      public.members;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  if exists (select 1 from public.members where auth_user_id = v_uid) then
    raise exception 'account_already_linked';
  end if;

  perform public.assert_lookup_allowed(v_national_id);

  -- The `auth_user_id is null` guard is the security-relevant half: without
  -- it, knowing someone's cédula and phone would let you attach their card to
  -- your own account and drain it.
  update public.members
     set auth_user_id = v_uid,
         tier         = 'member'
   where national_id  = v_national_id
     and phone        = v_phone
     and auth_user_id is null
  returning * into v_member;

  if not found then
    insert into public.lookup_attempts (national_id, succeeded) values (v_national_id, false);
    raise exception 'not_found';
  end if;

  return jsonb_build_object(
    'card_token',     v_member.card_token,
    'full_name',      v_member.full_name,
    'national_id',    v_member.national_id,
    'points_balance', v_member.points_balance,
    'tier',           v_member.tier
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- staff_lookup_member — what the barista sees after a scan.
-- ---------------------------------------------------------------------------

create or replace function public.staff_lookup_member(p_card_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member  public.members;
  v_rewards jsonb;
  v_history jsonb;
begin
  if not public.is_staff() then
    raise exception 'forbidden';
  end if;

  select * into v_member from public.members where card_token = p_card_token;
  if not found then
    raise exception 'not_found';
  end if;

  select coalesce(jsonb_agg(r order by r.sort_order, r.points_cost), '[]'::jsonb)
    into v_rewards
  from (
    select id, name, description, points_cost, member_only,
           (points_cost <= v_member.points_balance
            and (not member_only or v_member.tier = 'member')) as redeemable,
           sort_order
    from public.rewards
    where is_active
  ) r;

  select coalesce(jsonb_agg(h order by h.created_at desc), '[]'::jsonb)
    into v_history
  from (
    select t.id, t.kind, t.points, t.purchase_amount, t.created_at, rw.name as reward_name
    from public.point_transactions t
    left join public.rewards rw on rw.id = t.reward_id
    where t.member_id = v_member.id
    order by t.created_at desc
    limit 5
  ) h;

  return jsonb_build_object(
    'card_token',     v_member.card_token,
    'full_name',      v_member.full_name,
    'points_balance', v_member.points_balance,
    'tier',           v_member.tier,
    'member_since',   v_member.created_at,
    'rewards',        v_rewards,
    'history',        v_history
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- staff_add_points
-- ---------------------------------------------------------------------------

create or replace function public.staff_add_points(
  p_card_token       uuid,
  p_purchase_amount  numeric,
  p_client_request_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member public.members;
  v_rate   integer;
  v_points integer;
  v_existing public.point_transactions;
begin
  if not public.is_staff() then
    raise exception 'forbidden';
  end if;

  if p_purchase_amount is null or p_purchase_amount <= 0 or p_purchase_amount > 1000000 then
    -- The upper bound is a typo guard: an extra zero on a ₡3.500 order should
    -- not silently mint 35 points.
    raise exception 'invalid_amount';
  end if;

  -- Idempotent replay: same request id, same answer, no second ledger row.
  select * into v_existing
  from public.point_transactions
  where client_request_id = p_client_request_id;

  if found then
    select * into v_member from public.members where id = v_existing.member_id;
    return jsonb_build_object(
      'points_awarded', v_existing.points,
      'points_balance', v_member.points_balance,
      'full_name',      v_member.full_name,
      'replayed',       true
    );
  end if;

  select * into v_member from public.members where card_token = p_card_token for update;
  if not found then
    raise exception 'not_found';
  end if;

  select colones_per_point into v_rate from public.loyalty_settings where id;
  v_points := floor(p_purchase_amount / v_rate)::integer;

  if v_points <= 0 then
    raise exception 'amount_below_minimum';
  end if;

  insert into public.point_transactions
    (member_id, kind, points, purchase_amount, staff_id, client_request_id)
  values
    (v_member.id, 'earn', v_points, p_purchase_amount, auth.uid(), p_client_request_id);

  update public.members
     set points_balance = points_balance + v_points
   where id = v_member.id
  returning * into v_member;

  return jsonb_build_object(
    'points_awarded', v_points,
    'points_balance', v_member.points_balance,
    'full_name',      v_member.full_name,
    'replayed',       false
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- staff_redeem_points
-- ---------------------------------------------------------------------------

create or replace function public.staff_redeem_points(
  p_card_token        uuid,
  p_reward_id         uuid,
  p_client_request_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member   public.members;
  v_reward   public.rewards;
  v_existing public.point_transactions;
begin
  if not public.is_staff() then
    raise exception 'forbidden';
  end if;

  select * into v_existing
  from public.point_transactions
  where client_request_id = p_client_request_id;

  if found then
    select * into v_member from public.members where id = v_existing.member_id;
    return jsonb_build_object(
      'points_spent',   abs(v_existing.points),
      'points_balance', v_member.points_balance,
      'full_name',      v_member.full_name,
      'replayed',       true
    );
  end if;

  select * into v_reward from public.rewards where id = p_reward_id and is_active;
  if not found then
    raise exception 'reward_not_found';
  end if;

  select * into v_member from public.members where card_token = p_card_token;
  if not found then
    raise exception 'not_found';
  end if;

  if v_reward.member_only and v_member.tier <> 'member' then
    raise exception 'member_only_reward';
  end if;

  -- The balance check and the debit are the same statement on purpose. The
  -- UPDATE takes the row lock, so two baristas scanning the same card at two
  -- tills cannot both pass a separate SELECT check and each redeem the last
  -- reward. Zero rows back means the balance was insufficient.
  update public.members
     set points_balance = points_balance - v_reward.points_cost
   where id = v_member.id
     and points_balance >= v_reward.points_cost
  returning * into v_member;

  if not found then
    raise exception 'insufficient_points';
  end if;

  insert into public.point_transactions
    (member_id, kind, points, reward_id, staff_id, client_request_id, note)
  values
    (v_member.id, 'redeem', -v_reward.points_cost, v_reward.id, auth.uid(),
     p_client_request_id, v_reward.name);

  return jsonb_build_object(
    'points_spent',   v_reward.points_cost,
    'points_balance', v_member.points_balance,
    'full_name',      v_member.full_name,
    'reward_name',    v_reward.name,
    'replayed',       false
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- rotate_card_token — revocation. Every PNG ever downloaded for this member
-- stops scanning the moment this runs.
-- ---------------------------------------------------------------------------

create or replace function public.rotate_card_token(p_member_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member public.members;
begin
  if not public.is_staff_admin() then
    raise exception 'forbidden';
  end if;

  update public.members
     set card_token = gen_random_uuid()
   where id = p_member_id
  returning * into v_member;

  if not found then
    raise exception 'not_found';
  end if;

  return jsonb_build_object('card_token', v_member.card_token);
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants. Default-deny, then hand out the narrowest workable set.
-- ---------------------------------------------------------------------------

revoke execute on function public.normalize_national_id(text)              from public;
revoke execute on function public.normalize_phone(text)                    from public;
revoke execute on function public.assert_lookup_allowed(text)              from public, anon, authenticated;
revoke execute on function public.register_member(text, text, text)        from public;
revoke execute on function public.lookup_member(text, text)                from public;
revoke execute on function public.link_member_to_auth(text, text)          from public, anon;
revoke execute on function public.staff_lookup_member(uuid)                from public, anon;
revoke execute on function public.staff_add_points(uuid, numeric, uuid)    from public, anon;
revoke execute on function public.staff_redeem_points(uuid, uuid, uuid)    from public, anon;
revoke execute on function public.rotate_card_token(uuid)                  from public, anon;

grant execute on function public.register_member(text, text, text)     to anon, authenticated;
grant execute on function public.lookup_member(text, text)             to anon, authenticated;
grant execute on function public.link_member_to_auth(text, text)       to authenticated;
grant execute on function public.staff_lookup_member(uuid)             to authenticated;
grant execute on function public.staff_add_points(uuid, numeric, uuid) to authenticated;
grant execute on function public.staff_redeem_points(uuid, uuid, uuid) to authenticated;
grant execute on function public.rotate_card_token(uuid)               to authenticated;
