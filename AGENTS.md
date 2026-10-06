# AGENTS.md

This file is mandatory reading for every AI agent and human contributor.

## Project identity

**Business:** VIC PREMIER CONSTRUCTION TEAM  
**Market:** Melbourne, Victoria, Australia  
**Product:** Premium cinematic construction / renovation website with scroll-driven frame-sequence storytelling and an admin enquiry system.

## Non-negotiable product direction

This is not a simple landing page and must not collapse into a conventional template.

The first impression should communicate premium workmanship, architectural sophistication and credibility through composition, motion and real work.

The signature interaction is a scroll-driven house transformation rendered from a pre-produced cinematic master sequence:

1. The house first appears partly aged / weathered / unfinished.
2. Scroll progress advances renovation/restoration stages.
3. Ageing, damaged or unfinished visual states are progressively replaced by clean renewed surfaces and details.
4. Service storytelling is tied to relevant transformation beats where appropriate.
5. The completed state is polished, bright and contemporary.
6. The production website displays an optimized image sequence on Canvas; the house is not required to be real-time WebGL geometry.

The experience must remain comprehensible when motion is reduced, JavaScript is delayed or frame assets fail to load.

## Verified business facts

- Business name: VIC PREMIER CONSTRUCTION TEAM
- Holder type: Individual
- ABN: 25 938 974 580
- Address: 6 Windsor St, Hallam VIC 3803, Australia
- Phone: 0411 786 573
- Email: vicpremier_constructionteam@yahoo.com
- Free quotes are available.

## Client-supplied services

- Residential construction and renovation
- Commercial construction and renovation
- Interior and exterior painting
- Roof restoration
- Gutter installation, repair and replacement
- Tiling for kitchens, bathrooms and living areas
- Wall rendering
- General carpentry for structural and finishing work

## Content integrity

Never invent or imply unless verified evidence is supplied:

- Builder/practitioner registration status or number
- Licences
- Certifications
- Insurance or warranties
- Awards
- Years of experience
- Project counts/statistics
- Testimonials/ratings
- Specific project locations, dates, scopes or results
- Before/after relationships inferred only from imagery
- Service-area suburbs not explicitly approved

The supplied brand artwork contains the words “BUILDER REGISTRATION”. Treat it as client-provided artwork, not as independent evidence of registration.

## Experience principles

- Architectural/editorial composition over generic cards.
- Strong whitespace, intentional asymmetry and full-bleed media.
- Motion should explain hierarchy or transformation, not decorate every element.
- Scroll reveals must be orchestrated, not random.
- Contact details should normally be exposed through labelled icon actions / contact UI rather than repeated raw text across the site.
- The public site must always preserve a clear path to consultation / free quote.
- Mobile is a first-class experience, not a desktop downgrade.

## Frame-sequence rules

- The cinematic house sequence is the primary transformation engine.
- The source animation must be designed for scroll beats before export.
- Use HTML Canvas for efficient frame rendering; do not render hundreds of `<img>` nodes in the DOM.
- Scroll position must map deterministically to a frame index.
- Reverse scrolling must reverse the transformation naturally.
- Do not autoplay the master video as the primary experience.
- Prefer AVIF for production frames where quality/support is acceptable, with WebP fallback where necessary.
- Desktop and mobile must use separately composed sequences or separately optimized frame sets when composition demands it.
- Do not commit large frame sets or master videos to GitHub. Use external object storage/CDN for production assets.
- Progressive loading is mandatory: poster/current frame first, nearby frames next, remaining frames in chunks.
- Missing frames/network failures must degrade to a stable poster or representative completed frame without breaking content.
- Respect `prefers-reduced-motion`: show a stable representative state and expose service/content narrative in normal document flow.
- The transformation source must preserve the same house identity and camera continuity; visible AI geometry drift, window changes, roof shape morphing or architectural inconsistency is unacceptable.

## Motion / scrolling

- GSAP ScrollTrigger is the preferred deterministic timeline layer.
- A smooth-scroll library may be used only if native navigation, keyboard interaction, anchor links, browser history and reduced-motion remain correct.
- Do not hijack scrolling or introduce lag for visual effect.
- Avoid scroll-jacking patterns that trap the user.
- HTML headings, labels and CTAs remain outside the Canvas and are synchronized to sequence beats.

## Admin and media

Preferred backend:
- Supabase Auth
- Supabase Postgres
- Supabase Storage

Current admin scope:
- secure `/admin` entry point
- explicit admin authorization
- enquiry inbox and status workflow
- private enquiry attachment access through short-lived signed URLs
- no project CRUD, project portfolio CMS or project media management unless the product direction is explicitly changed again

## Consultation/enquiry workflow

The site must support a professional consultation/free-quote request flow.

Expected data:
- name
- phone and/or email
- suburb/postcode
- service
- project description
- preferred timeframe
- optional project photos/documents

Uploads are untrusted input and require server-side validation.

Customer enquiry files must use private storage and must never be publicly enumerable.

Email notifications should send through a transactional provider; secrets remain server-side.

## Technical baseline

- Next.js App Router
- TypeScript strict
- Tailwind CSS
- React Server Components by default
- Client Components only where required
- Canvas-based frame-sequence renderer for the cinematic transformation
- GSAP ScrollTrigger for orchestrated motion
- Supabase for auth/data/storage
- `next/image` for public 2D media
- semantic HTML and WCAG-conscious interactions
- metadata, sitemap, robots and structured data using verified facts only
- lint, type-check, tests and production build as merge gates

## Engineering rules

- Never commit secrets or customer enquiry media.
- Never commit master transformation videos or large production frame sets.
- Keep privileged Supabase keys server-only.
- Validate public and admin writes on the server.
- Use database constraints and RLS for important invariants.
- Avoid unnecessary dependencies.
- Do not couple all site sections to the sequence engine; core content must still render if the cinematic layer fails.
- Avoid hydration-heavy architecture for static/editorial sections.
- Keep runtime errors isolated so failure of the sequence renderer does not break the whole page.

## Workflow

- `main` is stable.
- Develop through focused feature branches.
- Open PRs and review before merge.
- Large visual/architecture work must be specified before implementation.
- Validate desktop and mobile separately.
- Document performance trade-offs and fallbacks.
