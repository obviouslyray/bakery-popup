-- Photo storage for shifts and Realtime for the shifts table.
-- Run once in the Supabase SQL Editor after 20261117_schedule_and_shifts.sql. Safe to run again.

begin;

-- Anyone can view a shift photo by its link; only signed-in owners upload, replace or delete.
-- Customers only learn a photo's path from the open shift, and paths are random.
-- 500 KB max, WebP/JPEG/PNG only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('shift-photos', 'shift-photos', true, 512000, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

drop policy if exists "Owners upload shift photos" on storage.objects;
create policy "Owners upload shift photos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'shift-photos');

drop policy if exists "Owners replace shift photos" on storage.objects;
create policy "Owners replace shift photos"
  on storage.objects for update to authenticated
  using (bucket_id = 'shift-photos') with check (bucket_id = 'shift-photos');

drop policy if exists "Owners delete shift photos" on storage.objects;
create policy "Owners delete shift photos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'shift-photos');

-- Open phones hear when a shift opens or closes. Row level security still applies.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'shifts'
  ) then
    alter publication supabase_realtime add table public.shifts;
  end if;
end;
$$;

commit;
