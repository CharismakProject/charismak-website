-- Final execution hardening for exact supplier-price authorisation.
-- Admin RPCs need controlled elevated access because the authorisation ledger is
-- intentionally not writable directly by authenticated browser sessions.

create or replace function public.refresh_supplier_price_proposal_hash()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.proposed_patch_hash := public.hash_supplier_price_proposal(new.proposed_patch);
    new.authorized_patch_hash := null;
    new.verified_at := null;
    new.authorization_expires_at := null;
    new.consumed_at := null;
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

alter function public.admin_propose_supplier_price_change(uuid, jsonb, text)
  security definer;
alter function public.admin_propose_supplier_price_change(uuid, jsonb, text)
  set search_path = public;

alter function public.admin_verify_supplier_price_authorization(uuid, text)
  security definer;
alter function public.admin_verify_supplier_price_authorization(uuid, text)
  set search_path = public, extensions;

alter function public.admin_apply_authorized_supplier_price_change(uuid)
  security definer;
alter function public.admin_apply_authorized_supplier_price_change(uuid)
  set search_path = public;

alter function public.admin_update_supplier_marketplace_offer(uuid, jsonb)
  security definer;
alter function public.admin_update_supplier_marketplace_offer(uuid, jsonb)
  set search_path = public;

revoke all on function public.admin_propose_supplier_price_change(uuid, jsonb, text) from public, anon;
grant execute on function public.admin_propose_supplier_price_change(uuid, jsonb, text) to authenticated;
revoke all on function public.admin_verify_supplier_price_authorization(uuid, text) from public, anon;
grant execute on function public.admin_verify_supplier_price_authorization(uuid, text) to authenticated;
revoke all on function public.admin_apply_authorized_supplier_price_change(uuid) from public, anon;
grant execute on function public.admin_apply_authorized_supplier_price_change(uuid) to authenticated;
revoke all on function public.admin_update_supplier_marketplace_offer(uuid, jsonb) from public, anon;
grant execute on function public.admin_update_supplier_marketplace_offer(uuid, jsonb) to authenticated;

-- Helpers remain unavailable to anonymous users. Authenticated access is harmless
-- and also keeps nested helper calls valid if execution context changes later.
revoke all on function public.supplier_offer_commercial_snapshot(public.supplier_marketplace_offers) from public, anon;
grant execute on function public.supplier_offer_commercial_snapshot(public.supplier_marketplace_offers) to authenticated;
revoke all on function public.canonical_supplier_offer_patch(public.supplier_marketplace_offers, jsonb) from public, anon;
grant execute on function public.canonical_supplier_offer_patch(public.supplier_marketplace_offers, jsonb) to authenticated;
revoke all on function public.hash_supplier_price_proposal(jsonb) from public, anon;
grant execute on function public.hash_supplier_price_proposal(jsonb) to authenticated;
revoke all on function public.refresh_supplier_price_proposal_hash() from public, anon, authenticated;