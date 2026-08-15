create table if not exists public.marketplace_profiles (
  id uuid primary key default gen_random_uuid(),
  profile_type text not null check (profile_type in ('supplier', 'artisan')),
  business_name text not null,
  category text not null,
  location text not null,
  service_area text not null default '',
  phone text not null,
  email text not null,
  description text not null default '',
  products jsonb not null default '[]'::jsonb,
  rating numeric(2,1) not null default 0,
  review_count integer not null default 0,
  verified boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

alter table public.marketplace_profiles enable row level security;

create policy "Anyone can view approved marketplace profiles"
on public.marketplace_profiles for select
using (status = 'approved');

create policy "Anyone can submit a marketplace profile for review"
on public.marketplace_profiles for insert
with check (status = 'pending' and verified = false and rating = 0 and review_count = 0);

create index if not exists marketplace_profiles_status_type_location_idx
on public.marketplace_profiles (status, profile_type, location);

create table if not exists public.marketplace_reviews (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.marketplace_profiles(id) on delete cascade,
  author_name text not null,
  rating integer not null check (rating between 1 and 5),
  comment text not null check (char_length(comment) between 10 and 1000),
  created_at timestamptz not null default now()
);

alter table public.marketplace_reviews enable row level security;

create policy "Anyone can read marketplace reviews"
on public.marketplace_reviews for select using (true);

create policy "Anyone can submit a marketplace review"
on public.marketplace_reviews for insert
with check (rating between 1 and 5 and char_length(comment) between 10 and 1000);
