-- Add lightweight project progress updates for the public website.
create table if not exists public.website_project_updates (
  id uuid primary key default gen_random_uuid(),
  project_slug text not null,
  project_title text not null,
  project_location text,
  title text not null,
  summary text,
  image_url text not null,
  update_date timestamptz not null default now(),
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by text
);

create index if not exists website_project_updates_public_idx
  on public.website_project_updates (published, update_date desc);

create index if not exists website_project_updates_project_idx
  on public.website_project_updates (project_slug, update_date desc);

alter table public.website_project_updates enable row level security;

drop policy if exists website_project_updates_read on public.website_project_updates;
drop policy if exists website_project_updates_insert on public.website_project_updates;
drop policy if exists website_project_updates_update on public.website_project_updates;
drop policy if exists website_project_updates_delete on public.website_project_updates;

create policy website_project_updates_read
on public.website_project_updates for select to anon, authenticated
using (published or (select public.is_charismak_admin()));

create policy website_project_updates_insert
on public.website_project_updates for insert to authenticated
with check ((select public.is_charismak_admin()));

create policy website_project_updates_update
on public.website_project_updates for update to authenticated
using ((select public.is_charismak_admin()))
with check ((select public.is_charismak_admin()));

create policy website_project_updates_delete
on public.website_project_updates for delete to authenticated
using ((select public.is_charismak_admin()));
