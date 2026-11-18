-- #database / #shifts / #calendar section - schedule + shifts tables with RLS, and a nightly cleanup job.
-- run after 20261107_menu_items.sql (uses its set_updated_at function). ok to run again.
-- pushing to github does NOT run this, it has to be pasted into the supabase SQL editor
-- #security - owners are just the supabase logins. sign ups are off, so anyone
-- "authenticated" is one of the owners

begin; -- all or nothing, if one part fails none of it saves

-- #calendar section - schedule: one row per day, either a city or "resting up"
create table if not exists public.schedule (
  date        date primary key, -- one row per date
  city        text check (city is null or length(trim(city)) > 0), -- can't be blank if it's filled in
  resting_up  boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint schedule_city_or_resting check (resting_up or city is not null) -- a day needs a city or resting up
);

-- reuses the updated_at function from the menu migration
drop trigger if exists schedule_set_updated_at on public.schedule;
create trigger schedule_set_updated_at
  before update on public.schedule
  for each row execute function public.set_updated_at();

alter table public.schedule enable row level security; -- RLS on

-- start from nothing then give back what's needed
revoke all on public.schedule from anon, authenticated;
grant select on public.schedule to anon;
grant select, insert, update, delete on public.schedule to authenticated;

-- #security - customers can only see today + the next 6 days (colorado time)
drop policy if exists "Customers read the next 7 days" on public.schedule;
create policy "Customers read the next 7 days"
  on public.schedule for select to anon
  using (
    date between (now() at time zone 'America/Denver')::date
             and (now() at time zone 'America/Denver')::date + 6
  );

-- owners can read/add/edit/delete any day
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

-- #shifts - one row every time the truck opens
create table if not exists public.shifts (
  id             uuid primary key default gen_random_uuid(),
  schedule_date  date references public.schedule (date) on update cascade on delete set null, -- links to the schedule day (optional)
  opened_by      uuid default auth.uid() references auth.users (id) on delete set null, -- which owner opened it, filled in automatically
  is_open        boolean not null default true, -- true while the truck is open
  opened_at      timestamptz not null default now(),
  closed_at      timestamptz, -- empty until it closes
  spot_name      text, -- #open truck - the "where to find us" text
  lat            numeric(9, 6) check (lat between -90 and 90), -- gps, 6 decimals is plenty
  lng            numeric(9, 6) check (lng between -180 and 180),
  photo_path     text, -- #currently card - path in the shift-photos bucket
  -- #stamps - code for passport stamps, random + unique per shift
  stamp_code     text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  constraint shifts_closed_at_matches_status check (is_open = (closed_at is null)), -- is_open and closed_at have to agree
  constraint shifts_closed_after_opened check (closed_at is null or closed_at >= opened_at) -- can't close before it opened
);

-- only one shift can be open at a time (a unique index that only covers open rows)
create unique index if not exists shifts_only_one_open
  on public.shifts (is_open)
  where is_open;

alter table public.shifts enable row level security; -- RLS on

revoke all on public.shifts from anon, authenticated;
-- #security - customers never get stamp_code (they could get stamps without going to the truck),
-- opened_by, or closed_at, even on the open shift. so they only get these columns
grant select (id, schedule_date, is_open, opened_at, spot_name, lat, lng, photo_path) on public.shifts to anon;
grant select, insert, update, delete on public.shifts to authenticated;

-- #security - customers only see the shift that's open (so the location is hidden once it closes)
drop policy if exists "Customers read the open shift" on public.shifts;
create policy "Customers read the open shift"
  on public.shifts for select to anon
  using (is_open);

drop policy if exists "Owners read all shifts" on public.shifts;
create policy "Owners read all shifts"
  on public.shifts for select to authenticated
  using (true);

-- #open truck - a shift always has to be opened under the logged in owner's own id
drop policy if exists "Owners open shifts" on public.shifts;
create policy "Owners open shifts"
  on public.shifts for insert to authenticated
  with check (opened_by = auth.uid());

-- #close truck - owners can update (closing = setting is_open false)
drop policy if exists "Owners update shifts" on public.shifts;
create policy "Owners update shifts"
  on public.shifts for update to authenticated
  using (true) with check (true);

drop policy if exists "Owners delete shifts" on public.shifts;
create policy "Owners delete shifts"
  on public.shifts for delete to authenticated
  using (true);

-- #shifts - nightly cleanup: delete closed shifts older than 7 days.
-- pg_cron uses UTC. 10:00 UTC = 3am colorado in winter, 4am in summer.
-- scheduling the same job name again just updates it
create extension if not exists pg_cron with schema pg_catalog; -- turn on pg_cron

select cron.schedule(
  'cleanup-old-shifts', -- job name
  '0 10 * * *', -- every day at 10:00 UTC
  $$ delete from public.shifts where not is_open and closed_at < now() - interval '7 days' $$
);

commit;
