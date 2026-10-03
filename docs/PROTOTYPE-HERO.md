# Phase 0 — Scroll frame-sequence prototype

## Purpose

This prototype validates the approved moving-hero direction with the real house sequence while deliberately stopping before production website implementation.

The page is **not pinned** for several viewport heights. The hero remains in document flow. The house starts low in the composition, rises as the visitor scrolls, progresses from weathered to renewed, and hands naturally into the next editorial section.

## Source frames

The repository currently contains 240 JPG prototype frames and 240 PNG masters. The build-time prototype preparation step uses the JPG set for a lightweight preview, removes only exact consecutive duplicate JPG frames, and writes generated runtime assets under `public/frames/`.

The measured production-format export remains external to Git:

- 240 PNG inputs / 112.69 MiB
- 192 unique consecutive frames after 48 exact duplicates
- desktop AVIF q56: 4.03 MiB total
- desktop WebP q82: 7.58 MiB total
- mobile 800×450 AVIF q56: 2.07 MiB total
- mobile 800×450 WebP q82: 3.78 MiB total

The generated JPG files in `public/frames/` are prototype-only and gitignored. Production will point the same renderer at external AVIF/WebP storage/CDN assets.

## Interaction

- `ScrollTrigger` maps hero progress deterministically to frame index.
- There is no autoplay timeline.
- Reverse scrolling requests earlier frame indices naturally.
- The Canvas displays one frame at a time.
- The house stage also receives a controlled upward translation and slight scale change so the whole page continues travelling rather than feeling frozen.
- HTML headline, CTA, navigation and service beat label remain semantic and outside Canvas.

## Progressive loading

The renderer:

1. loads the current/poster frame;
2. loads the completed fallback frame;
3. preloads a bounded radius around the requested frame;
4. fills remaining frames opportunistically with maximum four concurrent image requests;
5. renders the nearest loaded frame when the exact requested frame is not ready.

A missing manifest or failed frame request leaves the poster visible and does not break the page.

## Mobile profile

The current runtime prototype generates a separate mobile manifest containing every second unique frame, reducing request count while preserving the same sequence order. This is a delivery-profile proof, not the final mobile visual master.

The production mobile plan remains:

- use the measured 800×450 AVIF/WebP set for early implementation if composition is acceptable;
- author a dedicated mobile composition if desktop framing crowds the headline/house relationship;
- shorter scroll range and smaller preload radius;
- stable poster on constrained or failed-loading devices.

## Reduced motion

When `prefers-reduced-motion: reduce` is active:

- continuous scroll scrubbing is disabled;
- the completed representative frame is requested;
- the hero uses a shorter normal-flow layout;
- all semantic content and CTA remain available.

## Intentional deferrals

- CDN/object-storage upload and URL configuration
- production AVIF/WebP runtime selection
- dedicated portrait mobile master
- full homepage sections
- CMS/admin/auth
- enquiry backend/uploads/email
- browser/device visual QA outside automated build checks
