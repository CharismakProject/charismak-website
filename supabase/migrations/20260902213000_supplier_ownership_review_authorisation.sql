create table if not exists public.supplier_price_review_requests (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.supplier_marketplace_offers(id) on delete cascade,
  supplier_id uuid not null references public.supplier_profiles(id) on delete cascade,
  requested_by text not null check (requested_by in ('admin', 'supplier')),
  requested_by_email text,
  reason text,
  status text not null default 'awaiting_supplier' check (status in ('awaiting_supplier', 'awaiting_code', 'admin_authorized', 'supplier_updating', 'completed', 'cancelled', 'expired')),
  authorization_channel text check (authorization_channel is null or authorization_channel in ('whatsapp', 'email')),
  otp_salt text,
  otp_hash text,
  otp_expires_at timestamptz,
  otp_attempts integer not null default 0,
  verified_at timestamptz,
  authorization_expires_at timestamptz,
  consumed_at timestamptz,
  completed_at timestamptz,
  admin_changed_by_email text,
  before_snapshot jsonb,
  after_snapshot jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists supplier_price_review_requests_offer_idx
  on public.supplier_price_review_requests (offer_id, created_at desc);
create index if not exists supplier_price_review_requests_supplier_idx
  on public.supplier_price_review_requests (supplier_id, created_at desc);
create index if not exists supplier_price_review_requests_status_idx
  on public.supplier_price_review_requests (status, authorization_expires_at);

alter table public.supplier_price_review_requests enable row level security;

drop policy if exists supplier_price_review_requests_admin_read on public.supplier_price_review_requests;
create policy supplier_price_review_requests_admin_read
on public.supplier_price_review_requests
for select
to authenticated
using ((select public.is_charismak_admin()));

revoke all on table public.supplier_price_review_requests from anon, authenticated;
grant select on table public.supplier_price_review_requests to authenticated;

create or replace function public.admin_request_supplier_price_review(
  p_offer_id uuid,
  p_reason text default null
)
returns setof public.supplier_price_review_requests
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_offer public.supplier_marketplace_offers%rowtype;
  v_supplier_id uuid;
  v_request public.supplier_price_review_requests%rowtype;
begin
  if not public.is_charismak_admin() then
    raise exception 'Administrator access required';
  end if;

  select * into v_offer
  from public.supplier_marketplace_offers
  where id = p_offer_id;

  if not found then
    raise exception 'Supplier price not found';
  end if;
  if v_offer.supplier_id is null then
    raise exception 'This price has no linked supplier profile and can be edited directly by admin';
  end if;

  select id into v_supplier_id
  from public.supplier_profiles
  where id::text = v_offer.supplier_id
  limit 1;

  if v_supplier_id is null then
    raise exception 'Linked supplier profile could not be resolved';
  end if;

  select * into v_request
  from public.supplier_price_review_requests
  where offer_id = p_offer_id
    and status in ('awaiting_supplier', 'awaiting_code', 'admin_authorized', 'supplier_updating')
  order by created_at desc
  limit 1;

  if found then
    update public.supplier_price_review_requests
    set requested_by = 'admin',
        requested_by_email = lower(coalesce((select auth.jwt()) ->> 'email', 'admin')),
        reason = coalesce(nullif(btrim(p_reason), ''), reason),
        status = case when status = 'admin_authorized' and authorization_expires_at > now() then status else 'awaiting_supplier' end,
        updated_at = now()
    where id = v_request.id
    returning * into v_request;
  else
    insert into public.supplier_price_review_requests (
      offer_id, supplier_id, requested_by, requested_by_email, reason, status
    ) values (
      p_offer_id,
      v_supplier_id,
      'admin',
      lower(coalesce((select auth.jwt()) ->> 'email', 'admin')),
      nullif(btrim(p_reason), ''),
      'awaiting_supplier'
    ) returning * into v_request;
  end if;

  return next v_request;
end;
$$;

create or replace function public.admin_verify_supplier_price_authorization(
  p_request_id uuid,
  p_code text
)
returns setof public.supplier_price_review_requests
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_request public.supplier_price_review_requests%rowtype;
  v_candidate text;
begin
  if not public.is_charismak_admin() then
    raise exception 'Administrator access required';
  end if;

  select * into v_request
  from public.supplier_price_review_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Review authorization request not found';
  end if;
  if v_request.status <> 'awaiting_code' then
    raise exception 'This authorization is not awaiting a code';
  end if;
  if v_request.otp_expires_at is null or v_request.otp_expires_at <= now() then
    update public.supplier_price_review_requests
      set status = 'expired', updated_at = now()
      where id = p_request_id;
    raise exception 'Authorization code has expired';
  end if;
  if v_request.otp_attempts >= 5 then
    raise exception 'Too many incorrect code attempts';
  end if;

  v_candidate := encode(extensions.digest(coalesce(p_code, '') || ':' || coalesce(v_request.otp_salt, ''), 'sha256'), 'hex');
  if v_candidate is distinct from v_request.otp_hash then
    update public.supplier_price_review_requests
      set otp_attempts = otp_attempts + 1,
          status = case when otp_attempts + 1 >= 5 then 'expired' else status end,
          updated_at = now()
      where id = p_request_id;
    raise exception 'Incorrect authorization code';
  end if;

  update public.supplier_price_review_requests
  set status = 'admin_authorized',
      verified_at = now(),
      authorization_expires_at = now() + interval '30 minutes',
      otp_hash = null,
      otp_salt = null,
      otp_attempts = 0,
      updated_at = now()
  where id = p_request_id
  returning * into v_request;

  return next v_request;
end;
$$;

create or replace function public.protect_supplier_owned_offer_from_admin_edit()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_authorized_offer text := coalesce(current_setting('charismak.authorized_supplier_offer_id', true), '');
begin
  if coalesce(auth.role(), '') <> 'authenticated' or old.supplier_id is null then
    return new;
  end if;

  -- Admin may remove an owned price from the live marketplace without altering its commercial content.
  if old.status = 'approved'
     and new.status = 'expired'
     and old.catalogue_item_id is not distinct from new.catalogue_item_id
     and old.product_name is not distinct from new.product_name
     and old.specification is not distinct from new.specification
     and old.brand is not distinct from new.brand
     and old.quoted_unit is not distinct from new.quoted_unit
     and old.unit_price is not distinct from new.unit_price
     and old.bulk_price is not distinct from new.bulk_price
     and old.minimum_qty is not distinct from new.minimum_qty
     and old.delivery_fee is not distinct from new.delivery_fee
     and old.delivery_included is not distinct from new.delivery_included
     and old.location is not distinct from new.location
     and old.service_area is not distinct from new.service_area
     and old.availability is not distinct from new.availability
     and old.supplier_remarks is not distinct from new.supplier_remarks then
    return new;
  end if;

  if v_authorized_offer = old.id::text then
    return new;
  end if;

  if old.catalogue_item_id is distinct from new.catalogue_item_id
     or old.product_name is distinct from new.product_name
     or old.specification is distinct from new.specification
     or old.brand is distinct from new.brand
     or old.quoted_unit is distinct from new.quoted_unit
     or old.unit_price is distinct from new.unit_price
     or old.bulk_price is distinct from new.bulk_price
     or old.minimum_qty is distinct from new.minimum_qty
     or old.delivery_fee is distinct from new.delivery_fee
     or old.delivery_included is distinct from new.delivery_included
     or old.location is distinct from new.location
     or old.service_area is distinct from new.service_area
     or old.availability is distinct from new.availability
     or old.supplier_remarks is distinct from new.supplier_remarks then
    raise exception 'Supplier-owned price cannot be edited by admin without seller authorization';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_supplier_owned_offer_from_admin_edit on public.supplier_marketplace_offers;
create trigger protect_supplier_owned_offer_from_admin_edit
before update on public.supplier_marketplace_offers
for each row execute function public.protect_supplier_owned_offer_from_admin_edit();

create or replace function public.protect_supplier_profile_from_admin_edit()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if coalesce(auth.role(), '') <> 'authenticated' then
    return new;
  end if;

  if old.business_name is distinct from new.business_name
     or old.contact_person is distinct from new.contact_person
     or old.phone is distinct from new.phone
     or old.whatsapp is distinct from new.whatsapp
     or old.email is distinct from new.email
     or old.location is distinct from new.location
     or old.delivery_areas is distinct from new.delivery_areas
     or old.categories is distinct from new.categories then
    raise exception 'Supplier profile details can only be edited by the supplier owner';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_supplier_profile_from_admin_edit on public.supplier_profiles;
create trigger protect_supplier_profile_from_admin_edit
before update on public.supplier_profiles
for each row execute function public.protect_supplier_profile_from_admin_edit();

create or replace function public.protect_supplier_owned_review_line_from_admin_edit()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_supplier_id uuid;
  v_authorized_offer text := coalesce(current_setting('charismak.authorized_supplier_offer_id', true), '');
begin
  if coalesce(auth.role(), '') <> 'authenticated' then
    return new;
  end if;

  select supplier_id into v_supplier_id
  from public.supplier_review_batches
  where id = old.batch_id;

  if v_supplier_id is null then
    return new;
  end if;

  if old.marketplace_offer_id is not null and v_authorized_offer = old.marketplace_offer_id::text then
    return new;
  end if;

  if old.product_name is distinct from new.product_name
     or old.specification is distinct from new.specification
     or old.brand is distinct from new.brand
     or old.quoted_unit is distinct from new.quoted_unit
     or old.unit_price is distinct from new.unit_price
     or old.bulk_price is distinct from new.bulk_price
     or old.minimum_qty is distinct from new.minimum_qty
     or old.delivery_fee is distinct from new.delivery_fee
     or old.delivery_included is distinct from new.delivery_included
     or old.location is distinct from new.location
     or old.service_area is distinct from new.service_area
     or old.availability is distinct from new.availability
     or old.valid_until is distinct from new.valid_until
     or old.supplier_remarks is distinct from new.supplier_remarks then
    raise exception 'Supplier-submitted values cannot be edited by admin without seller authorization';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_supplier_owned_review_line_from_admin_edit on public.supplier_review_lines;
create trigger protect_supplier_owned_review_line_from_admin_edit
before update on public.supplier_review_lines
for each row execute function public.protect_supplier_owned_review_line_from_admin_edit();

create or replace function public.admin_update_supplier_marketplace_offer(
  p_offer_id uuid,
  p_patch jsonb
)
returns setof public.supplier_marketplace_offers
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_offer public.supplier_marketplace_offers%rowtype;
  v_before jsonb;
  v_request public.supplier_price_review_requests%rowtype;
  v_product_name text;
  v_quoted_unit text;
  v_unit_price numeric;
  v_valid_until date;
begin
  if not public.is_charismak_admin() then
    raise exception 'Administrator access required';
  end if;

  select * into v_offer
  from public.supplier_marketplace_offers
  where id = p_offer_id
  for update;

  if not found then
    raise exception 'Supplier price not found';
  end if;
  if v_offer.status not in ('approved', 'expired') then
    raise exception 'Only approved or removed supplier prices can be managed here';
  end if;

  v_before := to_jsonb(v_offer);

  if v_offer.supplier_id is not null then
    select * into v_request
    from public.supplier_price_review_requests
    where offer_id = p_offer_id
      and status = 'admin_authorized'
      and consumed_at is null
      and authorization_expires_at > now()
    order by verified_at desc nulls last, created_at desc
    limit 1
    for update;

    if not found then
      raise exception 'Seller authorization is required before admin can edit this price';
    end if;

    perform set_config('charismak.authorized_supplier_offer_id', p_offer_id::text, true);
  end if;

  v_product_name := case when p_patch ? 'product_name' then nullif(btrim(p_patch ->> 'product_name'), '') else v_offer.product_name end;
  v_quoted_unit := case when p_patch ? 'quoted_unit' then nullif(btrim(p_patch ->> 'quoted_unit'), '') else v_offer.quoted_unit end;
  v_unit_price := case when p_patch ? 'unit_price' then nullif(p_patch ->> 'unit_price', '')::numeric else v_offer.unit_price end;
  v_valid_until := case when p_patch ? 'valid_until' then nullif(p_patch ->> 'valid_until', '')::date else v_offer.valid_until end;

  if v_product_name is null then raise exception 'Product name is required'; end if;
  if v_quoted_unit is null then raise exception 'Quoted unit is required'; end if;
  if v_unit_price is null or v_unit_price <= 0 then raise exception 'Unit price must be greater than zero'; end if;

  update public.supplier_marketplace_offers
  set product_name = v_product_name,
      specification = case when p_patch ? 'specification' then nullif(btrim(p_patch ->> 'specification'), '') else specification end,
      brand = case when p_patch ? 'brand' then nullif(btrim(p_patch ->> 'brand'), '') else brand end,
      quoted_unit = v_quoted_unit,
      unit_price = v_unit_price,
      bulk_price = case when p_patch ? 'bulk_price' then nullif(p_patch ->> 'bulk_price', '')::numeric else bulk_price end,
      minimum_qty = case when p_patch ? 'minimum_qty' then nullif(p_patch ->> 'minimum_qty', '')::numeric else minimum_qty end,
      delivery_fee = case when p_patch ? 'delivery_fee' then nullif(p_patch ->> 'delivery_fee', '')::numeric else delivery_fee end,
      delivery_included = case when p_patch ? 'delivery_included' then nullif(p_patch ->> 'delivery_included', '')::boolean else delivery_included end,
      location = case when p_patch ? 'location' then coalesce(nullif(btrim(p_patch ->> 'location'), ''), location) else location end,
      service_area = case when p_patch ? 'service_area' then nullif(btrim(p_patch ->> 'service_area'), '') else service_area end,
      availability = case when p_patch ? 'availability' then nullif(btrim(p_patch ->> 'availability'), '') else availability end,
      valid_until = coalesce(v_valid_until, current_date + 30),
      supplier_remarks = case when p_patch ? 'supplier_remarks' then nullif(btrim(p_patch ->> 'supplier_remarks'), '') else supplier_remarks end,
      status = 'approved',
      published_at = now(),
      updated_at = now()
  where id = p_offer_id
  returning * into v_offer;

  update public.supplier_review_lines
  set product_name = v_offer.product_name,
      specification = v_offer.specification,
      brand = v_offer.brand,
      quoted_unit = v_offer.quoted_unit,
      unit_price = v_offer.unit_price,
      bulk_price = v_offer.bulk_price,
      minimum_qty = v_offer.minimum_qty,
      delivery_fee = v_offer.delivery_fee,
      delivery_included = v_offer.delivery_included,
      location = v_offer.location,
      service_area = v_offer.service_area,
      availability = v_offer.availability,
      valid_until = v_offer.valid_until,
      supplier_remarks = v_offer.supplier_remarks,
      updated_at = now()
  where marketplace_offer_id = p_offer_id;

  if v_offer.supplier_id is not null then
    update public.supplier_price_review_requests
    set status = 'completed',
        consumed_at = now(),
        completed_at = now(),
        admin_changed_by_email = lower(coalesce((select auth.jwt()) ->> 'email', 'admin')),
        before_snapshot = v_before,
        after_snapshot = to_jsonb(v_offer),
        updated_at = now()
    where id = v_request.id;
  end if;

  return next v_offer;
end;
$$;

create or replace function public.admin_remove_supplier_profile(p_supplier_id uuid)
returns setof public.supplier_profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.supplier_profiles%rowtype;
begin
  if not public.is_charismak_admin() then
    raise exception 'Administrator access required';
  end if;

  update public.supplier_profiles
  set status = 'inactive', updated_at = now()
  where id = p_supplier_id
  returning * into v_profile;

  if not found then raise exception 'Supplier profile not found'; end if;

  update public.supplier_marketplace_offers
  set status = 'expired', valid_until = current_date - 1, updated_at = now()
  where supplier_id = p_supplier_id::text and status = 'approved';

  update public.supplier_price_review_requests
  set status = 'cancelled', updated_at = now()
  where supplier_id = p_supplier_id
    and status in ('awaiting_supplier', 'awaiting_code', 'admin_authorized', 'supplier_updating');

  return next v_profile;
end;
$$;

revoke all on function public.admin_request_supplier_price_review(uuid, text) from public, anon;
revoke all on function public.admin_verify_supplier_price_authorization(uuid, text) from public, anon;
revoke all on function public.admin_remove_supplier_profile(uuid) from public, anon;
grant execute on function public.admin_request_supplier_price_review(uuid, text) to authenticated;
grant execute on function public.admin_verify_supplier_price_authorization(uuid, text) to authenticated;
grant execute on function public.admin_remove_supplier_profile(uuid) to authenticated;
