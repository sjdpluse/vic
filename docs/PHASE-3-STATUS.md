# Phase 3 status

Implemented on `feat/projects-cms-admin`:

- public homepage reads published projects from VIC Supabase
- unpublished/draft projects remain hidden by RLS
- `/admin` email/password sign-in
- explicit viewer/editor/admin access model
- draft creation, publish/unpublish/archive, featured toggle
- project image/MP4 upload to `project-media`
- security advisor currently clean

Before merge:

- run lint, strict type-check and production build
- verify anonymous public reads return only published rows
- verify anonymous writes and uploads are denied
- create one approved staff account manually in Supabase Auth and promote its profile role explicitly
- review admin UI and a real published project in Preview
