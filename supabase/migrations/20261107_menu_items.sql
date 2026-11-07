-- menu_items: bakery items and coffee drinks, plus the menu-photos storage bucket.
-- Run once in the Supabase SQL Editor. Safe to run again: it skips what already exists.

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------
create table if not exists public.menu_items (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (length(trim(name)) > 0),
  description text,
  price       numeric(6, 2) not null check (price >= 0),
  category    text not null check (category in ('bakery', 'coffee')),
  ingredients text,
  allergens   text[] not null default '{}',
  photo_path  text,                              -- path inside the menu-photos bucket
  on_today    boolean not null default true,     -- on today's menu
  sold_out    boolean not null default false,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists menu_items_category_sort_idx
  on public.menu_items (category, sort_order);

-- Keep updated_at current on every edit.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists menu_items_set_updated_at on public.menu_items;
create trigger menu_items_set_updated_at
  before update on public.menu_items
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Security: customers read today's items only; owners (signed in) do everything.
-- Public sign-ups are disabled, so "authenticated" means one of the two owners.
-- ---------------------------------------------------------------------------
alter table public.menu_items enable row level security;

revoke all on public.menu_items from anon, authenticated;
grant select on public.menu_items to anon;
grant select, insert, update, delete on public.menu_items to authenticated;

drop policy if exists "Customers read today's menu" on public.menu_items;
create policy "Customers read today's menu"
  on public.menu_items for select to anon
  using (on_today);

drop policy if exists "Owners read all menu items" on public.menu_items;
create policy "Owners read all menu items"
  on public.menu_items for select to authenticated
  using (true);

drop policy if exists "Owners add menu items" on public.menu_items;
create policy "Owners add menu items"
  on public.menu_items for insert to authenticated
  with check (true);

drop policy if exists "Owners edit menu items" on public.menu_items;
create policy "Owners edit menu items"
  on public.menu_items for update to authenticated
  using (true) with check (true);

drop policy if exists "Owners delete menu items" on public.menu_items;
create policy "Owners delete menu items"
  on public.menu_items for delete to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- Photo storage: anyone can view, only owners upload/replace/delete.
-- 500 KB max, WebP/JPEG/PNG only.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('menu-photos', 'menu-photos', true, 512000, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

drop policy if exists "Owners upload menu photos" on storage.objects;
create policy "Owners upload menu photos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'menu-photos');

drop policy if exists "Owners replace menu photos" on storage.objects;
create policy "Owners replace menu photos"
  on storage.objects for update to authenticated
  using (bucket_id = 'menu-photos') with check (bucket_id = 'menu-photos');

drop policy if exists "Owners delete menu photos" on storage.objects;
create policy "Owners delete menu photos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'menu-photos');
