-- Catalogue metadata is non-sensitive. Public reads must include inactive rows so
-- archived static fallback items stay suppressed on the public site.
drop policy if exists price_catalogue_items_read on public.price_catalogue_items;

create policy price_catalogue_items_read
on public.price_catalogue_items for select to anon, authenticated
using (true);
