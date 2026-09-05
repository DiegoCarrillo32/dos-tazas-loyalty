# Dos Tazas · Club de Lealtad

Loyalty and rewards for [Dos Tazas](https://github.com/DiegoCarrillo32), a Costa Rican
to-go coffee shop. One Next.js app with two sides:

| Route | Who | Auth |
|---|---|---|
| `/loyalty` | Anyone | none — what the club is, rewards catalogue |
| `/register` | Customers | none — cédula + name creates a card |
| `/account` | Customers | Google **or** email + password (optional account) |
| `/admin/login` | Baristas | email + password |
| `/admin/scanner` | Baristas | session + `is_staff()` |

## Cards and accounts are different things

A **card** is cédula + name. No password, no phone, no account — created in
seconds at the counter and downloaded as a signed QR. This is most customers.

An **account** is a Supabase auth user (Google or email+password). Optional. It
lets someone read their balance from any device and unlock member rewards.

**No password is stored in this schema.** Hashing, sessions, resets, rate
limiting and Google identity linking are all Supabase Auth's job. Because both
sign-in methods resolve to one `auth.users` row, "sign in with Google" and
"sign in with the password" reach the same account for free — Supabase attaches
an OAuth identity to the existing user with the same confirmed email.

### Claiming a card is by possession, not by cédula

Attaching an existing card to an account requires the card's **signed QR
payload**, whose HMAC the route handler verifies before the token reaches the
database. Claiming by cédula would be a trivial account takeover: a cédula is
semi-public in Costa Rica. Verified — a second account holding the same token
is refused with `card_already_linked` and sees nothing.

A card created while already signed in is attached immediately, so the common
"sign up at home" path never touches the claim flow at all.

## Getting started

The hosted project is **`dos-tazas-loyalty-club`** (`txkayyfhrbcqvcexwibu`,
us-east-1) in the `DiegoCarrillo32` org. All seven migrations are applied there.

```bash
npm install
cp .env.example .env.local      # fill in the values below
npm run dev
```

```
NEXT_PUBLIC_SUPABASE_URL=https://txkayyfhrbcqvcexwibu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<Project Settings → API Keys → publishable>
LOYALTY_QR_SECRET=<openssl rand -base64 32>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`LOYALTY_QR_SECRET` is generated per environment and is **not** interchangeable:
change it and every QR already printed stops validating. Pick one value for
production and keep it.

### Local development (optional)

A full local stack runs under Docker if you would rather not touch the hosted
database:

```bash
npm run db:start     # Postgres + Auth, applies every migration
npm run db:seed      # barista + two demo members (needs `npm run dev` running)
```

`db:start` prints a local URL and anon key to put in `.env.local`. `db:reset`
replays the migrations from scratch (it wipes `auth.users`, so re-seed after).
The previous local settings are saved in `.env.local.bak`.

### Applying future migrations

Add the file to `supabase/migrations/`, verify it locally with `db:reset`, then
apply it to the hosted project.

## How the QR is secured

The card encodes `DT1.<card_token>.<hmac>` — an HMAC-SHA256 over
`DT1.<card_token>`, keyed with `LOYALTY_QR_SECRET`, truncated to 32 base64url
characters (~192 bits). `card_token` is an opaque uuid, never the member id and
never the cédula, so a photographed card leaks nothing about its owner.

**Why not a JWT.** The card gets downloaded as a PNG and lives in a photo roll
indefinitely. A JWT's `exp` would silently brick every saved card the day it
passed, and a JWT without `exp` is just a bulkier HMAC carrying a JSON header
nobody reads. Revocation is handled properly instead: `rotate_card_token()`
regenerates the uuid, which invalidates every card ever issued to that member.

`LOYALTY_QR_SECRET` is server-only. Signing happens in route handlers on the
way out and verification happens on the way in, so the key never reaches the
browser.

## Authorization model

There is **no service-role key**. Every privileged operation is a
`security definer` Postgres function; RLS denies direct table writes outright,
which makes those functions the only door rather than one door among several.

- Anonymous customers get `register_member()` and `lookup_member()`.
- Staff functions re-check `is_staff()` **inside** the function. Holding a
  session is not authorization — a customer who upgraded their account is
  perfectly authenticated and still gets a 403 from Postgres.
- `/api/points` re-verifies the QR signature on every call. A prior successful
  `/api/validate-scan` grants nothing.

### Known limits, stated plainly

- **A downloaded card is a bearer token.** Anyone holding the QR image can be
  scanned as that member, and can claim the card to their account if nobody has
  yet. That is the deliberate tradeoff for a card that works with no login —
  the same as a physical stamp card. `rotate_card_token()` revokes a lost one.
- **Registration confirms that a cédula already has a card.** It has to, or a
  returning customer gets stuck. It returns no data with that confirmation.
- **Per-IP rate limiting is still not implemented.** `lookup_attempts` bounds
  failed claims per cédula, but blunting a broad sweep needs limiting at the
  edge (middleware or a WAF), which is a deployment concern rather than a
  database one.

## Operational checks

`points_balance` is denormalized against the `point_transactions` ledger. Both
are written in the same transaction inside the RPCs, so they cannot drift
through any application path — but a direct SQL write bypassing the RPCs will
desync them. To confirm:

```sql
select m.full_name, m.points_balance, coalesce(sum(t.points), 0) as ledger_sum
from public.members m
left join public.point_transactions t on t.member_id = m.id
group by m.id, m.full_name, m.points_balance
having m.points_balance <> coalesce(sum(t.points), 0);
```

Zero rows is healthy.

`lookup_attempts` takes a row on every customer lookup but is only read for the
last 15 minutes, so `purge_lookup_attempts()` (migration 00008) trims it to a
day's retention nightly at 04:17 UTC via pg_cron. Check it is still scheduled
with `select jobname, schedule, active from cron.job;`, or call the function by
hand from any scheduler if pg_cron is unavailable.

## Staff accounts

Baristas are provisioned by hand — there is no staff registration page.

1. Supabase dashboard → Authentication → Users → **Add user**, with an email on
   a domain that actually resolves. `barista@dostazas.cr` will be rejected:
   GoTrue validates the domain and `dostazas.cr` is NXDOMAIN.
2. Copy the new user's UUID and give them a staff row:

```sql
insert into public.staff (id, full_name, role)
values ('<auth.users uuid>', 'Nombre Apellido', 'barista');
```

`role` is `'barista'` or `'admin'`; only `admin` can edit rewards or call
`rotate_card_token()`.

### On public signup

Signup is deliberately left **enabled**, because the customer "upgrade" tier
depends on it — Google and magic-link sign-in are ordinary signups.

That is safe here because being signed in is not being staff. A stranger who
creates an account gets an `auth.users` row and nothing else: `is_staff()`
returns false, so `members_select_staff` never matches, and every `staff_*` RPC
returns `forbidden` before touching data. Verified against the live project — a
signed-in non-staff user sees zero members, zero staff rows and zero ledger
entries. **The `public.staff` table is the authorization boundary, not the
existence of a session.**

If you later stop using the upgrade tier, turning signup off is a free extra
layer.

## Plan limits worth knowing

**Custom SMTP is required regardless of plan — Pro does not fix this.** Supabase's
built-in email service *"will refuse to deliver messages to addresses that are
not part of the project's team"*, and is rate-limited on a best-effort basis with
no SLA. So the magic-link option on `/account` cannot work for real customers
until custom SMTP is configured (Authentication → Emails → SMTP; Resend,
SendGrid, Postmark all work). Google OAuth is unaffected — it sends no email.

**Free-plan projects pause after 7 days of low activity.** For a café loyalty
card that is a genuine outage: the customer portal and the barista scanner both
stop until someone resumes it. Paid-plan projects are never auto-paused. There
is a 90-day window to restore a paused project.

**Free plan has no backups.** `point_transactions` is the ledger behind every
customer's balance; losing it is not recoverable from anywhere else.

## Supabase email templates — REQUIRED

Supabase's default templates send `{{ .ConfirmationURL }}`, which routes through
GoTrue's own `/auth/v1/verify` and hands the session back in a **URL fragment**.
Fragments are never sent to the server, so a server-rendered app cannot see the
session and the user lands back looking signed out — silently, with no error.

Replace the link in each template (Authentication → Emails) with the token-hash
form, which `/auth/confirm` redeems server-side into a cookie:

**Confirm signup**
```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/account">
  Confirmar mi correo
</a>
```

**Reset password**
```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password">
  Cambiar mi contraseña
</a>
```

**Magic link**
```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=magiclink&next=/account">
  Entrar
</a>
```

`/auth/confirm` also defaults a `recovery` link to `/reset-password` even when the
template omits `next`, so a half-updated template still reaches the right page.

Verified end to end locally: recovery token → `/auth/confirm` → session cookie →
`/reset-password` → password changed → old password rejected, new one accepted, and
a replayed token refused with `?error=link`.

## Completing a profile

An account with no card can neither earn nor redeem, so signing in without one
is a dead end. `requireCompleteProfile()` (`src/lib/require-profile.ts`) sends
those visitors to `/account`, which shows a blocking form: **cédula required**,
name prefilled from the Google profile when there is one, phone optional.
Anonymous visitors are unaffected and never pay for the query.

The guard is called from the individual pages rather than the shared layout,
because a layout cannot see the current path — driving it off a forwarded
header meant any request missing that header redirected `/account` to itself in
an infinite loop.

## Request security

Every mutating endpoint (`/api/loyalty/register`, `/api/loyalty/claim`,
`/api/validate-scan`, `/api/points`) applies the same three checks, in order:

1. **Same-origin** (`src/lib/same-origin.ts`). These endpoints authenticate by
   cookie, which the browser attaches automatically — so without this a page on
   another domain could make a signed-in barista's browser POST to `/api/points`
   and award points to a card of the attacker's choosing. Supabase's SameSite=Lax
   cookie already blocks the classic case, but that is one library's default
   protecting our endpoints; the explicit check keeps the guarantee here where it
   can be read and tested. Verified: a request with `Origin: evil.example.com`
   gets 403 on all four routes.
2. **zod schema**, before any value reaches the database. The client runs the
   same schema for instant feedback, but the handler never trusts that it did.
3. **HMAC / session**, where relevant. A forged QR is rejected at the signature
   before any query runs, and `/api/points` re-verifies the payload rather than
   trusting a prior `/api/validate-scan`.

Underneath, the RPCs validate a third time in SQL, so calling PostgREST directly
with the public anon key does not bypass anything — confirmed against the hosted
project.

## Before deploying

## Stack

Next.js 16 (App Router) · React 19 · Tailwind v4 · Supabase ·
`qrcode.react` · `html5-qrcode` · `html-to-image` · zod

`src/design-system/` is **vendored** — copied from the `dos-tazas-design-system`
repo rather than installed, because that repo is a Next app rather than a
published package. Re-sync by copying, and fix bugs upstream. It brings the
brand tokens (`globals.css`), the warm palette, Gotham/Titan One and 31
components; `Surface` is the card primitive (there is no `Card`), and headings
use the `font-heading` utility (there is no `Typography`).

UI copy is Spanish only.

### Two design-system bugs worked around here

Both should be fixed upstream in `dos-tazas-design-system`; this repo works
around them rather than forking the vendored copy.

1. **`Button variant="primary"` fails contrast in dark mode.** It renders
   `bg-warm-roast text-white`, and `warm-roast` flips to `#c2b5a3` in dark —
   a light beige. White on that is **2.01:1**, well under the 4.5:1 WCAG AA
   floor (it is a fine 10.86:1 in light mode). Every CTA here therefore uses
   `variant="accent"`, which is `coffee-fruit` `#b92323` — the same hex in both
   themes and **6.31:1** against white. That is also what the brand guide calls
   the "primary accent", so it is the right token as well as the legible one.

2. **`public/assets/LOGO-05.svg` disappears in light mode.** The file carries
   its own `@media (prefers-color-scheme: dark)` rule flipping its fill to
   `#fff5e1`. Loaded through an `<img>`, that query resolves against the
   *operating system* preference, while this app's theme is a `.dark` class the
   visitor sets independently. With an OS set to dark and the app set to light,
   the logo paints `#fff5e1` on the `#fff5e1` pergamino background and vanishes.
   `src/components/DosTazasLogo.tsx` inlines the mark and paints it with
   `currentColor` so it follows the app's theme like every other brand color.
# dos-tazas-loyalty
