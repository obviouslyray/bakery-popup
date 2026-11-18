-- #menu visibility - adds sections inside the beverages folder (category 'coffee').
-- run after 20261107_menu_items.sql, ok to run again
-- a drink with no section (like bottled water) stays in the table but customers don't see it.
-- bakery items never have a section

-- new column
alter table public.menu_items
  add column if not exists section text;

-- drop the old rule first so this can run again
alter table public.menu_items
  drop constraint if exists menu_items_section_check;

-- section has to be empty, or one of the 4 beverage sections (and only on drinks)
alter table public.menu_items
  add constraint menu_items_section_check check (
    section is null
    or (category = 'coffee' and section in ('coffees', 'fresh-squeezed', 'seasonal', 'milk-options'))
  );
