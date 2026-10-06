set local lock_timeout = '5s';

-- The project portfolio and project CMS are no longer part of the product.
-- Storage objects must be removed through the Supabase Storage API, not SQL.
-- Keep the legacy bucket private until its remaining objects are safely removed.
drop policy if exists storage_staff_manage_project_media on storage.objects;

update storage.buckets
set public = false
where id = 'project-media';

drop table if exists public.project_media;
drop table if exists public.projects;

drop function if exists private.is_staff();
