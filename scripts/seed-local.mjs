/**
 * Seeds a usable LOCAL development environment: one barista account, one
 * customer with a few transactions.
 *
 * This is not `supabase/seed.sql` because staff are `auth.users` rows, and
 * hand-writing those into the auth schema means reproducing Supabase's own
 * password hashing and column layout. Going through the admin API instead is
 * both less brittle and the same path an admin takes in the dashboard.
 *
 * LOCAL ONLY. It refuses to run against anything but 127.0.0.1/localhost: the
 * service-role key below is the well-known key the Supabase CLI hands every
 * local stack, and the passwords are throwaways.
 *
 *   npm run db:seed
 */
const API = process.env.SUPABASE_URL ?? "http://127.0.0.1:54321";
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";
const APP = process.env.APP_URL ?? "http://localhost:3000";

if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(API)) {
  console.error(`Refusing to seed a non-local Supabase (${API}).`);
  process.exit(1);
}

const STAFF = { email: "barista@dostazas.cr", password: "barista-local-test-1234" };

const admin = (path, init = {}) =>
  fetch(`${API}${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

async function ensureStaffUser() {
  const list = await (await admin("/auth/v1/admin/users")).json();
  const existing = list.users?.find((u) => u.email === STAFF.email);
  if (existing) return existing.id;

  const created = await (
    await admin("/auth/v1/admin/users", {
      method: "POST",
      body: JSON.stringify({ ...STAFF, email_confirm: true }),
    })
  ).json();
  if (!created.id) throw new Error(`could not create staff user: ${JSON.stringify(created)}`);
  return created.id;
}

async function rest(path, init = {}) {
  const res = await admin(`/rest/v1${path}`, init);
  const text = await res.text();
  if (!res.ok) throw new Error(`${path} -> ${res.status} ${text}`);
  // PostgREST answers a plain insert with 201 and an EMPTY body unless asked
  // for a representation, so this cannot assume there is JSON to parse.
  return text ? JSON.parse(text) : null;
}

async function registerMember(nationalId, phone, fullName) {
  const res = await fetch(`${APP}/api/loyalty/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nationalId, phone, fullName }),
  });
  const body = await res.json();
  if (res.status === 409) {
    // Already there from a previous run — fine. Query by the NORMALIZED id:
    // register_member() strips the formatting before storing, so a lookup for
    // the literal "1-2345-6789" matches nothing.
    const normalized = nationalId.replace(/\D/g, "");
    const found = await rest(`/members?national_id=eq.${normalized}&select=card_token`);
    if (!found?.length) throw new Error(`member ${normalized} reported as existing but not found`);
    return found[0].card_token;
  }
  if (!res.ok) throw new Error(`register failed: ${JSON.stringify(body)}`);
  return body.cardToken;
}

const staffId = await ensureStaffUser();
await rest("/staff", {
  method: "POST",
  headers: { Prefer: "resolution=merge-duplicates" },
  body: JSON.stringify({ id: staffId, full_name: "Ana Barista", role: "admin" }),
});

console.log(`staff:  ${STAFF.email} / ${STAFF.password}  (role: admin)`);

// The app must be running for these — registration goes through its API so the
// card token is signed with the same LOYALTY_QR_SECRET the app will verify.
try {
  const maria = await registerMember("1-2345-6789", "8888 7777", "María Rodríguez");
  const carlos = await registerMember("2-0456-0789", "7012 3456", "Carlos Jiménez Mora");
  console.log(`member: María Rodríguez     ced 1-2345-6789  tel 8888 7777`);
  console.log(`member: Carlos Jiménez Mora ced 2-0456-0789  tel 7012 3456`);
  console.log(`\ncard tokens: ${maria}, ${carlos}`);
} catch (err) {
  console.log(`\nSkipped member seeding (is \`npm run dev\` running?): ${err.message}`);
}
