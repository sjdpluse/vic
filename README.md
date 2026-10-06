# VIC PREMIER CONSTRUCTION TEAM — Premium Cinematic Web Experience

This repository is the clean rebuild of the VIC PREMIER CONSTRUCTION TEAM website.

The product is **not** a generic construction landing page. The target is a premium, cinematic, conversion-focused architectural web experience with a scroll-driven house-renovation sequence, strong editorial composition, a secure admin enquiry portal, consultation enquiries, private media uploads, and production-grade mobile performance.

## Core experience

A central architectural house acts as the visual narrative of the website. The source asset is a carefully produced cinematic transformation in which an aged / worn house is progressively restored and renewed. The master animation is exported into an optimized image sequence and scroll progress deterministically selects the displayed frame.

This provides the visual quality of pre-rendered cinematics while preserving interactive, reversible scroll control. The house does **not** need to be rendered as real-time WebGL/Three.js geometry in production.

The website must feel credible, expensive and intentional from the first viewport while remaining fast, accessible and usable on mobile.

## Product pillars

- Premium architectural/editorial visual direction
- Scroll-scrubbed cinematic frame-sequence storytelling
- Smooth but accessible motion system
- Secure admin enquiry portal
- Consultation/enquiry workflow with image upload
- Email notifications
- Mobile-first performance strategy
- Strong SEO and structured public content
- No unsupported legal, licence, registration, testimonial or project claims

## Planned stack

- Next.js App Router
- TypeScript strict
- Tailwind CSS
- HTML Canvas for the primary scroll-driven image sequence
- GSAP ScrollTrigger for deterministic scroll timelines and synchronized HTML overlays
- Lenis or an equivalent restrained smooth-scroll layer only if it passes accessibility/performance review
- AVIF/WebP frame sequences with dedicated desktop and mobile variants
- External object storage/CDN for production master video and frame assets; do not place large frame sets in Git
- Supabase Auth + Postgres + Storage for enquiries and private enquiry media
- Transactional email provider such as Resend for enquiry notifications

## Frame-sequence rule

The transformation video must be designed **for scroll**, not created as a normal promotional video and adapted later. Camera composition, renovation beats, hold points and service-label timing must be planned against the website scroll storyboard.

Expected sequence concept:

1. Existing / aged house
2. Roof restoration
3. Gutter / fascia renewal
4. Facade / render restoration
5. Painting / finishing
6. Completed renewed house

The sequence must be reversible through scroll and must not depend on autoplay video timing.

## Source-of-truth rule

GitHub stores application code, migrations, documentation and small static brand assets. Customer-uploaded enquiry media, master cinematic video and large production frame sequences must not be committed to the repository.

See `AGENTS.md` and `docs/` before implementation.
