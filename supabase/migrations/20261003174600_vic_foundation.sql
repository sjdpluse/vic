create extension if not exists pgcrypto;
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'editor' check (role in ('admin','editor')),
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text,
  description text,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  featured boolean not null default false,
  sort_order integer not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_media (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  storage_path text not null,
  media_type text not null default 'image' check (media_type in ('image','video')),
  alt_text text,
  caption text,
  sort_order integer not null default 0,
  width integer,
  height integer,
  created_at timestamptz not null default now()
);

create table public.site_settings (
  key text primary key,
  value jsonb not null,
  is_public boolean not null default true,
  updated_at timestamptz not null default now()
);

create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'new' check (status in ('new','reviewing','contacted','closed','spam')),
  name text not null,
  phone text,
  email text,
  suburb_postcode text,
  service text,
  project_description text not null,
  preferred_timeframe text,
  consent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (phone is not null or email is not null)
);

create table public.enquiry_media (
  id uuid primary key default gen_random_uuid(),
  enquiry_id uuid not null references public.enquiries(id) on delete cascade,
  storage_path text not null,
  original_name text,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz not null default now()
);

create index projects_public_idx on public.projects (status, featured, sort_order, published_at desc);
create index project_media_project_idx on public.project_media (project_id, sort_order);
create index services_active_idx on public.services (is_active, sort_order);
create index enquiries_status_idx on public.enquiries (status, created_at desc);
create index enquiry_media_enquiry_idx on public.enquiry_media (enquiry_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger services_set_updated_at before update on public.services
for each row execute function public.set_updated_at();
create trigger projects_set_updated_at before update on public.projects
for each row execute function public.set_updated_at();
create trigger site_settings_set_updated_at before update on public.site_settings
for each row execute function public.set_updated_at();
create trigger enquiries_set_updated_at before update on public.enquiries
for each row execute function public.set_updated_at();

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke all on function private.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;
grant execute on function private.is_admin() to authenticated;

grant select on public.services, public.projects, public.project_media, public.site_settings to anon, authenticated;
grant select on public.profiles to authenticated;
grant select, insert, update, delete on public.services, public.projects, public.project_media, public.site_settings to authenticated;
grant select, update, delete on public.enquiries, public.enquiry_media to authenticated;

alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.projects enable row level security;
alter table public.project_media enable row level security;
alter table public.site_settings enable row level security;
alter table public.enquiries enable row level security;
alter table public.enquiry_media enable row level security;

create policy "profiles_read_own_or_admin" on public.profiles
for select to authenticated using (id = (select auth.uid()) or private.is_admin());
create policy "profiles_admin_update" on public.profiles
for update to authenticated using (private.is_admin()) with check (private.is_admin());

create policy "services_public_read" on public.services
for select to anon, authenticated using (is_active = true);
create policy "services_admin_manage" on public.services
for all to authenticated using (private.is_admin()) with check (private.is_admin());

create policy "projects_public_read" on public.projects
for select to anon, authenticated using (status = 'published');
create policy "projects_admin_manage" on public.projects
for all to authenticated using (private.is_admin()) with check (private.is_admin());

create policy "project_media_public_read" on public.project_media
for select to anon, authenticated using (exists (
  select 1 from public.projects p
  where p.id = project_media.project_id and p.status = 'published'
));
create policy "project_media_admin_manage" on public.project_media
for all to authenticated using (private.is_admin()) with check (private.is_admin());

create policy "site_settings_public_read" on public.site_settings
for select to anon, authenticated using (is_public = true);
create policy "site_settings_admin_manage" on public.site_settings
for all to authenticated using (private.is_admin()) with check (private.is_admin());

create policy "enquiries_admin_manage" on public.enquiries
for all to authenticated using (private.is_admin()) with check (private.is_admin());
create policy "enquiry_media_admin_manage" on public.enquiry_media
for all to authenticated using (private.is_admin()) with check (private.is_admin());

insert into public.services (slug, title, summary, sort_order) values
  ('residential-construction-renovation', 'Residential Construction & Renovation', 'Residential construction and renovation work for existing and new spaces.', 10),
  ('commercial-construction-renovation', 'Commercial Construction & Renovation', 'Commercial construction and renovation work shaped around the project scope.', 20),
  ('interior-exterior-painting', 'Interior & Exterior Painting', 'Interior and exterior painting with a focus on clean, high-quality finishes.', 30),
  ('roof-restoration', 'Roof Restoration', 'Roof restoration work focused on durability, protection and finish.', 40),
  ('gutters', 'Gutter Installation, Repair & Replacement', 'Gutter installation, repair and replacement for residential and commercial properties.', 50),
  ('tiling', 'Tiling', 'Tiling for kitchens, bathrooms and living areas.', 60),
  ('wall-rendering', 'Wall Rendering', 'Wall rendering for renewed exterior and interior surfaces.', 70),
  ('general-carpentry', 'General Carpentry', 'General carpentry for structural and finishing work.', 80);

insert into public.site_settings (key, value, is_public) values
  ('business', jsonb_build_object(
    'name', 'VIC PREMIER CONSTRUCTION TEAM',
    'holderType', 'Individual',
    'abn', '25 938 974 580',
    'address', '6 Windsor St, Hallam VIC 3803, Australia',
    'phone', '0411 786 573',
    'email', 'vicpremier_constructionteam@yahoo.com',
    'freeQuotes', true
  ), true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('hero-assets', 'hero-assets', true, 26214400, array['image/avif','image/webp','application/json']::text[]),
  ('project-media', 'project-media', true, 52428800, array['image/jpeg','image/png','image/webp','image/avif','video/mp4']::text[]),
  ('enquiry-media', 'enquiry-media', false, 26214400, array['image/jpeg','image/png','image/webp','application/pdf']::text[]);

create policy "storage_admin_manage_public_media" on storage.objects
for all to authenticated
using (bucket_id in ('hero-assets','project-media') and private.is_admin())
with check (bucket_id in ('hero-assets','project-media') and private.is_admin());

create policy "storage_admin_manage_enquiry_media" on storage.objects
for all to authenticated
using (bucket_id = 'enquiry-media' and private.is_admin())
with check (bucket_id = 'enquiry-media' and private.is_admin());
