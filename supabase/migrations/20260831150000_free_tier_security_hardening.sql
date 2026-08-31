-- Keep the public CMS and supplier workflow efficient and narrowly permissioned.

create or replace function public.is_charismak_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select lower(coalesce((select auth.jwt()) ->> 'email', '')) = any (
    array[
      'md@charismakproject.com',
      'info@charismakproject.com',
      'charismakprojectnigltd@gmail.com'
    ]::text[]
  );
$$;

grant execute on function public.is_charismak_admin() to anon, authenticated;

alter table public.supplier_profiles
  add column if not exists phone_digits text,
  add column if not exists account_pin_salt text,
  add column if not exists account_pin_version smallint not null default 1,
  add column if not exists login_failed_attempts integer not null default 0,
  add column if not exists login_locked_until timestamptz;

create or replace function public.set_supplier_phone_digits()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.phone_digits := regexp_replace(coalesce(new.phone, ''), '[^0-9]', '', 'g');
  return new;
end;
$$;

update public.supplier_profiles
set phone_digits = regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g')
where phone_digits is distinct from regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g');

drop trigger if exists supplier_profiles_phone_digits on public.supplier_profiles;
create trigger supplier_profiles_phone_digits
before insert or update of phone on public.supplier_profiles
for each row execute function public.set_supplier_phone_digits();

create index if not exists supplier_profiles_business_phone_idx
  on public.supplier_profiles (lower(business_name), phone_digits);
create index if not exists supplier_profiles_access_token_active_idx
  on public.supplier_profiles (access_token)
  where status = 'active';
create index if not exists beta_reviews_user_id_idx
  on public.beta_reviews (user_id);

-- Replace broad/overlapping CMS policies with one read rule and explicit admin writes.
do $$
declare
  cms_table text;
  policy_record record;
begin
  foreach cms_table in array array['website_projects', 'website_people', 'website_content', 'website_services']
  loop
    for policy_record in
      select policyname from pg_policies
      where schemaname = 'public' and tablename = cms_table
    loop
      execute format('drop policy if exists %I on public.%I', policy_record.policyname, cms_table);
    end loop;

    execute format(
      'create policy %I on public.%I for select to anon, authenticated using (published or (select public.is_charismak_admin()))',
      cms_table || '_read', cms_table
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check ((select public.is_charismak_admin()))',
      cms_table || '_insert', cms_table
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using ((select public.is_charismak_admin())) with check ((select public.is_charismak_admin()))',
      cms_table || '_update', cms_table
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using ((select public.is_charismak_admin()))',
      cms_table || '_delete', cms_table
    );
  end loop;
end $$;

-- Catalogue overlays are public only while active; admins retain full CRUD access.
do $$
declare policy_record record;
begin
  for policy_record in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'price_catalogue_items'
  loop
    execute format('drop policy if exists %I on public.price_catalogue_items', policy_record.policyname);
  end loop;
end $$;

create policy price_catalogue_items_read
on public.price_catalogue_items for select to anon, authenticated
using (active or (select public.is_charismak_admin()));
create policy price_catalogue_items_insert
on public.price_catalogue_items for insert to authenticated
with check ((select public.is_charismak_admin()));
create policy price_catalogue_items_update
on public.price_catalogue_items for update to authenticated
using ((select public.is_charismak_admin()))
with check ((select public.is_charismak_admin()));
create policy price_catalogue_items_delete
on public.price_catalogue_items for delete to authenticated
using ((select public.is_charismak_admin()));

-- Blog follows the same published-read/admin-write model.
do $$
declare policy_record record;
begin
  for policy_record in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'blog_posts'
  loop
    execute format('drop policy if exists %I on public.blog_posts', policy_record.policyname);
  end loop;
end $$;

create policy blog_posts_read
on public.blog_posts for select to anon, authenticated
using (status = 'published' or (select public.is_charismak_admin()));
create policy blog_posts_insert
on public.blog_posts for insert to authenticated
with check ((select public.is_charismak_admin()));
create policy blog_posts_update
on public.blog_posts for update to authenticated
using ((select public.is_charismak_admin()))
with check ((select public.is_charismak_admin()));
create policy blog_posts_delete
on public.blog_posts for delete to authenticated
using ((select public.is_charismak_admin()));

-- Market overrides: active rows are public and drafts remain visible to admins.
do $$
declare policy_record record;
begin
  for policy_record in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'market_price_overrides'
  loop
    execute format('drop policy if exists %I on public.market_price_overrides', policy_record.policyname);
  end loop;
end $$;

create policy market_price_overrides_read
on public.market_price_overrides for select to anon, authenticated
using (active or (select public.is_charismak_admin()));
create policy market_price_overrides_insert
on public.market_price_overrides for insert to authenticated
with check ((select public.is_charismak_admin()));
create policy market_price_overrides_update
on public.market_price_overrides for update to authenticated
using ((select public.is_charismak_admin()))
with check ((select public.is_charismak_admin()));

-- Keep private supplier administration policies efficient.
do $$
declare
  private_table text;
  policy_record record;
begin
  foreach private_table in array array['supplier_profiles', 'supplier_review_batches', 'supplier_review_lines', 'market_price_override_history']
  loop
    for policy_record in
      select policyname from pg_policies
      where schemaname = 'public' and tablename = private_table
    loop
      execute format('drop policy if exists %I on public.%I', policy_record.policyname, private_table);
    end loop;

    execute format(
      'create policy %I on public.%I for all to authenticated using ((select public.is_charismak_admin())) with check ((select public.is_charismak_admin()))',
      private_table || '_admin', private_table
    );
  end loop;
end $$;

-- Public approved supplier offers plus authenticated admin management in one read policy.
do $$
declare policy_record record;
begin
  for policy_record in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'supplier_marketplace_offers'
  loop
    execute format('drop policy if exists %I on public.supplier_marketplace_offers', policy_record.policyname);
  end loop;
end $$;

create policy supplier_marketplace_offers_read
on public.supplier_marketplace_offers for select to anon, authenticated
using (
  (status = 'approved' and (valid_until is null or valid_until >= current_date))
  or (select public.is_charismak_admin())
);
create policy supplier_marketplace_offers_insert
on public.supplier_marketplace_offers for insert to authenticated
with check ((select public.is_charismak_admin()));
create policy supplier_marketplace_offers_update
on public.supplier_marketplace_offers for update to authenticated
using ((select public.is_charismak_admin()))
with check ((select public.is_charismak_admin()));
create policy supplier_marketplace_offers_delete
on public.supplier_marketplace_offers for delete to authenticated
using ((select public.is_charismak_admin()));
