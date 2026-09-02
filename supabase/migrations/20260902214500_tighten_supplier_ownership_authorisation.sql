-- Follow-up hardening for the supplier ownership workflow.
-- This migration is intentionally separate so the complete feature can be reviewed before production application.

-- The admin edit routine needs controlled elevated access to write the private
-- authorisation ledger. Execution remains restricted to authenticated users and
-- the function itself verifies Charismak admin identity before doing anything.
alter function public.admin_update_supplier_marketplace_offer(uuid, jsonb)
  security definer;
alter function public.admin_update_supplier_marketplace_offer(uuid, jsonb)
  set search_path = public;
revoke all on function public.admin_update_supplier_marketplace_offer(uuid, jsonb) from public, anon;
grant execute on function public.admin_update_supplier_marketplace_offer(uuid, jsonb) to authenticated;

-- Treat validity as supplier-owned commercial information too. The one exception
-- is the explicit admin removal path: approved -> expired while all commercial
-- values stay unchanged.
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
     or old.valid_until is distinct from new.valid_until
     or old.supplier_remarks is distinct from new.supplier_remarks then
    raise exception 'Supplier-owned price cannot be edited by admin without seller authorization';
  end if;

  return new;
end;
$$;

-- A PL/pgSQL exception rolls back changes made earlier in the same RPC. Return a
-- structured verification result instead so failed attempts and expiry state are
-- actually recorded and cannot be bypassed with unlimited retries.
drop function if exists public.admin_verify_supplier_price_authorization(uuid, text);

create function public.admin_verify_supplier_price_authorization(
  p_request_id uuid,
  p_code text
)
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
  if not public.is_charismak_admin() then
    raise exception 'Administrator access required';
  end if;

  select * into v_request
  from public.supplier_price_review_requests
  where id = p_request_id
  for update;

  if not found then
    return jsonb_build_object('verified', false, 'error', 'Review authorization request not found');
  end if;

  if v_request.status <> 'awaiting_code' then
    return jsonb_build_object('verified', false, 'error', 'This authorization is not awaiting a code', 'status', v_request.status);
  end if;

  if v_request.otp_expires_at is null or v_request.otp_expires_at <= now() then
    update public.supplier_price_review_requests
      set status = 'expired', updated_at = now()
      where id = p_request_id;
    return jsonb_build_object('verified', false, 'error', 'Authorization code has expired', 'status', 'expired');
  end if;

  if v_request.otp_attempts >= 5 then
    update public.supplier_price_review_requests
      set status = 'expired', updated_at = now()
      where id = p_request_id;
    return jsonb_build_object('verified', false, 'error', 'Too many incorrect code attempts', 'status', 'expired');
  end if;

  v_candidate := encode(extensions.digest(coalesce(p_code, '') || ':' || coalesce(v_request.otp_salt, ''), 'sha256'), 'hex');
  if v_candidate is distinct from v_request.otp_hash then
    v_attempts := v_request.otp_attempts + 1;
    update public.supplier_price_review_requests
      set otp_attempts = v_attempts,
          status = case when v_attempts >= 5 then 'expired' else 'awaiting_code' end,
          updated_at = now()
      where id = p_request_id;
    return jsonb_build_object(
      'verified', false,
      'error', case when v_attempts >= 5 then 'Too many incorrect code attempts' else 'Incorrect authorization code' end,
      'attempts', v_attempts,
      'remaining_attempts', greatest(0, 5 - v_attempts),
      'status', case when v_attempts >= 5 then 'expired' else 'awaiting_code' end
    );
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

  return jsonb_build_object(
    'verified', true,
    'request_id', v_request.id,
    'offer_id', v_request.offer_id,
    'status', v_request.status,
    'authorization_expires_at', v_request.authorization_expires_at
  );
end;
$$;

revoke all on function public.admin_verify_supplier_price_authorization(uuid, text) from public, anon;
grant execute on function public.admin_verify_supplier_price_authorization(uuid, text) to authenticated;
