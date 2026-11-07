-- Sections inside the Beverages folder (category 'coffee').
-- Run once in the Supabase SQL Editor after 20261107_menu_items.sql. Safe to run again.
--
-- A beverage with no section (for example bottled water) stays in the table but
-- is not shown to customers. Bakery items never have a section.

alter table public.menu_items
  add column if not exists section text;

alter table public.menu_items
  drop constraint if exists menu_items_section_check;

alter table public.menu_items
  add constraint menu_items_section_check check (
    section is null
    or (category = 'coffee' and section in ('coffees', 'fresh-squeezed', 'seasonal', 'milk-options'))
  );
