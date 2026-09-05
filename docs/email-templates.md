# Supabase email templates

Paste these in **Supabase → Authentication → Emails**, one per template.

## Why the default doesn't work

Supabase ships `{{ .ConfirmationURL }}`, which sends the user through GoTrue's
own `/auth/v1/verify` and returns the session in a **URL fragment** (`#access_token=…`).
Fragments are never sent to the server, so a server-rendered app cannot see the
session — the user lands back looking signed out, with no error to explain it.

`{{ .TokenHash }}` is redeemed server-side by `/auth/confirm`, which writes the
session straight to cookies. It also survives the link being opened in a
different browser than the one that requested it (a phone mail app, say).

Set **Site URL** to your deployment first (`https://loyalty.cafedostazas.com`);
`{{ .SiteURL }}` below resolves from it.

---

## 1. Confirm signup

```html
<h2>Confirmá tu correo</h2>
<p>Hola, gracias por unirte al Club de Lealtad de Dos Tazas.</p>
<p>
  <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/account">
    Confirmar mi correo
  </a>
</p>
<p>Si no creaste esta cuenta, podés ignorar este mensaje.</p>
```

## 2. Reset password

```html
<h2>Cambiá tu contraseña</h2>
<p>Recibimos una solicitud para cambiar la contraseña de tu cuenta.</p>
<p>
  <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password">
    Cambiar mi contraseña
  </a>
</p>
<p>Si no fuiste vos, podés ignorar este mensaje: tu contraseña no cambia hasta
que usés el enlace.</p>
```

## 3. Magic Link

```html
<h2>Entrá a tu cuenta</h2>
<p>Usá este enlace para entrar al Club de Lealtad.</p>
<p>
  <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=magiclink&next=/account">
    Entrar
  </a>
</p>
```

## 4. Change email address (only if you enable it)

```html
<h2>Confirmá tu nuevo correo</h2>
<p>
  <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email_change&next=/account">
    Confirmar el cambio
  </a>
</p>
```

---

## The part that actually matters

Only the `href` needs to change. Everything else is copy. The three moving
parts are:

| Piece | Must be |
|---|---|
| `token_hash={{ .TokenHash }}` | not `{{ .ConfirmationURL }}` |
| `type=` | `email`, `recovery`, `magiclink` or `email_change` — must match the template |
| `next=` | where to land afterwards: `/account`, except recovery → `/reset-password` |

`type` matters: `/auth/confirm` passes it to `verifyOtp()`, and the wrong value
fails verification.

If you omit `next` entirely, `/auth/confirm` still routes a `recovery` link to
`/reset-password` and everything else to `/account` — so a half-updated
template degrades to the right place rather than breaking.

## Also check

**Authentication → URL Configuration**

- Site URL: `https://loyalty.cafedostazas.com`
- Redirect URLs must include:
  - `https://loyalty.cafedostazas.com/auth/callback` (Google)
  - `https://loyalty.cafedostazas.com/auth/confirm` (email links)
  - `http://localhost:3000/**` while developing

Without these, the flow completes at the provider and then dies on the way back.
