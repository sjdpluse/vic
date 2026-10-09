create table if not exists public.hero_cloud_media (
  slot text primary key,
  storage_path text not null unique,
  updated_at timestamptz not null default now(),
  constraint hero_cloud_media_slot_check
    check (slot in ('left_to_right','right_to_left'))
);

grant select on public.hero_cloud_media to anon, authenticated;
grant insert, update, delete on public.hero_cloud_media to authenticated;

alter table public.hero_cloud_media enable row level security;

drop policy if exists hero_cloud_media_public_read on public.hero_cloud_media;
create policy hero_cloud_media_public_read on public.hero_cloud_media
for select to anon, authenticated
using (true);

drop policy if exists hero_cloud_media_staff_insert on public.hero_cloud_media;
create policy hero_cloud_media_staff_insert on public.hero_cloud_media
for insert to authenticated
with check (private.is_content_staff());

drop policy if exists hero_cloud_media_staff_update on public.hero_cloud_media;
create policy hero_cloud_media_staff_update on public.hero_cloud_media
for update to authenticated
using (private.is_content_staff())
with check (private.is_content_staff());

drop policy if exists hero_cloud_media_staff_delete on public.hero_cloud_media;
create policy hero_cloud_media_staff_delete on public.hero_cloud_media
for delete to authenticated
using (private.is_content_staff());

drop policy if exists hero_cloud_media_public_storage_read on storage.objects;
create policy hero_cloud_media_public_storage_read on storage.objects
for select to anon, authenticated
using (
  bucket_id = 'project-media'
  and exists (
    select 1
    from public.hero_cloud_media cloud
    where cloud.storage_path = name
  )
);
