-- Courses & study guides (Learning section). Additive only: two new tables and a PDF bucket.
-- Same protection as blog_posts: the public reads published items; only Charismak admins write.

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 5 and 180),
  summary text not null check (char_length(summary) between 20 and 600),
  level text not null default 'beginner' check (level in ('beginner', 'intermediate', 'advanced')),
  audience text,
  cover_image_url text,
  guide_pdf_url text,
  guide_pdf_name text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.course_lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  position integer not null default 1,
  title text not null check (char_length(title) between 3 and 180),
  summary text,
  body text not null default '',
  video_url text,
  pdf_url text,
  status text not null default 'published' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists course_lessons_course_position on public.course_lessons (course_id, position);

alter table public.courses enable row level security;
alter table public.course_lessons enable row level security;

drop policy if exists courses_read on public.courses;
create policy courses_read on public.courses for select to anon, authenticated
  using (status = 'published' or (select public.is_charismak_admin()));
drop policy if exists courses_insert on public.courses;
create policy courses_insert on public.courses for insert to authenticated with check ((select public.is_charismak_admin()));
drop policy if exists courses_update on public.courses;
create policy courses_update on public.courses for update to authenticated using ((select public.is_charismak_admin())) with check ((select public.is_charismak_admin()));
drop policy if exists courses_delete on public.courses;
create policy courses_delete on public.courses for delete to authenticated using ((select public.is_charismak_admin()));

drop policy if exists course_lessons_read on public.course_lessons;
create policy course_lessons_read on public.course_lessons for select to anon, authenticated
  using ((status = 'published' and exists (select 1 from public.courses c where c.id = course_id and c.status = 'published')) or (select public.is_charismak_admin()));
drop policy if exists course_lessons_insert on public.course_lessons;
create policy course_lessons_insert on public.course_lessons for insert to authenticated with check ((select public.is_charismak_admin()));
drop policy if exists course_lessons_update on public.course_lessons;
create policy course_lessons_update on public.course_lessons for update to authenticated using ((select public.is_charismak_admin())) with check ((select public.is_charismak_admin()));
drop policy if exists course_lessons_delete on public.course_lessons;
create policy course_lessons_delete on public.course_lessons for delete to authenticated using ((select public.is_charismak_admin()));

-- Public PDF bucket for study guides (download links); admins upload/replace/remove.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('study-guides', 'study-guides', true, 26214400, array['application/pdf'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Charismak admins upload study guides" on storage.objects;
create policy "Charismak admins upload study guides" on storage.objects for insert to authenticated
  with check (bucket_id = 'study-guides' and (select public.is_charismak_admin()));
drop policy if exists "Charismak admins update study guides" on storage.objects;
create policy "Charismak admins update study guides" on storage.objects for update to authenticated
  using (bucket_id = 'study-guides' and (select public.is_charismak_admin())) with check (bucket_id = 'study-guides' and (select public.is_charismak_admin()));
drop policy if exists "Charismak admins delete study guides" on storage.objects;
create policy "Charismak admins delete study guides" on storage.objects for delete to authenticated
  using (bucket_id = 'study-guides' and (select public.is_charismak_admin()));
