create or replace function private.is_content_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role in ('admin','editor')
  );
$$;
revoke all on function private.is_content_staff() from public;
grant execute on function private.is_content_staff() to authenticated;

create table if not exists public.selected_work_items (
  id uuid primary key default gen_random_uuid(),
  before_storage_path text,
  after_storage_path text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


grant select on public.selected_work_items to anon, authenticated;
grant insert, update, delete on public.selected_work_items to authenticated;
alter table public.selected_work_items enable row level security;

drop policy if exists selected_work_public_read on public.selected_work_items;
create policy selected_work_public_read on public.selected_work_items
for select to anon, authenticated
using (before_storage_path is not null and after_storage_path is not null);

drop policy if exists selected_work_staff_read on public.selected_work_items;
create policy selected_work_staff_read on public.selected_work_items
for select to authenticated using (private.is_content_staff());

drop policy if exists selected_work_staff_insert on public.selected_work_items;
create policy selected_work_staff_insert on public.selected_work_items
for insert to authenticated with check (private.is_content_staff());

drop policy if exists selected_work_staff_update on public.selected_work_items;
create policy selected_work_staff_update on public.selected_work_items
for update to authenticated using (private.is_content_staff()) with check (private.is_content_staff());

drop policy if exists selected_work_staff_delete on public.selected_work_items;
create policy selected_work_staff_delete on public.selected_work_items
for delete to authenticated using (private.is_content_staff());

update storage.buckets set public = false where id = 'project-media';

drop policy if exists storage_content_staff_manage_selected_work on storage.objects;
create policy storage_content_staff_manage_selected_work on storage.objects
for all to authenticated
using (bucket_id = 'project-media' and private.is_content_staff())
with check (bucket_id = 'project-media' and private.is_content_staff());

drop policy if exists selected_work_media_public_read on storage.objects;
create policy selected_work_media_public_read on storage.objects
for select to anon, authenticated
using (
  bucket_id = 'project-media'
  and exists (
    select 1 from public.selected_work_items item
    where item.before_storage_path = name or item.after_storage_path = name
  )
);

with legacy_pairs(sort_order,before_path,after_path) as (
  values
    (10,'8b5bff7b-27f1-4974-855c-39886a4aa785/before-fa5312cb-06e0-4c04-a45d-e57d62b0960d-whatsapp-image-2026-10-01-at-5.56.08-pm-1-.jpeg','8b5bff7b-27f1-4974-855c-39886a4aa785/after-7b469d28-e8b9-4e6e-b9e4-0419c641f987-whatsapp-image-2026-10-01-at-5.56.06-pm-1-.jpeg'),
    (20,'c753e52c-a919-4f95-b4c3-a27ca48346fc/before-24394a13-3cd6-4465-972d-acc3fe561fc3-whatsapp-image-2026-10-01-at-5.56.00-pm.jpeg','c753e52c-a919-4f95-b4c3-a27ca48346fc/after-3dba4168-4b23-44ae-84c5-728c194da238-whatsapp-image-2026-10-01-at-5.55.59-pm.jpeg')
)
insert into public.selected_work_items(sort_order,before_storage_path,after_storage_path)
select p.sort_order,p.before_path,p.after_path from legacy_pairs p
where exists (select 1 from storage.objects where bucket_id='project-media' and name=p.before_path)
  and exists (select 1 from storage.objects where bucket_id='project-media' and name=p.after_path)
  and not exists (
    select 1 from public.selected_work_items e
    where e.before_storage_path=p.before_path and e.after_storage_path=p.after_path
  );
