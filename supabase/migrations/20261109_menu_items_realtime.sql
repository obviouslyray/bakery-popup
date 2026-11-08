-- Turns on Supabase Realtime for menu_items, so open phones hear about menu changes.
-- Run once in the Supabase SQL Editor. Safe to run again.
-- Row level security still applies: customers only get changes they are allowed to read.

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'menu_items'
  ) then
    alter publication supabase_realtime add table public.menu_items;
  end if;
end;
$$;
