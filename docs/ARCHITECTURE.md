# Architecture

## Overview

The product combines an SEO-first public site, one controlled 3D narrative experience, a secure content-management area and a consultation/enquiry pipeline.

The architecture should isolate the WebGL experience from core navigation and content so a 3D failure never takes down the public site.

## Application

- Next.js App Router
- TypeScript strict
- Tailwind CSS
- React Server Components for static/editorial/public content where possible
- Client Components only for interactive systems

## 3D and motion

Preferred stack:

- `three`
- `@react-three/fiber`
- `@react-three/drei` where justified
- `gsap`
- `ScrollTrigger`
- optional `lenis` only after accessibility/native-navigation validation

### 3D delivery

Use GLTF/GLB assets.

Preferred optimisation pipeline:
- clean geometry in Blender or equivalent
- remove invisible/internal geometry
- merge static meshes where useful
- reduce material count
- Draco/Meshopt geometry compression where appropriate
- KTX2/Basis texture compression where appropriate
- texture-size tiers for desktop/mobile
- precompute only what materially improves runtime performance

The site should provide an image/video fallback for unsupported or low-capability devices.

## Public content / CMS

Preferred backend:

- Supabase Auth
- Supabase Postgres
- Supabase Storage

Primary content entities:
- `projects`
- `project_media`
- `site_settings`
- `profiles` / admin authorization

Dynamic project media lives in object storage, never Git.

Public queries expose only published content.

## Admin

Protected routes:
- `/admin/login`
- `/admin`
- `/admin/projects`
- `/admin/projects/new`
- `/admin/projects/[id]`
- `/admin/settings`

Authorization must be checked server-side and backed by RLS/database policy where possible.

## Consultation / quote system

Public route or modal flow:
- `/consultation` or `/quote`

Expected entities:
- `enquiries`
- `enquiry_media`

Enquiry media is private.

Upload rules:
- authenticated admin access not required for submission, but public upload endpoints must be tightly constrained
- server-controlled object paths
- allowlisted MIME types/extensions
- file-size limits
- optional image dimension limits
- private bucket
- signed URLs only for authorized viewing

Do not trust user-provided storage paths.

## Email

Use a transactional provider such as Resend, Postmark or equivalent.

Flow:
1. server validates submission
2. database stores enquiry
3. private media references are stored
4. notification email is sent to the business
5. customer receives confirmation if enabled

Email should contain safe metadata and admin/deep links. Avoid attaching large customer files directly when signed/private links are safer.

## Contact actions

Marketing UI uses deliberate icon/label actions. Phone/email values remain in a verified data source and should not be duplicated across components.

## Security boundaries

- no service-role key in browser code
- no arbitrary client-selected storage path
- no client-only admin authorization
- no public listing of private enquiry media
- validate all admin and public mutations server-side
- sanitize/escape editable content through framework-safe rendering; do not accept arbitrary HTML by default
- rate-limit/anti-abuse consultation endpoints before launch
- use CSRF-safe server patterns and secure cookie/session configuration

## SEO

3D must not replace semantic content.

Requirements:
- crawlable headings/body/service content
- route-specific metadata
- canonical discipline
- JSON-LD using verified facts only
- dynamic sitemap for published projects when project routes exist
- server-rendered public project content

## Progressive enhancement

The base site should remain usable with:
- JavaScript delayed
- WebGL unavailable
- reduced motion enabled
- slow network
- mobile low-power mode

The 3D layer is an enhancement to the core marketing narrative, even though it is a signature visual feature.

## Observability / quality gates

Before launch:
- lint
- strict type-check
- production build
- accessibility review
- mobile device testing
- WebGL fallback testing
- form/upload abuse testing
- Lighthouse/Core Web Vitals review
- error monitoring provider decision
- production email/domain verification
