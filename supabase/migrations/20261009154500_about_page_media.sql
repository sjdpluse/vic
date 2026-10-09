create table if not exists public.about_page_media (
  id text primary key default 'hero',
  storage_path text not null unique,
  updated_at timestamptz not null default now(),
  constraint about_page_media_singleton check (id = 'hero')
);

grant select on public.about_page_media to anon, authenticated;
grant insert, update, delete on public.about_page_media to authenticated;

alter table public.about_page_media enable row level security;

drop policy if exists about_page_media_public_read on public.about_page_media;
create policy about_page_media_public_read on public.about_page_media
for select to anon, authenticated
using (true);

drop policy if exists about_page_media_staff_insert on public.about_page_media;
create policy about_page_media_staff_insert on public.about_page_media
for insert to authenticated
with check (private.is_content_staff());

drop policy if exists about_page_media_staff_update on public.about_page_media;
create policy about_page_media_staff_update on public.about_page_media
for update to authenticated
using (private.is_content_staff())
with check (private.is_content_staff());

drop policy if exists about_page_media_staff_delete on public.about_page_media;
create policy about_page_media_staff_delete on public.about_page_media
for delete to authenticated
using (private.is_content_staff());

drop policy if exists about_page_media_public_storage_read on storage.objects;
create policy about_page_media_public_storage_read on storage.objects
for select to anon, authenticated
using (
  bucket_id = 'project-media'
  and exists (
    select 1
    from public.about_page_media media
    where media.storage_path = name
  )
);
