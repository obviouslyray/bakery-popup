-- #database / #menu section - menu_items table (bakery + drinks) and the menu-photos bucket.
-- paste into the supabase SQL editor and run. ok to run again, it skips stuff that already exists

-- #database - the table
create table if not exists public.menu_items (
  id          uuid primary key default gen_random_uuid(), -- random id
  name        text not null check (length(trim(name)) > 0), -- can't be blank
  description text,
  price       numeric(6, 2) not null check (price >= 0), -- up to 9999.99
  category    text not null check (category in ('bakery', 'coffee')), -- coffee = the beverages folder
  ingredients text,
  allergens   text[] not null default '{}', -- list like {milk,eggs}
  photo_path  text,                              -- #menu photos - path inside the menu-photos bucket
  on_today    boolean not null default true,     -- #menu visibility - on today's menu or not
  sold_out    boolean not null default false, -- #sold out
  sort_order  integer not null default 0, -- order on the menu
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- makes sorting by folder + order faster
create index if not exists menu_items_category_sort_idx
  on public.menu_items (category, sort_order);

-- updates updated_at automatically whenever a row changes
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = '' -- security thing supabase recommends for functions
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- run that function before every update
drop trigger if exists menu_items_set_updated_at on public.menu_items;
create trigger menu_items_set_updated_at
  before update on public.menu_items
  for each row execute function public.set_updated_at();

-- #security - customers can only read today's items, owners (logged in) can do everything.
-- sign ups are off in supabase so "authenticated" = one of the two owners
alter table public.menu_items enable row level security; -- RLS on

-- start from nothing, then give back only what each one needs
revoke all on public.menu_items from anon, authenticated;
grant select on public.menu_items to anon; -- anon = customers, read only
grant select, insert, update, delete on public.menu_items to authenticated;

-- #menu visibility - customers only see rows where on_today is true
drop policy if exists "Customers read today's menu" on public.menu_items;
create policy "Customers read today's menu"
  on public.menu_items for select to anon
  using (on_today);

-- owners see everything, even items that are off today
drop policy if exists "Owners read all menu items" on public.menu_items;
create policy "Owners read all menu items"
  on public.menu_items for select to authenticated
  using (true);

-- #menu editor - owners can add
drop policy if exists "Owners add menu items" on public.menu_items;
create policy "Owners add menu items"
  on public.menu_items for insert to authenticated
  with check (true);

-- #sold out / #menu visibility - owners can edit
drop policy if exists "Owners edit menu items" on public.menu_items;
create policy "Owners edit menu items"
  on public.menu_items for update to authenticated
  using (true) with check (true);

-- #menu delete - owners can delete
drop policy if exists "Owners delete menu items" on public.menu_items;
create policy "Owners delete menu items"
  on public.menu_items for delete to authenticated
  using (true);

-- #menu photos - photo storage. anyone can look, only owners can upload/replace/delete.
-- 500 KB max, webp/jpeg/png only
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('menu-photos', 'menu-photos', true, 512000, array['image/webp', 'image/jpeg', 'image/png']) -- public = anyone can view the photos
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
