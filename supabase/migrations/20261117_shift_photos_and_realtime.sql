-- #open truck / #currently card - storage for the shift photos + realtime for the shifts table.
-- run after 20261117_schedule_and_shifts.sql, ok to run again

begin; -- all or nothing

-- #security - anyone can view a shift photo with the link, only owners can upload/replace/delete.
-- customers only get the photo path from the open shift and the paths are random.
-- 500 KB max, webp/jpeg/png only
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('shift-photos', 'shift-photos', true, 512000, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

-- owners upload
drop policy if exists "Owners upload shift photos" on storage.objects;
create policy "Owners upload shift photos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'shift-photos');

-- owners replace
drop policy if exists "Owners replace shift photos" on storage.objects;
create policy "Owners replace shift photos"
  on storage.objects for update to authenticated
  using (bucket_id = 'shift-photos') with check (bucket_id = 'shift-photos');

-- owners delete
drop policy if exists "Owners delete shift photos" on storage.objects;
create policy "Owners delete shift photos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'shift-photos');

-- #shifts - realtime so open phones hear when the truck opens/closes. RLS still applies
do $$
begin
  -- only add it if it isn't already there
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'shifts'
  ) then
    alter publication supabase_realtime add table public.shifts;
  end if;
end;
$$;

commit;
