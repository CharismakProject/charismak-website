alter table public.supplier_profiles
  add column if not exists pin_reset_allowed_until timestamptz,
  add column if not exists pin_reset_released_at timestamptz,
  add column if not exists pin_reset_released_by text;

create index if not exists supplier_profiles_pin_reset_window_idx
on public.supplier_profiles (pin_reset_allowed_until)
where pin_reset_allowed_until is not null;
