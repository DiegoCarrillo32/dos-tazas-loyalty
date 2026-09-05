-- Move authentication entirely into Supabase Auth, and make the counter tier
-- credential-free.
--
-- WHAT CHANGED AND WHY
--
-- Before: the counter tier was cédula + phone, and the phone doubled as the
-- secret protecting a balance. That made registration slower than it needed to
-- be and put a weak, guessable secret in a security-critical position.
--
-- Now there are two clearly separated things:
--
--   a CARD    — cédula + name. No credential at all. Created in seconds at the
--               counter, downloaded as a signed QR, scannable in store forever.
--   an ACCOUNT— a Supabase auth user (email+password or Google). Optional.
--               Lets a customer read their balance from any device and unlock
--               member rewards.
--
-- No password is stored in this schema. Hashing, sessions, resets, rate limits
-- and Google identity linking are all Supabase Auth's job — code we do not
-- write is code that cannot be got wrong.
--
-- HOW A CARD IS CLAIMED, AND WHY IT IS NOT BY CÉDULA
--
-- A cédula is semi-public in Costa Rica, so "sign in, type a cédula, take that
-- card" would be a trivial account takeover. Claiming instead requires the
-- card's `card_token`, which only ever reaches the customer inside an
-- HMAC-signed QR payload that the route handler verifies before calling this.
-- Possession of the card is the proof.

-- The phone is now genuinely optional — nothing depends on it.
alter table public.members alter column phone drop not null;

-- Optional contact address. NOT an auth identifier: the account's email lives
-- in auth.users. This is only so staff can reach a member.
alter table public.members add column if not exists email text;

comment on column public.members.email is
  'Optional contact address. Not a credential — account identity lives in auth.users.';

-- ---------------------------------------------------------------------------
-- register_member — cédula + name. Phone optional.
--
-- If the caller happens to be signed in, the new card is attached to their
-- account immediately, which is the common path for someone signing up at home
-- and skips the claim step entirely.
-- ---------------------------------------------------------------------------
drop function if exists public.register_member(text, text, text);

create or replace function public.register_member(
  p_national_id text,
  p_full_name   text,
  p_phone       text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_national_id text := public.normalize_national_id(p_national_id);
  v_name        text := btrim(coalesce(p_full_name, ''));
  v_phone       text;
  v_uid         uuid := auth.uid();
  v_member      public.members;
begin
  if length(v_name) < 2 or length(v_name) > 80 then
    raise exception 'invalid_name';
  end if;

  -- Absent is fine; present must be valid, so a typo is caught now rather than
  -- silently sitting on the record.
  if coalesce(btrim(p_phone), '') <> '' then
    v_phone := public.normalize_phone(p_phone);
  end if;

  begin
    insert into public.members (national_id, phone, full_name, auth_user_id, tier)
    values (v_national_id, v_phone, v_name, v_uid,
            case when v_uid is null then 'basic' else 'member' end)
    returning * into v_member;
  exception when unique_violation then
    raise exception 'member_exists';
  end;

  return jsonb_build_object(
    'member_id',      v_member.id,
    'card_token',     v_member.card_token,
    'full_name',      v_member.full_name,
    'national_id',    v_member.national_id,
    'points_balance', v_member.points_balance,
    'tier',           v_member.tier,
    'linked',         v_member.auth_user_id is not null
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- claim_member_card — attach an existing anonymous card to the signed-in
-- account. Authorized by possession of the card token (see header).
-- ---------------------------------------------------------------------------
drop function if exists public.link_member_to_auth(text, text);

create or replace function public.claim_member_card(p_card_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_member public.members;
begin
  if v_uid is null then
    return jsonb_build_object('error', 'not_authenticated');
  end if;

  if exists (select 1 from public.members
             where auth_user_id = v_uid and card_token <> p_card_token) then
    return jsonb_build_object('error', 'account_already_linked');
  end if;

  -- The `auth_user_id is null or = v_uid` guard is what stops one account
  -- taking a card that already belongs to another, while still making a repeat
  -- claim by the rightful owner harmless.
  update public.members
     set auth_user_id = v_uid, tier = 'member'
   where card_token = p_card_token
     and (auth_user_id is null or auth_user_id = v_uid)
  returning * into v_member;

  if not found then
    return jsonb_build_object('error', 'card_already_linked');
  end if;

  return jsonb_build_object(
    'member_id',      v_member.id,
    'card_token',     v_member.card_token,
    'full_name',      v_member.full_name,
    'national_id',    v_member.national_id,
    'points_balance', v_member.points_balance,
    'tier',           v_member.tier,
    'linked',         true
  );
end;
$$;

-- The phone-keyed balance lookup is retired. It was the one place a
-- semi-public cédula plus a guessable phone number could reveal someone's
-- name and balance; reading a balance now requires either the card itself or
-- a real signed-in account.
drop function if exists public.lookup_member(text, text);

revoke execute on function public.register_member(text, text, text) from public;
revoke execute on function public.claim_member_card(uuid)           from public, anon;
grant  execute on function public.register_member(text, text, text) to anon, authenticated;
grant  execute on function public.claim_member_card(uuid)           to authenticated;
