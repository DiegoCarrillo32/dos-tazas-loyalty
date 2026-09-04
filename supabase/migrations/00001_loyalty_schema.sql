-- Dos Tazas Loyalty Club — core schema.
--
-- Design notes worth keeping in view while reading this file:
--
--  * `members` is deliberately NOT `auth.users`. The whole premise of the
--    product is that a walk-in customer gets a card in ten seconds with no
--    password. `auth_user_id` is nullable and only gets filled when they
--    later choose to upgrade to a Google / email account.
--
--  * `card_token` is the only thing that ever travels in a QR code. It is an
--    opaque uuid, not `members.id` and certainly not the cédula, so a scanned
--    or photographed card leaks nothing about its owner. Rotating it revokes
--    every card ever printed for that member.
--
--  * `points_balance` is denormalized against `point_transactions`. The ledger
--    is the audit trail; the column is what the customer portal and the
--    scanner actually read. Both are only ever written together inside the
--    RPCs in 00003, so they cannot drift.

create table public.members (
  id             uuid primary key default gen_random_uuid(),
  -- Normalized to digits only. 9 digits for a national cédula, 11-12 for a
  -- DIMEX (foreign resident). Stored bare so lookups never depend on whether
  -- the customer typed the dashes.
  national_id    text not null unique,
  phone          text not null,                -- normalized: 8 digits, no +506
  full_name      text not null,
  card_token     uuid not null unique default gen_random_uuid(),
  auth_user_id   uuid unique references auth.users(id) on delete set null,
  tier           text not null default 'basic' check (tier in ('basic','member')),
  birthday       date,
  points_balance integer not null default 0 check (points_balance >= 0),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

comment on column public.members.card_token is
  'Opaque QR subject. Rotate via rotate_card_token() to invalidate every previously downloaded card PNG.';

create table public.rewards (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  points_cost integer not null check (points_cost > 0),
  -- Gates the "upgrade your account" benefits: a basic member cannot redeem
  -- these even if they have the points.
  member_only boolean not null default false,
  is_active   boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

create table public.point_transactions (
  id             uuid primary key default gen_random_uuid(),
  member_id      uuid not null references public.members(id) on delete cascade,
  kind           text not null check (kind in ('earn','redeem','adjust')),
  points         integer not null,             -- > 0 on earn, < 0 on redeem
  purchase_amount numeric(10,2),               -- colones; null on redeem
  reward_id      uuid references public.rewards(id),
  staff_id       uuid references auth.users(id),
  note           text,
  -- Idempotency key sent by the scanner. A barista double-tapping "Agregar"
  -- on café wifi should produce one transaction, not two. Same idea as the
  -- POS app's orders.client_uuid.
  client_request_id uuid unique,
  created_at     timestamptz not null default now()
);

create index point_transactions_member_created_idx
  on public.point_transactions (member_id, created_at desc);

-- Baristas and admins. Separate from `members` on purpose: a staff member is
-- an auth.users row, a customer generally is not.
create table public.staff (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text not null,
  role       text not null default 'barista' check (role in ('admin','barista')),
  created_at timestamptz not null default now()
);

-- Single-row settings table. The `id boolean primary key check (id)` trick
-- makes a second row impossible at the schema level.
create table public.loyalty_settings (
  id                boolean primary key default true check (id),
  colones_per_point integer not null default 1000 check (colones_per_point > 0),
  updated_at        timestamptz not null default now()
);
insert into public.loyalty_settings (id) values (true);

-- Feeds the rate limit in lookup_member(). Without this, the no-auth tier
-- would let anyone brute-force balances by cédula, which is public-ish
-- information in Costa Rica.
create table public.lookup_attempts (
  id          bigserial primary key,
  national_id text not null,
  succeeded   boolean not null,
  created_at  timestamptz not null default now()
);

create index lookup_attempts_national_id_created_idx
  on public.lookup_attempts (national_id, created_at desc);

-- Keep updated_at honest on members.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger members_touch_updated_at
  before update on public.members
  for each row execute function public.touch_updated_at();
