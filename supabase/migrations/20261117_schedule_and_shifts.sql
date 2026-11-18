-- schedule and shifts tables with row level security, plus nightly cleanup of old shifts.
-- Backend only: no app screen uses these yet.
-- Run once in the Supabase SQL Editor after 20261107_menu_items.sql (reuses public.set_updated_at()).
-- Safe to run again. GitHub deployment does NOT run SQL.
--
-- Owners are the Supabase Auth logins. Public sign-ups are disabled, so a signed-in
-- user ("authenticated") is one of the owners.

begin;

-- ---------------------------------------------------------------------------
-- schedule: one row per day, a city or "resting up".
-- ---------------------------------------------------------------------------
create table if not exists public.schedule (
  date        date primary key,
  city        text check (city is null or length(trim(city)) > 0),
  resting_up  boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint schedule_city_or_resting check (resting_up or city is not null)
);

drop trigger if exists schedule_set_updated_at on public.schedule;
create trigger schedule_set_updated_at
  before update on public.schedule
  for each row execute function public.set_updated_at();

alter table public.schedule enable row level security;

revoke all on public.schedule from anon, authenticated;
grant select on public.schedule to anon;
grant select, insert, update, delete on public.schedule to authenticated;

-- Customers can read today and the next 6 days (Colorado time) only.
drop policy if exists "Customers read the next 7 days" on public.schedule;
create policy "Customers read the next 7 days"
  on public.schedule for select to anon
  using (
    date between (now() at time zone 'America/Denver')::date
             and (now() at time zone 'America/Denver')::date + 6
  );

drop policy if exists "Owners read the schedule" on public.schedule;
create policy "Owners read the schedule"
  on public.schedule for select to authenticated
  using (true);

drop policy if exists "Owners add schedule days" on public.schedule;
create policy "Owners add schedule days"
  on public.schedule for insert to authenticated
  with check (true);

drop policy if exists "Owners edit schedule days" on public.schedule;
create policy "Owners edit schedule days"
  on public.schedule for update to authenticated
  using (true) with check (true);

drop policy if exists "Owners delete schedule days" on public.schedule;
create policy "Owners delete schedule days"
  on public.schedule for delete to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- shifts: one row each time the truck opens.
-- ---------------------------------------------------------------------------
create table if not exists public.shifts (
  id             uuid primary key default gen_random_uuid(),
  schedule_date  date references public.schedule (date) on update cascade on delete set null,
  opened_by      uuid default auth.uid() references auth.users (id) on delete set null,
  is_open        boolean not null default true,
  opened_at      timestamptz not null default now(),
  closed_at      timestamptz,
  spot_name      text,
  lat            numeric(9, 6) check (lat between -90 and 90),
  lng            numeric(9, 6) check (lng between -180 and 180),
  photo_path     text,
  -- Code for passport stamps; random and unique per shift.
  stamp_code     text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  constraint shifts_closed_at_matches_status check (is_open = (closed_at is null)),
  constraint shifts_closed_after_opened check (closed_at is null or closed_at >= opened_at)
);

-- Only one shift can be open at a time.
create unique index if not exists shifts_only_one_open
  on public.shifts (is_open)
  where is_open;

alter table public.shifts enable row level security;

revoke all on public.shifts from anon, authenticated;
-- Customers never get stamp_code (it would allow stamps without visiting the truck),
-- opened_by or closed_at, even on the open shift.
grant select (id, schedule_date, is_open, opened_at, spot_name, lat, lng, photo_path) on public.shifts to anon;
grant select, insert, update, delete on public.shifts to authenticated;

drop policy if exists "Customers read the open shift" on public.shifts;
create policy "Customers read the open shift"
  on public.shifts for select to anon
  using (is_open);

drop policy if exists "Owners read all shifts" on public.shifts;
create policy "Owners read all shifts"
  on public.shifts for select to authenticated
  using (true);

-- A shift is always opened in the signed-in owner's own name.
drop policy if exists "Owners open shifts" on public.shifts;
create policy "Owners open shifts"
  on public.shifts for insert to authenticated
  with check (opened_by = auth.uid());

drop policy if exists "Owners update shifts" on public.shifts;
create policy "Owners update shifts"
  on public.shifts for update to authenticated
  using (true) with check (true);

drop policy if exists "Owners delete shifts" on public.shifts;
create policy "Owners delete shifts"
  on public.shifts for delete to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- Nightly cleanup: delete closed shifts older than 7 days.
-- pg_cron runs on UTC. 10:00 UTC is 3 a.m. Colorado time in winter (MST)
-- and 4 a.m. in summer (MDT). Scheduling the same job name again updates it.
-- ---------------------------------------------------------------------------
create extension if not exists pg_cron with schema pg_catalog;

select cron.schedule(
  'cleanup-old-shifts',
  '0 10 * * *',
  $$ delete from public.shifts where not is_open and closed_at < now() - interval '7 days' $$
);

commit;
