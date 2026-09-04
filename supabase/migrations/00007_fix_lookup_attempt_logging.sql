-- Fix: the lookup rate limit never fired.
--
-- The bug. lookup_member() did this on a miss:
--
--     insert into public.lookup_attempts (...) values (..., false);
--     raise exception 'not_found';
--
-- A function runs inside the caller's transaction, so `raise exception` aborts
-- that transaction and takes the INSERT on the line above it with it. Every
-- failed lookup rolled back its own audit record. The table only ever
-- accumulated successes, the failure count was permanently zero, and
-- assert_lookup_allowed() therefore never tripped — the brute-force protection
-- on the passwordless tier was decorative.
--
-- Verified before the fix: 7 consecutive wrong-phone lookups all returned
-- not_found, none returned rate_limited, and lookup_attempts held 12 rows, all
-- with succeeded = true.
--
-- The fix. Report failure as a *return value* rather than an exception, so the
-- transaction commits and the INSERT survives. Callers now check for an
-- `error` key in the returned object.
--
-- Input-validation errors (invalid_national_id, invalid_phone) still raise:
-- they happen before anything is logged, there is nothing to preserve, and a
-- malformed request is a caller bug rather than a failed attempt worth
-- counting against the customer.

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
  v_failures    integer;
  v_member      public.members;
begin
  select count(*) into v_failures
  from public.lookup_attempts
  where national_id = v_national_id
    and not succeeded
    and created_at > now() - interval '15 minutes';

  if v_failures >= 5 then
    return jsonb_build_object('error', 'rate_limited');
  end if;

  select * into v_member
  from public.members
  where national_id = v_national_id
    and phone = v_phone;

  if not found then
    insert into public.lookup_attempts (national_id, succeeded) values (v_national_id, false);
    -- One error for both "no such cédula" and "wrong phone": distinguishing
    -- them would make this endpoint a cédula-existence oracle.
    return jsonb_build_object('error', 'not_found');
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
  v_failures    integer;
  v_member      public.members;
begin
  if v_uid is null then
    return jsonb_build_object('error', 'not_authenticated');
  end if;

  if exists (select 1 from public.members where auth_user_id = v_uid) then
    return jsonb_build_object('error', 'account_already_linked');
  end if;

  select count(*) into v_failures
  from public.lookup_attempts
  where national_id = v_national_id
    and not succeeded
    and created_at > now() - interval '15 minutes';

  if v_failures >= 5 then
    return jsonb_build_object('error', 'rate_limited');
  end if;

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
    return jsonb_build_object('error', 'not_found');
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

-- assert_lookup_allowed() is now unused: its raise had the same rollback
-- problem, and both callers inline the check so they can return the error
-- instead. Dropping it rather than leaving a trap for the next caller.
drop function if exists public.assert_lookup_allowed(text);

revoke execute on function public.lookup_member(text, text)       from public;
revoke execute on function public.link_member_to_auth(text, text) from public, anon;
grant  execute on function public.lookup_member(text, text)       to anon, authenticated;
grant  execute on function public.link_member_to_auth(text, text) to authenticated;
