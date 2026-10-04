alter policy services_admin_manage on public.services
using (private.is_admin())
with check (private.is_admin());

alter policy site_settings_admin_manage on public.site_settings
using (private.is_admin())
with check (private.is_admin());

drop policy if exists storage_admin_manage_public_media on storage.objects;

create policy "storage_admin_manage_hero_assets" on storage.objects
for all to authenticated
using (bucket_id = 'hero-assets' and private.is_admin())
with check (bucket_id = 'hero-assets' and private.is_admin());

create policy "storage_staff_manage_project_media" on storage.objects
for all to authenticated
using (bucket_id = 'project-media' and private.is_staff())
with check (bucket_id = 'project-media' and private.is_staff());
