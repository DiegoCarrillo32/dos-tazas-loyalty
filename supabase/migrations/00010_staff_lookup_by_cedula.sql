-- Let a barista find a customer by cédula, not only by scanning.
--
-- The scanner's manual fallback previously accepted only the signed QR text,
-- so a barista who typed the cédula — the obvious thing to type, and the number
-- the customer-facing copy calls "el número que la caja usa para darte tus
-- puntos" — got "código QR no es válido". It also left no way to serve a
-- customer who lost their card or forgot their phone.
--
-- Why this is safe, when the anonymous cédula lookup was not:
--
--   The lookup removed in 00009 was callable by ANYONE. A cédula is
--   semi-public in Costa Rica, so that let a stranger read a name and balance.
--   This one requires is_staff(), and staff can already read every member row
--   through the members_select_staff policy. It grants a barista nothing they
--   did not already have — it just saves them a query they could run anyway.

create or replace function public.staff_lookup_by_cedula(p_national_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_national_id text := public.normalize_national_id(p_national_id);
  v_member      public.members;
begin
  if not public.is_staff() then
    raise exception 'forbidden';
  end if;

  select * into v_member from public.members where national_id = v_national_id;
  if not found then
    return jsonb_build_object('error', 'not_found');
  end if;

  -- Delegate so the barista sees exactly the same payload as a scan: same
  -- rewards, same redeemable flags, same history. Two code paths that drift
  -- would be worse than the missing feature.
  return public.staff_lookup_member(v_member.card_token);
end;
$$;

revoke execute on function public.staff_lookup_by_cedula(text) from public, anon;
grant  execute on function public.staff_lookup_by_cedula(text) to authenticated;
