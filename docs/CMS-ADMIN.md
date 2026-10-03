# VIC Projects CMS / Admin

Phase 3 connects the public `Selected Work` section to the dedicated VIC Supabase project and adds a protected `/admin` console for project management.

## Public data

Only rows in `public.projects` with `status = 'published'` are available to anonymous visitors through RLS. Project media is read from the public `project-media` bucket and is only surfaced by the site when linked to published project records.

## Staff access

New Supabase Auth users receive a `viewer` profile by default. A viewer can sign in but cannot create, edit, publish, archive, feature, or upload project media. Staff access requires an explicit role change in `public.profiles` to either `editor` or `admin`.

The write policies use `private.is_staff()` and Storage write access for `project-media` is restricted to staff. This prevents public signup from granting CMS write access.

## Admin route

`/admin` supports:

- email/password sign-in
- project draft creation
- publish/unpublish/archive
- featured toggle
- project image or MP4 upload

Nothing is public until a project is explicitly published.

## Initial staff setup

Create the intended user in Supabase Auth, then explicitly promote that user's corresponding `public.profiles.role` from `viewer` to `admin` or `editor`. Do not expose a public role-promotion endpoint.

## Deferred work

More advanced editing, media reordering/deletion, dedicated project detail pages, enquiry management and email notifications are separate follow-up work.
