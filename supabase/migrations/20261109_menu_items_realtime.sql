-- #menu section - turns on realtime for menu_items so open phones see menu changes right away.
-- ok to run again. RLS still applies, customers only get changes they're allowed to see

do $$
begin
  -- only add it if it isn't already added (otherwise it errors)
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'menu_items'
  ) then
    alter publication supabase_realtime add table public.menu_items;
  end if;
end;
$$;
