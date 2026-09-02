-- Marketplace security hardening.
-- Keep public users away from internal supplier/admin routines and make
-- admin price management rely on the existing admin RLS policies.

alter function public.admin_remove_supplier_marketplace_offer(uuid)
  security invoker;

alter function public.admin_update_supplier_marketplace_offer(uuid, jsonb)
  security invoker;

revoke all privileges on function public.admin_remove_supplier_marketplace_offer(uuid)
  from public, anon;
revoke all privileges on function public.admin_update_supplier_marketplace_offer(uuid, jsonb)
  from public, anon;

grant execute on function public.admin_remove_supplier_marketplace_offer(uuid)
  to authenticated;
grant execute on function public.admin_update_supplier_marketplace_offer(uuid, jsonb)
  to authenticated;

-- These are trigger-only functions. They must not be callable directly
-- through the public Data API by anonymous or signed-in users.
revoke all privileges on function public.populate_structured_steel_review_lines()
  from public, anon, authenticated;
revoke all privileges on function public.skip_duplicate_supplier_review_line()
  from public, anon, authenticated;
