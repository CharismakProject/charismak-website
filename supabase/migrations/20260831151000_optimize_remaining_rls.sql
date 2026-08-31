-- Avoid re-evaluating authentication helpers for every row on older beta tables.

drop policy if exists "Users can create their beta profile" on public.beta_profiles;
drop policy if exists "Users can read their beta profile" on public.beta_profiles;
drop policy if exists "Users can update their beta profile" on public.beta_profiles;

create policy beta_profiles_insert
on public.beta_profiles for insert to authenticated
with check (user_id = (select auth.uid()));

create policy beta_profiles_read
on public.beta_profiles for select to authenticated
using (user_id = (select auth.uid()) or (select public.is_charismak_admin()));

create policy beta_profiles_update
on public.beta_profiles for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists "Users can read their beta reviews" on public.beta_reviews;
drop policy if exists "Users can submit beta reviews" on public.beta_reviews;

create policy beta_reviews_insert
on public.beta_reviews for insert to authenticated
with check (user_id = (select auth.uid()));

create policy beta_reviews_read
on public.beta_reviews for select to authenticated
using (user_id = (select auth.uid()) or (select public.is_charismak_admin()));

drop policy if exists "Charismak admins can add supplier offer history" on public.supplier_marketplace_offer_history;
drop policy if exists "Charismak admins can read supplier offer history" on public.supplier_marketplace_offer_history;

create policy supplier_marketplace_offer_history_admin
on public.supplier_marketplace_offer_history for all to authenticated
using ((select public.is_charismak_admin()))
with check ((select public.is_charismak_admin()));
