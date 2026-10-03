create or replace function private.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and role in ('admin','editor')
  );
$$;

revoke all on function private.is_staff() from public;
grant execute on function private.is_staff() to authenticated;

alter policy services_admin_manage on public.services
using (private.is_staff())
with check (private.is_staff());

alter policy projects_admin_manage on public.projects
using (private.is_staff())
with check (private.is_staff());

alter policy project_media_admin_manage on public.project_media
using (private.is_staff())
with check (private.is_staff());

alter policy site_settings_admin_manage on public.site_settings
using (private.is_staff())
with check (private.is_staff());

alter policy storage_admin_manage_public_media on storage.objects
using (bucket_id in ('hero-assets','project-media') and private.is_staff())
with check (bucket_id in ('hero-assets','project-media') and private.is_staff());

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('admin','editor','viewer'));
alter table public.profiles alter column role set default 'viewer';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, role, display_name)
  values (new.id, 'viewer', coalesce(new.raw_user_meta_data ->> 'full_name', new.email));
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;
