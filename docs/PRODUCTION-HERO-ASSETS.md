# Production hero asset delivery

## Purpose

The production homepage keeps the approved Canvas + scroll architecture but moves large frame assets out of Git and Vercel build output.

The runtime now supports an optional external sequence origin through:

`NEXT_PUBLIC_HERO_SEQUENCE_BASE_URL`

When unset, the existing local `/frames/manifest.json` prototype path remains active. When set, the browser first requests `<base>/manifest.json`; if that manifest request fails, it falls back to the local manifest so the homepage remains usable during migration.

## Manifest contract

The manifest keeps the existing desktop/mobile profile structure. Each frame may provide production formats plus an optional legacy fallback:

```json
{
  "source": {
    "dimensions": { "width": 1280, "height": 720 }
  },
  "profiles": {
    "desktop": {
      "frameCount": 240,
      "preloadRadius": 18,
      "frames": [
        {
          "index": 0,
          "sourceFrame": 1,
          "sourceOrdinal": 1,
          "sources": {
            "avif": "desktop/frame-0001.avif",
            "webp": "desktop/frame-0001.webp"
          }
        }
      ]
    },
    "mobile": {
      "frameCount": 120,
      "preloadRadius": 5,
      "frames": []
    }
  }
}
```

For every frame the runtime tries sources in this order:

1. AVIF
2. WebP
3. legacy `src` if present

A failed AVIF request therefore degrades to WebP without breaking scroll playback.

Relative paths in an external manifest are resolved against `NEXT_PUBLIC_HERO_SEQUENCE_BASE_URL`. Absolute HTTP(S) URLs are preserved.

## Delivery and caching

Recommended production behavior:

- `manifest.json`: short cache with revalidation during active deployments; immutable/versioned URL once a release is fixed.
- frame files: content-hashed or versioned path with long immutable cache headers.
- enable Brotli/Gzip for JSON; image formats are already compressed.
- CDN should support HTTP/2 or HTTP/3 and byte-efficient edge delivery.
- CORS must allow the site origin to fetch the manifest. Frame rendering itself does not read pixels back from Canvas, but keeping CDN CORS correctly configured avoids future restrictions and debugging ambiguity.

## Runtime loading behavior

The Canvas renderer still:

- loads the current/poster frame first;
- requests the completed frame early;
- prioritizes nearby frames around scroll position;
- keeps bounded concurrent image requests;
- reuses identical frame URLs;
- interpolates between adjacent loaded frames;
- falls back to the nearest loaded frame instead of flashing blank Canvas;
- preserves reduced-motion behavior.

## Migration plan

1. Generate reviewed AVIF/WebP artifacts from the approved PNG masters.
2. Upload `manifest.json`, `desktop/`, and `mobile/` to the chosen object-storage/CDN origin.
3. Set `NEXT_PUBLIC_HERO_SEQUENCE_BASE_URL` in Vercel Preview only.
4. Validate desktop, mobile, reverse scroll, reduced motion and simulated failed AVIF requests.
5. Promote the environment variable to Production.
6. Only after production delivery is verified, remove the temporary `/png` and `/images` source directories from Git and stop building local prototype frames in production.

The source directories must not be deleted before step 4/5 succeeds.
