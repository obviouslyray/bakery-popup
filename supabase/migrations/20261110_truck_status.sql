-- Apply in Supabase SQL Editor. GitHub deployment does NOT execute SQL.
begin;
create table if not exists public.truck_status (
  id smallint primary key check (id = 1),
  is_open boolean not null default false,
  version integer not null default 0 check (version >= 0),
  updated_at timestamptz not null default now()
);
insert into public.truck_status (id) values (1) on conflict (id) do nothing;
create table if not exists public.truck_status_owners (
  slot smallint primary key check (slot in (1, 2)),
  user_id uuid not null unique references auth.users(id) on delete cascade
);
alter table public.truck_status enable row level security;
alter table public.truck_status_owners enable row level security;
revoke all on public.truck_status, public.truck_status_owners from public, anon, authenticated;
grant select on public.truck_status to anon, authenticated;
drop policy if exists "Public reads truck status" on public.truck_status;
create policy "Public reads truck status" on public.truck_status
  for select to anon, authenticated using (id = 1);
-- No client policies or grants expose the owner registry. SQL admins enroll owners.
create or replace function public.can_manage_truck_status()
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.truck_status_owners where user_id = auth.uid()); $$;
revoke all on function public.can_manage_truck_status() from public, anon, authenticated;
grant execute on function public.can_manage_truck_status() to authenticated;
create or replace function public.set_truck_status(new_is_open boolean, expected_version integer)
returns public.truck_status language plpgsql security definer set search_path = ''
as $$
declare current_status public.truck_status;
begin
  if not public.can_manage_truck_status() then
    raise exception 'Owner approval required' using errcode = '42501';
  end if;
  if new_is_open is null or expected_version is null then
    raise exception 'Status and version are required' using errcode = '22023';
  end if;
  select * into current_status from public.truck_status where id = 1 for update;
  if not found then raise exception 'Truck status not initialized'; end if;
  if current_status.version <> expected_version then
    raise exception 'Status changed. Refresh and retry.' using errcode = '40001';
  end if;
  if current_status.is_open = new_is_open then return current_status; end if;
  update public.truck_status set is_open = new_is_open,
    version = version + 1, updated_at = now() where id = 1
    returning * into current_status;
  return current_status;
end;
$$;
revoke all on function public.set_truck_status(boolean, integer) from public, anon, authenticated;
grant execute on function public.set_truck_status(boolean, integer) to authenticated;
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
    and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime'
      and schemaname = 'public' and tablename = 'truck_status') then
    alter publication supabase_realtime add table public.truck_status;
  end if;
end;
$$;
commit;
-- Next: enroll the two approved Auth user UUIDs following docs/truck-status-setup.md.
