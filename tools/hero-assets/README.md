# Hero asset optimization pipeline

This tool converts the temporary PNG master sequence in `/png` into deployable AVIF/WebP frame artifacts for the scroll-driven Canvas prototype.

It is intentionally an **offline/build-time tool**. The generated frame sets are ignored by Git and should ultimately be uploaded to object storage/CDN rather than committed to the repository.

## What it does

1. Reads PNG frames in numeric order.
2. Verifies that every source frame has the same dimensions.
3. Removes only **exact consecutive duplicate images** using SHA-256. It does not remove visually similar frames.
4. Generates:
   - desktop AVIF
   - desktop WebP fallback
   - mobile prototype AVIF
   - mobile prototype WebP fallback
5. Writes a machine-readable `manifest.json` containing source-to-output mapping, byte sizes and profile metadata.
6. Writes `SUMMARY.md` with measured output sizes.

The current mobile output is only a resized desktop composition for prototype/performance measurement. It must be replaced by a separately composed mobile source sequence before production if the desktop composition does not meet the mobile art direction.

## Requirements

- Node.js 20+
- npm

Install the isolated tooling dependency:

```bash
npm install --prefix tools/hero-assets --no-audit --no-fund
```

Run from the repository root:

```bash
node tools/hero-assets/optimize.mjs
```

Default inputs/outputs:

```text
png/                         source PNG masters
artifacts/hero-sequence/     generated artifact set (gitignored)
```

## Default encoding profile

Desktop:
- max width: 1280px
- AVIF quality: 56
- WebP quality: 82

Mobile prototype:
- max width: 800px
- same encoder qualities

These are starting values, not permanent production constants. Inspect the blue gradient, roof/fascia edges, windows, facade texture and final clean frame before accepting a profile.

## Useful overrides

```bash
node tools/hero-assets/optimize.mjs \
  --input png \
  --output artifacts/hero-sequence \
  --desktop-width 1280 \
  --mobile-width 800 \
  --avif-quality 56 \
  --webp-quality 82 \
  --concurrency 2
```

For a quick encoder smoke run without generating the entire sequence:

```bash
node tools/hero-assets/optimize.mjs --limit 8
```

## Manifest contract

`manifest.json` records:

- original PNG frame count
- exact consecutive duplicates removed
- processed frame count
- source dimensions and bytes
- AVIF/WebP byte sizes
- desktop/mobile frame paths
- original source frame number for every generated frame
- poster/completed-frame metadata
- representative quality-check frame indices

The eventual Canvas renderer should consume a deployment manifest whose URLs point to CDN/object-storage assets rather than repository paths.

## Production loading rule

Do **not** make browsers download both AVIF and WebP sets. Detect/select one supported format for the session, load the poster/current frame first, then nearby frames, then remaining chunks with bounded concurrency. A missing frame should fall back to the nearest loaded frame or stable poster.

## Source cleanup

The `/png` and `/images` directories currently exist as temporary source material for the prototype. They violate the long-term repository rule for large production media and should be removed from Git after the optimized sequence has been reviewed and uploaded to the chosen object storage/CDN.
