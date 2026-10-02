# Architecture

## Overview

The product combines an SEO-first public site, one controlled cinematic frame-sequence narrative experience, a secure content-management area and a consultation/enquiry pipeline.

The architecture must isolate the cinematic sequence from core navigation and content so asset/network/runtime failure never takes down the public site.

## Application

- Next.js App Router
- TypeScript strict
- Tailwind CSS
- React Server Components for static/editorial/public content where possible
- Client Components only for interactive systems

## Cinematic transformation and motion

Preferred stack:

- HTML Canvas for frame rendering
- `gsap`
- `ScrollTrigger`
- optional `lenis` only after accessibility/native-navigation validation

### Sequence source

The source animation is produced externally as a cinematic renovation/restoration master. It may be created using AI video, compositing, 3D rendering, motion design or a hybrid workflow, but the final architectural identity and camera continuity must be reviewed before web integration.

The master is then exported into optimized frame sets.

Preferred delivery formats:
- AVIF primary where supported/quality is acceptable
- WebP fallback where needed
- separate desktop and mobile variants

### Rendering model

A single Canvas displays the active frame.

Scroll progress maps to a normalized value from 0 to 1, which maps deterministically to a frame index. Reverse scrolling selects earlier frames naturally.

HTML content remains outside the Canvas:
- headings
- service labels
- body copy
- CTAs
- navigation

This preserves semantic content, accessibility and SEO independently of the cinematic layer.

### Preloading strategy

Do not preload the full sequence before rendering useful content.

Expected loading order:
1. poster/representative frame
2. initial and nearby frames
3. forward/backward chunks around current progress
4. remaining frames opportunistically

Use bounded concurrency and memory-aware caching. The renderer must tolerate missing frames and fall back to the nearest loaded frame or poster rather than flashing blank content.

### Asset hosting

Large production frame sequences and master videos do not belong in GitHub.

Use external object storage/CDN. The exact provider may be Supabase Storage or a dedicated CDN/object-storage service after performance testing.

Static brand assets and small prototype placeholders may live in Git when reasonable.

### Mobile

Mobile is a separate quality profile.

Potential differences:
- separately composed master/crop
- lower pixel dimensions
- fewer frames
- shorter scroll range
- reduced prefetch radius
- stable poster fallback on low-memory/slow-network conditions

Do not simply force the desktop sequence onto every mobile device.

### Reduced motion and failure fallback

With `prefers-reduced-motion`, disable continuous scrubbing and display a stable representative frame while the narrative content renders in normal document flow.

If Canvas or sequence loading fails, the same stable fallback must remain visible and the rest of the website must continue functioning.

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

The cinematic sequence must not replace semantic content.

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
- frame assets unavailable
- reduced motion enabled
- slow network
- mobile low-power mode

The cinematic layer is an enhancement to the core marketing narrative, even though it is a signature visual feature.

## Observability / quality gates

Before launch:
- lint
- strict type-check
- production build
- accessibility review
- mobile device testing
- frame-sequence failure/fallback testing
- preload/memory testing
- form/upload abuse testing
- Lighthouse/Core Web Vitals review
- error monitoring provider decision
- production email/domain verification
