# Dos Tazas · Club de Lealtad

Loyalty and rewards for [Dos Tazas](https://github.com/DiegoCarrillo32), a Costa Rican
to-go coffee shop. One Next.js app with two sides:

| Route | Who | Auth |
|---|---|---|
| `/register` | Customers | none — cédula + teléfono |
| `/loyalty` | Customers | none — check points, download the card |
| `/cuenta` | Customers | Google or magic link (optional upgrade) |
| `/admin/login` | Baristas | email + password |
| `/admin/scanner` | Baristas | session + `is_staff()` |

## Getting started

The database runs **locally** via the Supabase CLI (Docker required). The
Supabase org is at its 2-project free-tier cap, so there is no cloud project
for this app yet — see "Moving to a hosted project" below.

```bash
npm install
cp .env.example .env.local          # fill in LOYALTY_QR_SECRET
npm run db:start                    # starts Postgres + Auth, applies migrations
npm run dev                         # in another shell
npm run db:seed                     # creates a barista + two demo members
```

`npm run db:start` prints the local API URL and anon key. Put them in
`.env.local` together with a QR secret:

```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<printed by db:start>
LOYALTY_QR_SECRET=<openssl rand -base64 32>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Seeded logins:

| | |
|---|---|
| Barista | `barista@dostazas.cr` / `barista-local-test-1234` |
| Member | cédula `1-2345-6789`, teléfono `8888 7777` |
| Member | cédula `2-0456-0789`, teléfono `7012 3456` |

Other scripts: `db:reset` replays every migration from scratch (it also wipes
`auth.users`, so re-run `db:seed` after), `db:stop`, `typecheck`, `lint`.

### Moving to a hosted project

Nothing in the schema is local-specific. Create a Supabase project, apply
`supabase/migrations/*.sql` in order, point `.env.local` at it, and follow
"Before deploying" below. The migrations use no name that collides with the
existing `dos-tazas-pos` schema (`members`, `rewards`, `point_transactions`,
`staff`, `loyalty_settings`, `lookup_attempts`, and `is_staff()` are all
free there), so that project is a viable host if a dedicated one is not.

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

- **The passwordless tier is a deliberate privacy tradeoff.** A cédula is
  semi-public in Costa Rica, so the phone number is the real secret protecting
  a balance. `lookup_member()` demands both, returns one identical error for
  "no such cédula" and "wrong phone" (so it can't be used as an existence
  oracle), and rate-limits to 5 failures per cédula per 15 minutes.
- **That rate limit is per-cédula, not per-IP.** It stops someone guessing one
  person's phone; it does *not* slow an attacker sweeping many different
  cédulas. Blunting that needs per-IP limiting at the edge (middleware, or a
  WAF in front of the deployment) and is a deployment concern rather than a
  database one.
- **Registration confirms that a cédula already has a card.** It has to, or a
  returning customer gets stuck. It returns no data with that confirmation.

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

## Before deploying

1. **Disable public signup** in the Supabase project's Auth settings. Staff
   authorization is the `staff` table, but an open signup still lets strangers
   create `auth.users` rows.
2. Create baristas in the dashboard, then insert their `staff` row:
   ```sql
   insert into public.staff (id, full_name, role)
   values ('<auth.users uuid>', 'Nombre Apellido', 'barista');
   ```
3. Enable Google OAuth and register `https://<domain>/auth/callback` as a
   redirect URL.
4. Serve over HTTPS. The scanner's camera needs a secure context — it works on
   `localhost`, but on any real device HTTP means no camera at all. This is the
   single most common "the scanner is broken" report.

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
