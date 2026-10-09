create table if not exists public.consultation_gallery_items (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists consultation_gallery_sort_idx
  on public.consultation_gallery_items (sort_order, created_at);

grant select on public.consultation_gallery_items to anon, authenticated;
grant insert, update, delete on public.consultation_gallery_items to authenticated;

alter table public.consultation_gallery_items enable row level security;

drop policy if exists consultation_gallery_public_read on public.consultation_gallery_items;
create policy consultation_gallery_public_read on public.consultation_gallery_items
for select to anon, authenticated
using (true);

drop policy if exists consultation_gallery_staff_insert on public.consultation_gallery_items;
create policy consultation_gallery_staff_insert on public.consultation_gallery_items
for insert to authenticated
with check (private.is_content_staff());

drop policy if exists consultation_gallery_staff_update on public.consultation_gallery_items;
create policy consultation_gallery_staff_update on public.consultation_gallery_items
for update to authenticated
using (private.is_content_staff())
with check (private.is_content_staff());

drop policy if exists consultation_gallery_staff_delete on public.consultation_gallery_items;
create policy consultation_gallery_staff_delete on public.consultation_gallery_items
for delete to authenticated
using (private.is_content_staff());

drop policy if exists consultation_gallery_media_public_read on storage.objects;
create policy consultation_gallery_media_public_read on storage.objects
for select to anon, authenticated
using (
  bucket_id = 'project-media'
  and exists (
    select 1
    from public.consultation_gallery_items item
    where item.storage_path = name
  )
);
