-- Bound the growth of lookup_attempts.
--
-- Every customer "check my points" writes a row here, but lookup_member() only
-- ever reads the last 15 minutes of it. Left alone the table grows without
-- limit for data that is dead within the quarter hour — and it is the busiest
-- write path in the app, since it takes a row on both success and failure.
--
-- It is also the one table holding a record of which cédulas have been probed,
-- so keeping it short is a privacy improvement as well as a storage one.
--
-- A day of retention is far more than the 15-minute window needs; it leaves
-- enough history to actually investigate a burst of failed lookups.

create or replace function public.purge_lookup_attempts()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted integer;
begin
  delete from public.lookup_attempts where created_at < now() - interval '1 day';
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

revoke execute on function public.purge_lookup_attempts() from public, anon, authenticated;

comment on function public.purge_lookup_attempts() is
  'Deletes lookup_attempts older than 1 day. Scheduled via pg_cron; safe to run by hand.';

-- Schedule it. pg_cron is available on Supabase (hosted and local); the guard
-- keeps this migration replayable on a stack where it is not.
do $$
begin
  create extension if not exists pg_cron;

  -- cron.schedule() upserts by job name, so replaying this is safe.
  perform cron.schedule(
    'purge-lookup-attempts',
    '17 4 * * *',
    'select public.purge_lookup_attempts()'
  );
exception when others then
  raise notice 'pg_cron unavailable (%); run purge_lookup_attempts() from your own scheduler instead', sqlerrm;
end;
$$;
