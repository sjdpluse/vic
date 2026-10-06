alter table public.project_media
  add column if not exists display_role text not null default 'gallery';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'project_media_display_role_check'
      and conrelid = 'public.project_media'::regclass
  ) then
    alter table public.project_media
      add constraint project_media_display_role_check
      check (display_role in ('gallery', 'before', 'after'));
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'project_media_comparison_image_check'
      and conrelid = 'public.project_media'::regclass
  ) then
    alter table public.project_media
      add constraint project_media_comparison_image_check
      check (display_role = 'gallery' or media_type = 'image');
  end if;
end
$$;

create unique index if not exists project_media_one_before_per_project
  on public.project_media(project_id)
  where display_role = 'before';

create unique index if not exists project_media_one_after_per_project
  on public.project_media(project_id)
  where display_role = 'after';

comment on column public.project_media.display_role is
  'Controls project media placement: gallery, before, or after. Before/after power Selected Work comparison cards.';
