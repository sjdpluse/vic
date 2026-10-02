# AGENTS.md

This file is mandatory reading for every AI agent and human contributor.

## Project identity

**Business:** VIC PREMIER CONSTRUCTION TEAM  
**Market:** Melbourne, Victoria, Australia  
**Product:** Premium cinematic 3D construction / renovation website with CMS and enquiry system.

## Non-negotiable product direction

This is not a simple landing page and must not collapse into a conventional template.

The first impression should communicate premium workmanship, architectural sophistication and credibility through composition, motion and real work.

The signature interaction is a scroll-driven 3D house transformation:

1. The house first appears partly aged / weathered / unfinished.
2. Scroll progress advances renovation/restoration stages.
3. Ageing, damaged or unfinished visual layers are progressively replaced by clean renewed surfaces and details.
4. Service storytelling is tied to relevant parts of the transformation where appropriate.
5. The completed state is polished, bright and contemporary.

The experience must remain comprehensible when 3D is unavailable or reduced-motion is requested.

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

## 3D rules

- Prefer one exceptional hero/narrative 3D system over many shallow 3D gimmicks.
- Use React Three Fiber / Three.js unless a better implementation is justified.
- Use GLTF/GLB assets and production compression.
- Keep textures and draw calls tightly budgeted.
- Use progressive loading and a meaningful 2D fallback.
- The 3D canvas must not block navigation, accessibility or enquiry conversion.
- Scroll position must map deterministically to animation state.
- Respect `prefers-reduced-motion` and provide a reduced-motion alternative.
- Maintain a separate mobile quality/performance profile when required.

## Motion / scrolling

- GSAP ScrollTrigger is the preferred deterministic timeline layer.
- A smooth-scroll library may be used only if native navigation, keyboard interaction, anchor links, browser history and reduced-motion remain correct.
- Do not hijack scrolling or introduce lag for visual effect.
- Avoid scroll-jacking patterns that trap the user.

## CMS and media

Dynamic project images do not belong in GitHub.

Preferred backend:
- Supabase Auth
- Supabase Postgres
- Supabase Storage

Admin requirements:
- secure `/admin`
- explicit admin authorization
- project CRUD
- draft/publish/archive
- project media upload/order/caption/alt text
- selected site content/settings
- no unconstrained page builder

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
- Three.js / React Three Fiber for 3D
- GSAP for orchestrated motion
- Supabase for auth/data/storage
- `next/image` for public 2D media
- semantic HTML and WCAG-conscious interactions
- metadata, sitemap, robots and structured data using verified facts only
- lint, type-check, tests and production build as merge gates

## Engineering rules

- Never commit secrets or customer/project media.
- Keep privileged Supabase keys server-only.
- Validate public and admin writes on the server.
- Use database constraints and RLS for important invariants.
- Avoid unnecessary dependencies.
- Do not couple all site sections to WebGL; content should still render if the 3D layer fails.
- Avoid hydration-heavy architecture for static/editorial sections.
- Keep runtime errors isolated so failure of 3D does not break the whole page.

## Workflow

- `main` is stable.
- Develop through focused feature branches.
- Open PRs and review before merge.
- Large visual/architecture work must be specified before implementation.
- Validate desktop and mobile separately.
- Document performance trade-offs and fallbacks.
