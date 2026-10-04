create or replace function private.enquiry_exists(target_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.enquiries where id = target_id);
$$;

revoke all on function private.enquiry_exists(uuid) from public;
grant execute on function private.enquiry_exists(uuid) to anon, authenticated;

grant insert on public.enquiries, public.enquiry_media to anon;

create policy "enquiries_public_insert" on public.enquiries
for insert to anon
with check (
  status = 'new'
  and consent = true
  and char_length(trim(name)) between 2 and 120
  and char_length(project_description) between 10 and 5000
  and (phone is not null or email is not null)
  and (phone is null or char_length(phone) <= 40)
  and (email is null or char_length(email) <= 254)
  and (suburb_postcode is null or char_length(suburb_postcode) <= 160)
  and (service is null or char_length(service) <= 160)
  and (preferred_timeframe is null or char_length(preferred_timeframe) <= 160)
);

create policy "enquiry_media_public_insert" on public.enquiry_media
for insert to anon
with check (
  private.enquiry_exists(enquiry_id)
  and storage_path like enquiry_id::text || '/%'
  and size_bytes between 1 and 10485760
  and mime_type in ('image/jpeg','image/png','image/webp','application/pdf')
  and (
    select count(*) from public.enquiry_media existing
    where existing.enquiry_id = enquiry_media.enquiry_id
  ) < 5
);

update storage.buckets
set file_size_limit = 10485760,
    allowed_mime_types = array['image/jpeg','image/png','image/webp','application/pdf']::text[]
where id = 'enquiry-media';

create policy "storage_public_upload_enquiry_media" on storage.objects
for insert to anon
with check (
  bucket_id = 'enquiry-media'
  and (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  and private.enquiry_exists(((storage.foldername(name))[1])::uuid)
);
