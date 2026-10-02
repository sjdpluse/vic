# VIC PREMIER CONSTRUCTION TEAM — Premium 3D Web Experience

This repository is the clean rebuild of the VIC PREMIER CONSTRUCTION TEAM website.

The product is **not** a generic construction landing page. The target is a premium, cinematic, conversion-focused architectural web experience with a scroll-driven 3D house transformation, strong editorial composition, real project content, a secure admin CMS, consultation enquiries, media uploads, and production-grade mobile performance.

## Core experience

A central 3D house acts as the visual narrative of the website. The initial state communicates ageing / wear and the completed state communicates renovation / restoration / finish quality. Scroll progress drives a controlled transformation from old to renewed rather than using decorative 3D for its own sake.

The website must feel credible, expensive and intentional from the first viewport while remaining fast, accessible and usable on mobile.

## Product pillars

- Premium architectural/editorial visual direction
- Scroll-driven 3D storytelling
- Smooth but accessible motion system
- Real project portfolio managed outside Git
- Secure admin CMS
- Consultation/enquiry workflow with image upload
- Email notifications
- Mobile-first performance strategy
- Strong SEO and structured public content
- No unsupported legal, licence, registration, testimonial or project claims

## Planned stack

- Next.js App Router
- TypeScript strict
- Tailwind CSS
- React Three Fiber / Three.js for interactive 3D
- GSAP ScrollTrigger for deterministic scroll timelines
- Lenis or an equivalent restrained smooth-scroll layer only if it passes accessibility/performance review
- Supabase Auth + Postgres + Storage for CMS/data/media
- Transactional email provider such as Resend for enquiry notifications
- `next/image` for 2D project media
- GLTF/GLB with Draco/KTX2 or equivalent optimisation for 3D assets

## Source-of-truth rule

GitHub stores application code, migrations, documentation and static brand assets. Dynamic project photos and customer-uploaded enquiry media must not be committed to the repository.

See `AGENTS.md` and `docs/` before implementation.
