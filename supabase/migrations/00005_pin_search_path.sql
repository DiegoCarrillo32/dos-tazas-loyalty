-- Pin search_path on the three remaining functions.
--
-- These are not `security definer`, so they are not the classic
-- search-path-hijack risk. Pinning anyway costs nothing, clears Supabase's
-- function_search_path_mutable advisory, and means a future edit that *does*
-- add definer rights or a table reference starts from a safe baseline rather
-- than quietly inheriting the caller's search_path.

alter function public.normalize_national_id(text) set search_path = public;
alter function public.normalize_phone(text)       set search_path = public;
alter function public.touch_updated_at()          set search_path = public;
