-- Site Pictures: extend project progress updates into an admin-managed picture
-- library feeding the homepage slider. Additive and reversible.
--
-- Status model (kept compatible with the existing `published` RLS rule):
--   Draft     = published false, archived false
--   Published = published true,  archived false
--   Archived  = published false, archived true
--
-- Rollback:
--   alter table public.website_project_updates
--     drop column if exists featured, drop column if exists display_order,
--     drop column if exists alt_text, drop column if exists storage_path,
--     drop column if exists archived, drop column if exists created_by;
--   drop index if exists website_project_updates_slider_idx;

alter table public.website_project_updates
  add column if not exists featured boolean not null default false,
  add column if not exists display_order integer not null default 100,
  add column if not exists alt_text text,
  add column if not exists storage_path text,
  add column if not exists archived boolean not null default false,
  add column if not exists created_by text;

-- An archived picture can never be public.
alter table public.website_project_updates
  drop constraint if exists website_project_updates_archived_not_published;
alter table public.website_project_updates
  add constraint website_project_updates_archived_not_published check (not (archived and published));

create index if not exists website_project_updates_slider_idx
  on public.website_project_updates (published, featured desc, display_order, update_date desc);

-- Existing RLS policies are unchanged: anyone may read published rows; only
-- Charismak admins (public.is_charismak_admin()) may insert, update or delete.
-- Files live in the existing public `content-media` bucket under
-- `site-pictures/`, whose storage policies already restrict writes to admins.
