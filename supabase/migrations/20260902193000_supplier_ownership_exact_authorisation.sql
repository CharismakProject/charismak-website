-- Supplier ownership, exact-change authorisation and admin moderation controls.
-- Supplier-owned commercial information stays read-only to Charismak unless the
-- supplier explicitly authorises the exact proposed change.

create table if not exists public.supplier_price_review_requests (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.supplier_marketplace_offers(id) on delete cascade,
  supplier_id uuid not null references public.supplier_profiles(id) on delete cascade,
  requested_by text not null check (requested_by in ('admin', 'supplier')),
  requested_by_email text,
  reason text,
  status text not null default 'awaiting_supplier'
    check (status in ('awaiting_supplier', 'awaiting_code', 'admin_authorized', 'supplier_updating', 'completed', 'cancelled', 'expired')),
  authorization_channel text
    check (authorization_channel is null or authorization_channel in ('whatsapp', 'email')),
  otp_salt text,
  otp_hash text,
  otp_expires_at timestamptz,
  otp_attempts integer not null default 0 check (otp_attempts >= 0),
  verified_at timestamptz,
  authorization_expires_at timestamptz,
  consumed_at timestamptz,
  completed_at timestamptz,
  admin_changed_by_email text,
  before_snapshot jsonb,
  after_snapshot jsonb,
  proposed_patch jsonb,
  proposed_patch_hash text,
  proposed_by text check (proposed_by is null or proposed_by in ('admin', 'supplier')),
  proposed_at timestamptz,
  authorized_patch_hash text,
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

revoke all on table public.supplier_price_review_requests from public, anon, authenticated;
grant select on table public.supplier_price_review_requests to authenticated;

create or replace function public.supplier_offer_commercial_snapshot(
  p_offer public.supplier_marketplace_offers
)
returns jsonb
language sql
stable
set search_path = public
as $$
  select jsonb_build_object(
    'product_name', p_offer.product_name,
    'specification', p_offer.specification,
    'brand', p_offer.brand,
    'quoted_unit', p_offer.quoted_unit,
    'unit_price', p_offer.unit_price,
    'bulk_price', p_offer.bulk_price,
    'minimum_qty', p_offer.minimum_qty,
    'delivery_fee', p_offer.delivery_fee,
    'delivery_included', p_offer.delivery_included,
    'location', p_offer.location,
    'service_area', p_offer.service_area,
    'availability', p_offer.availability,
    'valid_until', p_offer.valid_until,
    'supplier_remarks', p_offer.supplier_remarks
  );
$$;

create or replace function public.canonical_supplier_offer_patch(
  p_offer public.supplier_marketplace_offers,
  p_patch jsonb
)
returns jsonb
language plpgsql
stable
set search_path = public
as $$
declare
  v_product_name text;
  v_specification text;
  v_brand text;
  v_quoted_unit text;
  v_unit_price numeric;
  v_bulk_price numeric;
  v_minimum_qty numeric;
  v_delivery_fee numeric;
  v_delivery_included boolean;
  v_location text;
  v_service_area text;
  v_availability text;
  v_valid_until date;
  v_supplier_remarks text;
begin
  p_patch := coalesce(p_patch, '{}'::jsonb);

  v_product_name := case when p_patch ? 'product_name' then nullif(btrim(p_patch ->> 'product_name'), '') else p_offer.product_name end;
  v_specification := case when p_patch ? 'specification' then nullif(btrim(p_patch ->> 'specification'), '') else p_offer.specification end;
  v_brand := case when p_patch ? 'brand' then nullif(btrim(p_patch ->> 'brand'), '') else p_offer.brand end;
  v_quoted_unit := case when p_patch ? 'quoted_unit' then nullif(btrim(p_patch ->> 'quoted_unit'), '') else p_offer.quoted_unit end;
  v_unit_price := case when p_patch ? 'unit_price' then nullif(p_patch ->> 'unit_price', '')::numeric else p_offer.unit_price end;
  v_bulk_price := case when p_patch ? 'bulk_price' then nullif(p_patch ->> 'bulk_price', '')::numeric else p_offer.bulk_price end;
  v_minimum_qty := case when p_patch ? 'minimum_qty' then nullif(p_patch ->> 'minimum_qty', '')::numeric else p_offer.minimum_qty end;
  v_delivery_fee := case when p_patch ? 'delivery_fee' then nullif(p_patch ->> 'delivery_fee', '')::numeric else p_offer.delivery_fee end;
  v_delivery_included := case
    when p_patch ? 'delivery_included' then
      case when p_patch -> 'delivery_included' = 'null'::jsonb or nullif(p_patch ->> 'delivery_included', '') is null
        then null else (p_patch ->> 'delivery_included')::boolean end
    else p_offer.delivery_included
  end;
  v_location := case when p_patch ? 'location' then nullif(btrim(p_patch ->> 'location'), '') else p_offer.location end;
  v_service_area := case when p_patch ? 'service_area' then nullif(btrim(p_patch ->> 'service_area'), '') else p_offer.service_area end;
  v_availability := case when p_patch ? 'availability' then nullif(btrim(p_patch ->> 'availability'), '') else p_offer.availability end;
  v_valid_until := case when p_patch ? 'valid_until' then nullif(p_patch ->> 'valid_until', '')::date else p_offer.valid_until end;
  v_supplier_remarks := case when p_patch ? 'supplier_remarks' then nullif(btrim(p_patch ->> 'supplier_remarks'), '') else p_offer.supplier_remarks end;

  if v_product_name is null then raise exception 'Product name is required'; end if;
  if v_quoted_unit is null then raise exception 'Quoted unit is required'; end if;
  if v_location is null then raise exception 'Location is required'; end if;
  if v_unit_price is null or v_unit_price <= 0 then raise exception 'Unit price must be greater than zero'; end if;
  if v_bulk_price is not null and v_bulk_price < 0 then raise exception 'Bulk price cannot be negative'; end if;
  if v_minimum_qty is not null and v_minimum_qty < 0 then raise exception 'Minimum quantity cannot be negative'; end if;
  if v_delivery_fee is not null and v_delivery_fee < 0 then raise exception 'Delivery fee cannot be negative'; end if;

  return jsonb_build_object(
    'product_name', v_product_name,
    'specification', v_specification,
    'brand', v_brand,
    'quoted_unit', v_quoted_unit,
    'unit_price', v_unit_price,
    'bulk_price', v_bulk_price,
    'minimum_qty', v_minimum_qty,
    'delivery_fee', v_delivery_fee,
    'delivery_included', v_delivery_included,
    'location', v_location,
    'service_area', v_service_area,
    'availability', v_availability,
    'valid_until', v_valid_until,
    'supplier_remarks', v_supplier_remarks
  );
end;
$$;

create or replace function public.hash_supplier_price_proposal(p_patch jsonb)
returns text
language sql
immutable
set search_path = public, extensions
as $$
  select case when p_patch is null then null
    else encode(extensions.digest(p_patch::text, 'sha256'), 'hex') end;
$$;

create or replace function public.refresh_supplier_price_proposal_hash()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.proposed_patch_hash := public.hash_supplier_price_proposal(new.proposed_patch);
  elsif new.proposed_patch is distinct from old.proposed_patch then
    new.proposed_patch_hash := public.hash_supplier_price_proposal(new.proposed_patch);
    new.authorized_patch_hash := null;
    new.verified_at := null;
    new.authorization_expires_at := null;
    new.consumed_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists refresh_supplier_price_proposal_hash on public.supplier_price_review_requests;
create trigger refresh_supplier_price_proposal_hash
before insert or update on public.supplier_price_review_requests
for each row execute function public.refresh_supplier_price_proposal_hash();

create or replace function public.protect_supplier_profile_from_admin_edit()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if coalesce(auth.role(), '') <> 'authenticated' then return new; end if;

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

create or replace function public.protect_supplier_owned_offer_from_admin_edit()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_exact_offer text := coalesce(current_setting('charismak.exact_authorized_supplier_offer_id', true), '');
begin
  if coalesce(auth.role(), '') <> 'authenticated' or old.supplier_id is null then return new; end if;

  if v_exact_offer = old.id::text then return new; end if;

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
     or old.valid_until is distinct from new.valid_until
     or old.supplier_remarks is distinct from new.supplier_remarks
     or old.status is distinct from new.status then
    raise exception 'Supplier-owned price cannot be edited by admin without exact seller authorisation';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_supplier_owned_offer_from_admin_edit on public.supplier_marketplace_offers;
create trigger protect_supplier_owned_offer_from_admin_edit
before update on public.supplier_marketplace_offers
for each row execute function public.protect_supplier_owned_offer_from_admin_edit();

create or replace function public.protect_supplier_owned_review_line_from_admin_edit()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_supplier_id uuid;
  v_exact_offer text := coalesce(current_setting('charismak.exact_authorized_supplier_offer_id', true), '');
begin
  if coalesce(auth.role(), '') <> 'authenticated' then return new; end if;

  select supplier_id into v_supplier_id
  from public.supplier_review_batches
  where id = old.batch_id;

  if v_supplier_id is null then return new; end if;
  if old.marketplace_offer_id is not null and v_exact_offer = old.marketplace_offer_id::text then return new; end if;

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
    raise exception 'Supplier-submitted values cannot be edited by admin without exact seller authorisation';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_supplier_owned_review_line_from_admin_edit on public.supplier_review_lines;
create trigger protect_supplier_owned_review_line_from_admin_edit
before update on public.supplier_review_lines
for each row execute function public.protect_supplier_owned_review_line_from_admin_edit();

create or replace function public.admin_request_supplier_price_review(
  p_offer_id uuid,
  p_reason text default null
)
returns setof public.supplier_price_review_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_offer public.supplier_marketplace_offers%rowtype;
  v_supplier_id uuid;
  v_request public.supplier_price_review_requests%rowtype;
begin
  if not public.is_charismak_admin() then raise exception 'Administrator access required'; end if;

  select * into v_offer from public.supplier_marketplace_offers where id = p_offer_id for update;
  if not found then raise exception 'Supplier price not found'; end if;
  if v_offer.supplier_id is null then raise exception 'This price has no linked supplier profile and can be edited directly by admin'; end if;
  if v_offer.status <> 'approved' then raise exception 'Only a current approved supplier price can be reviewed'; end if;

  select id into v_supplier_id from public.supplier_profiles where id::text = v_offer.supplier_id limit 1;
  if v_supplier_id is null then raise exception 'Linked supplier profile could not be resolved'; end if;

  select * into v_request
  from public.supplier_price_review_requests
  where offer_id = p_offer_id
    and status in ('awaiting_supplier','awaiting_code','admin_authorized','supplier_updating')
  order by created_at desc limit 1 for update;

  if found then
    update public.supplier_price_review_requests
    set requested_by = 'admin', requested_by_email = lower(coalesce((select auth.jwt()) ->> 'email', 'admin')),
        reason = nullif(btrim(p_reason), ''), status = 'awaiting_supplier', authorization_channel = null,
        otp_salt = null, otp_hash = null, otp_expires_at = null, otp_attempts = 0, verified_at = null,
        authorization_expires_at = null, consumed_at = null, completed_at = null, proposed_patch = null,
        proposed_by = null, proposed_at = null, authorized_patch_hash = null,
        before_snapshot = public.supplier_offer_commercial_snapshot(v_offer), after_snapshot = null, updated_at = now()
    where id = v_request.id returning * into v_request;
  else
    insert into public.supplier_price_review_requests (offer_id, supplier_id, requested_by, requested_by_email, reason, status, before_snapshot)
    values (p_offer_id, v_supplier_id, 'admin', lower(coalesce((select auth.jwt()) ->> 'email', 'admin')),
      nullif(btrim(p_reason), ''), 'awaiting_supplier', public.supplier_offer_commercial_snapshot(v_offer))
    returning * into v_request;
  end if;
  return next v_request;
end;
$$;

create or replace function public.admin_propose_supplier_price_change(p_offer_id uuid, p_patch jsonb, p_reason text default null)
returns setof public.supplier_price_review_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_offer public.supplier_marketplace_offers%rowtype;
  v_supplier_id uuid;
  v_before jsonb;
  v_proposed jsonb;
  v_request public.supplier_price_review_requests%rowtype;
begin
  if not public.is_charismak_admin() then raise exception 'Administrator access required'; end if;
  select * into v_offer from public.supplier_marketplace_offers where id = p_offer_id for update;
  if not found then raise exception 'Supplier price not found'; end if;
  if v_offer.supplier_id is null then raise exception 'This price is unclaimed and can be edited directly by admin'; end if;
  if v_offer.status <> 'approved' then raise exception 'Only a current approved supplier price can be proposed for change'; end if;
  select id into v_supplier_id from public.supplier_profiles where id::text = v_offer.supplier_id limit 1;
  if v_supplier_id is null then raise exception 'Linked supplier profile could not be resolved'; end if;
  v_before := public.supplier_offer_commercial_snapshot(v_offer);
  v_proposed := public.canonical_supplier_offer_patch(v_offer, p_patch);
  if v_before = v_proposed then raise exception 'The proposed values are the same as the current supplier price'; end if;
  select * into v_request from public.supplier_price_review_requests where offer_id=p_offer_id
    and status in ('awaiting_supplier','awaiting_code','admin_authorized','supplier_updating')
    order by created_at desc limit 1 for update;
  if found then
    update public.supplier_price_review_requests
    set requested_by='admin', requested_by_email=lower(coalesce((select auth.jwt()) ->> 'email','admin')),
        reason=nullif(btrim(p_reason),''), status='awaiting_supplier', authorization_channel=null,
        otp_salt=null, otp_hash=null, otp_expires_at=null, otp_attempts=0, verified_at=null,
        authorization_expires_at=null, consumed_at=null, completed_at=null, proposed_patch=v_proposed,
        proposed_by='admin', proposed_at=now(), authorized_patch_hash=null, before_snapshot=v_before,
        after_snapshot=null, updated_at=now()
    where id=v_request.id returning * into v_request;
  else
    insert into public.supplier_price_review_requests
      (offer_id,supplier_id,requested_by,requested_by_email,reason,status,proposed_patch,proposed_by,proposed_at,before_snapshot)
    values (p_offer_id,v_supplier_id,'admin',lower(coalesce((select auth.jwt()) ->> 'email','admin')),
      nullif(btrim(p_reason),''),'awaiting_supplier',v_proposed,'admin',now(),v_before)
    returning * into v_request;
  end if;
  return next v_request;
end;
$$;

create or replace function public.admin_verify_supplier_price_authorization(p_request_id uuid, p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_request public.supplier_price_review_requests%rowtype;
  v_candidate text;
  v_attempts integer;
begin
  if not public.is_charismak_admin() then raise exception 'Administrator access required'; end if;
  select * into v_request from public.supplier_price_review_requests where id=p_request_id for update;
  if not found then return jsonb_build_object('verified',false,'error','Review authorisation request not found'); end if;
  if v_request.status <> 'awaiting_code' then return jsonb_build_object('verified',false,'error','This authorisation is not awaiting a code','status',v_request.status); end if;
  if v_request.proposed_patch is null or v_request.proposed_patch_hash is null then return jsonb_build_object('verified',false,'error','No exact proposed change is attached to this authorisation'); end if;
  if v_request.otp_expires_at is null or v_request.otp_expires_at <= now() then
    update public.supplier_price_review_requests set status='expired',updated_at=now() where id=p_request_id;
    return jsonb_build_object('verified',false,'error','Authorisation code has expired','status','expired');
  end if;
  if v_request.otp_attempts >= 5 then
    update public.supplier_price_review_requests set status='expired',updated_at=now() where id=p_request_id;
    return jsonb_build_object('verified',false,'error','Too many incorrect code attempts','status','expired');
  end if;
  v_candidate := encode(extensions.digest(coalesce(p_code,'') || ':' || coalesce(v_request.otp_salt,''),'sha256'),'hex');
  if v_candidate is distinct from v_request.otp_hash then
    v_attempts := v_request.otp_attempts + 1;
    update public.supplier_price_review_requests set otp_attempts=v_attempts,
      status=case when v_attempts>=5 then 'expired' else 'awaiting_code' end, updated_at=now() where id=p_request_id;
    return jsonb_build_object('verified',false,
      'error',case when v_attempts>=5 then 'Too many incorrect code attempts' else 'Incorrect authorisation code' end,
      'remaining_attempts',greatest(0,5-v_attempts),'status',case when v_attempts>=5 then 'expired' else 'awaiting_code' end);
  end if;
  update public.supplier_price_review_requests
  set status='admin_authorized',verified_at=now(),authorization_expires_at=now()+interval '30 minutes',
      authorized_patch_hash=proposed_patch_hash,otp_hash=null,otp_salt=null,otp_attempts=0,updated_at=now()
  where id=p_request_id returning * into v_request;
  return jsonb_build_object('verified',true,'request_id',v_request.id,'offer_id',v_request.offer_id,
    'status',v_request.status,'authorization_expires_at',v_request.authorization_expires_at,'authorized_patch_hash',v_request.authorized_patch_hash);
end;
$$;

create or replace function public.admin_apply_authorized_supplier_price_change(p_request_id uuid)
returns setof public.supplier_marketplace_offers
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.supplier_price_review_requests%rowtype;
  v_offer public.supplier_marketplace_offers%rowtype;
  v_current jsonb;
  v_proposed jsonb;
  v_admin_email text := lower(coalesce((select auth.jwt()) ->> 'email','admin'));
begin
  if not public.is_charismak_admin() then raise exception 'Administrator access required'; end if;
  select * into v_request from public.supplier_price_review_requests where id=p_request_id for update;
  if not found then raise exception 'Authorisation request not found'; end if;
  if v_request.status <> 'admin_authorized' then raise exception 'Seller authorisation is required before applying this change'; end if;
  if v_request.consumed_at is not null then raise exception 'This authorisation has already been consumed'; end if;
  if v_request.authorization_expires_at is null or v_request.authorization_expires_at <= now() then raise exception 'Seller authorisation has expired'; end if;
  if v_request.proposed_patch is null or v_request.proposed_patch_hash is null then raise exception 'Exact proposed change is missing'; end if;
  if v_request.authorized_patch_hash is distinct from v_request.proposed_patch_hash then raise exception 'The proposed change no longer matches what the seller authorised'; end if;
  if public.hash_supplier_price_proposal(v_request.proposed_patch) is distinct from v_request.authorized_patch_hash then raise exception 'The authorised proposal has changed and requires new seller approval'; end if;
  select * into v_offer from public.supplier_marketplace_offers where id=v_request.offer_id for update;
  if not found then raise exception 'Supplier price not found'; end if;
  if v_offer.status <> 'approved' then raise exception 'The live supplier price is no longer current'; end if;
  if v_offer.supplier_id is null or v_offer.supplier_id <> v_request.supplier_id::text then raise exception 'Supplier ownership no longer matches this authorisation'; end if;
  v_current := public.supplier_offer_commercial_snapshot(v_offer);
  if v_request.before_snapshot is null or v_current is distinct from v_request.before_snapshot then raise exception 'The live supplier price changed after this proposal was prepared. A new seller authorisation is required'; end if;
  v_proposed := public.canonical_supplier_offer_patch(v_offer,v_request.proposed_patch);
  if public.hash_supplier_price_proposal(v_proposed) is distinct from v_request.authorized_patch_hash then raise exception 'The exact values to apply no longer match the seller-authorised proposal'; end if;
  perform set_config('charismak.exact_authorized_supplier_offer_id',v_offer.id::text,true);
  update public.supplier_marketplace_offers
  set product_name=v_proposed->>'product_name', specification=nullif(v_proposed->>'specification',''), brand=nullif(v_proposed->>'brand',''),
      quoted_unit=v_proposed->>'quoted_unit', unit_price=(v_proposed->>'unit_price')::numeric,
      bulk_price=nullif(v_proposed->>'bulk_price','')::numeric, minimum_qty=nullif(v_proposed->>'minimum_qty','')::numeric,
      delivery_fee=nullif(v_proposed->>'delivery_fee','')::numeric,
      delivery_included=case when v_proposed->'delivery_included'='null'::jsonb then null else (v_proposed->>'delivery_included')::boolean end,
      location=v_proposed->>'location', service_area=nullif(v_proposed->>'service_area',''), availability=nullif(v_proposed->>'availability',''),
      valid_until=nullif(v_proposed->>'valid_until','')::date, supplier_remarks=nullif(v_proposed->>'supplier_remarks',''),
      status='approved',published_at=now(),updated_at=now()
  where id=v_offer.id returning * into v_offer;
  update public.supplier_review_lines
  set product_name=v_offer.product_name,specification=v_offer.specification,brand=v_offer.brand,quoted_unit=v_offer.quoted_unit,
      unit_price=v_offer.unit_price,bulk_price=v_offer.bulk_price,minimum_qty=v_offer.minimum_qty,delivery_fee=v_offer.delivery_fee,
      delivery_included=v_offer.delivery_included,location=v_offer.location,service_area=v_offer.service_area,availability=v_offer.availability,
      valid_until=v_offer.valid_until,supplier_remarks=v_offer.supplier_remarks,updated_at=now()
  where marketplace_offer_id=v_offer.id;
  update public.supplier_price_review_requests
  set status='completed',consumed_at=now(),completed_at=now(),admin_changed_by_email=v_admin_email,
      after_snapshot=public.supplier_offer_commercial_snapshot(v_offer),updated_at=now()
  where id=v_request.id;
  return next v_offer;
end;
$$;

create or replace function public.admin_update_supplier_marketplace_offer(p_offer_id uuid,p_patch jsonb)
returns setof public.supplier_marketplace_offers
language plpgsql
security definer
set search_path = public
as $$
declare
  v_offer public.supplier_marketplace_offers%rowtype;
  v_patch jsonb;
begin
  if not public.is_charismak_admin() then raise exception 'Administrator access required'; end if;
  select * into v_offer from public.supplier_marketplace_offers where id=p_offer_id for update;
  if not found then raise exception 'Supplier price not found'; end if;
  if v_offer.supplier_id is not null then raise exception 'Supplier-owned prices cannot be edited directly by admin. Use exact seller authorisation'; end if;
  if v_offer.status not in ('approved','expired') then raise exception 'Only approved or removed unclaimed prices can be managed here'; end if;
  v_patch := public.canonical_supplier_offer_patch(v_offer,p_patch);
  update public.supplier_marketplace_offers
  set product_name=v_patch->>'product_name',specification=nullif(v_patch->>'specification',''),brand=nullif(v_patch->>'brand',''),
      quoted_unit=v_patch->>'quoted_unit',unit_price=(v_patch->>'unit_price')::numeric,bulk_price=nullif(v_patch->>'bulk_price','')::numeric,
      minimum_qty=nullif(v_patch->>'minimum_qty','')::numeric,delivery_fee=nullif(v_patch->>'delivery_fee','')::numeric,
      delivery_included=case when v_patch->'delivery_included'='null'::jsonb then null else (v_patch->>'delivery_included')::boolean end,
      location=v_patch->>'location',service_area=nullif(v_patch->>'service_area',''),availability=nullif(v_patch->>'availability',''),
      valid_until=nullif(v_patch->>'valid_until','')::date,supplier_remarks=nullif(v_patch->>'supplier_remarks',''),
      status='approved',published_at=now(),updated_at=now()
  where id=p_offer_id returning * into v_offer;
  update public.supplier_review_lines
  set product_name=v_offer.product_name,specification=v_offer.specification,brand=v_offer.brand,quoted_unit=v_offer.quoted_unit,
      unit_price=v_offer.unit_price,bulk_price=v_offer.bulk_price,minimum_qty=v_offer.minimum_qty,delivery_fee=v_offer.delivery_fee,
      delivery_included=v_offer.delivery_included,location=v_offer.location,service_area=v_offer.service_area,availability=v_offer.availability,
      valid_until=v_offer.valid_until,supplier_remarks=v_offer.supplier_remarks,updated_at=now()
  where marketplace_offer_id=p_offer_id;
  return next v_offer;
end;
$$;

create or replace function public.admin_remove_supplier_marketplace_offer(p_offer_id uuid)
returns setof public.supplier_marketplace_offers
language plpgsql
security definer
set search_path = public
as $$
declare v_offer public.supplier_marketplace_offers%rowtype;
begin
  if not public.is_charismak_admin() then raise exception 'Administrator access required'; end if;
  update public.supplier_marketplace_offers set status='expired',valid_until=current_date-1,updated_at=now()
  where id=p_offer_id and status='approved' returning * into v_offer;
  if not found then raise exception 'Current approved supplier price not found'; end if;
  update public.supplier_price_review_requests set status='cancelled',updated_at=now()
  where offer_id=p_offer_id and status in ('awaiting_supplier','awaiting_code','admin_authorized','supplier_updating');
  return next v_offer;
end;
$$;

create or replace function public.admin_remove_supplier_profile(p_supplier_id uuid)
returns setof public.supplier_profiles
language plpgsql
security definer
set search_path = public
as $$
declare v_profile public.supplier_profiles%rowtype;
begin
  if not public.is_charismak_admin() then raise exception 'Administrator access required'; end if;
  update public.supplier_profiles set status='inactive',pin_reset_allowed_until=null,login_locked_until=null,updated_at=now()
  where id=p_supplier_id returning * into v_profile;
  if not found then raise exception 'Supplier profile not found'; end if;
  update public.supplier_marketplace_offers set status='expired',valid_until=current_date-1,updated_at=now()
  where supplier_id=p_supplier_id::text and status='approved';
  update public.supplier_price_review_requests set status='cancelled',updated_at=now()
  where supplier_id=p_supplier_id and status in ('awaiting_supplier','awaiting_code','admin_authorized','supplier_updating');
  return next v_profile;
end;
$$;

revoke all on function public.admin_request_supplier_price_review(uuid,text) from public,anon;
revoke all on function public.admin_propose_supplier_price_change(uuid,jsonb,text) from public,anon;
revoke all on function public.admin_verify_supplier_price_authorization(uuid,text) from public,anon;
revoke all on function public.admin_apply_authorized_supplier_price_change(uuid) from public,anon;
revoke all on function public.admin_update_supplier_marketplace_offer(uuid,jsonb) from public,anon;
revoke all on function public.admin_remove_supplier_marketplace_offer(uuid) from public,anon;
revoke all on function public.admin_remove_supplier_profile(uuid) from public,anon;
grant execute on function public.admin_request_supplier_price_review(uuid,text) to authenticated;
grant execute on function public.admin_propose_supplier_price_change(uuid,jsonb,text) to authenticated;
grant execute on function public.admin_verify_supplier_price_authorization(uuid,text) to authenticated;
grant execute on function public.admin_apply_authorized_supplier_price_change(uuid) to authenticated;
grant execute on function public.admin_update_supplier_marketplace_offer(uuid,jsonb) to authenticated;
grant execute on function public.admin_remove_supplier_marketplace_offer(uuid) to authenticated;
grant execute on function public.admin_remove_supplier_profile(uuid) to authenticated;
revoke all on function public.supplier_offer_commercial_snapshot(public.supplier_marketplace_offers) from public,anon,authenticated;
revoke all on function public.canonical_supplier_offer_patch(public.supplier_marketplace_offers,jsonb) from public,anon,authenticated;
revoke all on function public.hash_supplier_price_proposal(jsonb) from public,anon,authenticated;
revoke all on function public.refresh_supplier_price_proposal_hash() from public,anon,authenticated;
revoke all on function public.protect_supplier_profile_from_admin_edit() from public,anon,authenticated;
revoke all on function public.protect_supplier_owned_offer_from_admin_edit() from public,anon,authenticated;
revoke all on function public.protect_supplier_owned_review_line_from_admin_edit() from public,anon,authenticated;
