alter table public.supplier_marketplace_offer_history
  add column if not exists change_type text not null default 'superseded',
  add column if not exists changed_by_email text;

create or replace function public.archive_previous_supplier_marketplace_offer()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_change_type text := 'edited';
  v_changed_by text := lower(coalesce((select auth.jwt()) ->> 'email', 'system'));
  v_only_superseded boolean := false;
begin
  if old.status <> 'approved' then
    return null;
  end if;

  if not (
    old.catalogue_item_id is distinct from new.catalogue_item_id
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
    or old.valid_until is distinct from new.valid_until
    or old.supplier_remarks is distinct from new.supplier_remarks
    or old.status is distinct from new.status
  ) then
    return null;
  end if;

  if new.status = 'expired' then
    v_change_type := 'removed';
  elsif new.status <> 'approved' then
    v_change_type := 'status_change';
  else
    v_only_superseded :=
      old.valid_until is distinct from new.valid_until
      and coalesce(new.valid_until, current_date + 1) < current_date
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
      and old.supplier_remarks is not distinct from new.supplier_remarks;
    if v_only_superseded then
      v_change_type := 'superseded';
    end if;
  end if;

  insert into public.supplier_marketplace_offer_history (
    offer_id, source_submission_id, supplier_id, supplier_name,
    catalogue_item_id, product_name, specification, brand, quoted_unit,
    unit_price, bulk_price, minimum_qty, delivery_fee, delivery_included,
    location, service_area, availability, phone, whatsapp, email,
    supplier_remarks, source_type, submitted_at, published_at,
    valid_from, valid_to, change_type, changed_by_email
  ) values (
    old.id, old.source_submission_id, old.supplier_id, old.supplier_name,
    old.catalogue_item_id, old.product_name, old.specification, old.brand, old.quoted_unit,
    old.unit_price, old.bulk_price, old.minimum_qty, old.delivery_fee, old.delivery_included,
    old.location, old.service_area, old.availability, old.phone, old.whatsapp, old.email,
    old.supplier_remarks, old.source_type, old.submitted_at, old.published_at,
    coalesce(old.published_at, old.submitted_at, old.created_at), now(), v_change_type, v_changed_by
  );

  return null;
end;
$$;

create or replace function public.admin_update_supplier_marketplace_offer(
  p_offer_id uuid,
  p_patch jsonb
)
returns setof public.supplier_marketplace_offers
language plpgsql
security definer
set search_path = public
as $$
declare
  v_offer public.supplier_marketplace_offers%rowtype;
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

  v_product_name := case when p_patch ? 'product_name' then nullif(btrim(p_patch ->> 'product_name'), '') else v_offer.product_name end;
  v_quoted_unit := case when p_patch ? 'quoted_unit' then nullif(btrim(p_patch ->> 'quoted_unit'), '') else v_offer.quoted_unit end;
  v_unit_price := case when p_patch ? 'unit_price' then nullif(p_patch ->> 'unit_price', '')::numeric else v_offer.unit_price end;
  v_valid_until := case when p_patch ? 'valid_until' then nullif(p_patch ->> 'valid_until', '')::date else v_offer.valid_until end;

  if v_product_name is null then
    raise exception 'Product name is required';
  end if;
  if v_quoted_unit is null then
    raise exception 'Quoted unit is required';
  end if;
  if v_unit_price is null or v_unit_price <= 0 then
    raise exception 'Unit price must be greater than zero';
  end if;

  update public.supplier_marketplace_offers
  set
    product_name = v_product_name,
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
  set
    product_name = v_offer.product_name,
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

  return next v_offer;
end;
$$;

create or replace function public.admin_remove_supplier_marketplace_offer(p_offer_id uuid)
returns setof public.supplier_marketplace_offers
language plpgsql
security definer
set search_path = public
as $$
declare
  v_offer public.supplier_marketplace_offers%rowtype;
begin
  if not public.is_charismak_admin() then
    raise exception 'Administrator access required';
  end if;

  update public.supplier_marketplace_offers
  set
    status = 'expired',
    valid_until = current_date - 1,
    updated_at = now()
  where id = p_offer_id
    and status = 'approved'
  returning * into v_offer;

  if not found then
    raise exception 'Current approved supplier price not found';
  end if;

  return next v_offer;
end;
$$;

revoke all on function public.admin_update_supplier_marketplace_offer(uuid, jsonb) from public;
grant execute on function public.admin_update_supplier_marketplace_offer(uuid, jsonb) to authenticated;
revoke all on function public.admin_remove_supplier_marketplace_offer(uuid) from public;
grant execute on function public.admin_remove_supplier_marketplace_offer(uuid) to authenticated;
