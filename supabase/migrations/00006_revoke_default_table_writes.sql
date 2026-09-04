-- Take away the blanket table write privileges Supabase grants `anon` and
-- `authenticated` by default in the public schema.
--
-- RLS already blocks these writes — verified: an anon INSERT into members
-- fails with "new row violates row-level security policy". So why revoke?
--
-- Because RLS blocking a write is a *policy* decision, and policies get added.
-- Today no table has an INSERT/UPDATE/DELETE policy, so RLS denies by default;
-- the day someone adds a permissive policy for one legitimate case, the
-- underlying grant is still sitting there ready to be used. Revoking the
-- privilege means a future write path has to be opened deliberately in two
-- places instead of accidentally in one.
--
-- The security definer functions in 00003 are unaffected: they execute as the
-- function owner, not as the calling role.

revoke insert, update, delete, truncate, references
  on all tables in schema public
  from anon, authenticated;

-- Reads stay, still filtered by the policies in 00002: `authenticated` needs
-- SELECT for a member to read their own row, and `anon` needs it for the
-- public reward catalogue.
grant select on all tables in schema public to anon, authenticated;

-- Same posture for anything added later.
alter default privileges in schema public
  revoke insert, update, delete, truncate, references on tables
  from anon, authenticated;
