export type HeroFrame = {
  index: number;
  src?: string;
  sources?: {
    avif?: string;
    webp?: string;
  };
  sourceFrame: number;
  sourceOrdinal: number;
};

export type HeroProfile = {
  frameCount: number;
  preloadRadius: number;
  frames: HeroFrame[];
};

export type HeroManifest = {
  source: {
    dimensions: { width: number; height: number };
  };
  profiles: {
    desktop: HeroProfile;
    mobile: HeroProfile;
  };
};

const LOCAL_MANIFEST_URL = "/frames/manifest.json";
const DEFAULT_EXTERNAL_BASE_URL =
  "https://jemyrlzpsmtpveulrhgi.supabase.co/storage/v1/object/public/hero-assets/hero/v1";
const rawBaseUrl = process.env.NEXT_PUBLIC_HERO_SEQUENCE_BASE_URL?.trim();

export const HERO_SEQUENCE_BASE_URL = (rawBaseUrl || DEFAULT_EXTERNAL_BASE_URL).replace(/\/+$/, "");

export const HERO_MANIFEST_URL = `${HERO_SEQUENCE_BASE_URL}/manifest.json`;

function resolveAgainstBase(value: string, baseUrl: string | null) {
  if (/^https?:\/\//i.test(value) || !baseUrl) return value;
  return `${baseUrl}/${value.replace(/^\/+/, "")}`;
}

function normalizeManifest(manifest: HeroManifest, baseUrl: string | null): HeroManifest {
  return {
    ...manifest,
    profiles: {
      desktop: {
        ...manifest.profiles.desktop,
        frames: manifest.profiles.desktop.frames.map((frame) => ({
          ...frame,
          src: frame.src ? resolveAgainstBase(frame.src, baseUrl) : undefined,
          sources: frame.sources
            ? {
                avif: frame.sources.avif
                  ? resolveAgainstBase(frame.sources.avif, baseUrl)
                  : undefined,
                webp: frame.sources.webp
                  ? resolveAgainstBase(frame.sources.webp, baseUrl)
                  : undefined,
              }
            : undefined,
        })),
      },
      mobile: {
        ...manifest.profiles.mobile,
        frames: manifest.profiles.mobile.frames.map((frame) => ({
          ...frame,
          src: frame.src ? resolveAgainstBase(frame.src, baseUrl) : undefined,
          sources: frame.sources
            ? {
                avif: frame.sources.avif
                  ? resolveAgainstBase(frame.sources.avif, baseUrl)
                  : undefined,
                webp: frame.sources.webp
                  ? resolveAgainstBase(frame.sources.webp, baseUrl)
                  : undefined,
              }
            : undefined,
        })),
      },
    },
  };
}

export function frameSourceCandidates(frame: HeroFrame) {
  return [...new Set([frame.sources?.avif, frame.sources?.webp, frame.src].filter(
    (value): value is string => Boolean(value),
  ))];
}

export async function fetchHeroManifest(signal?: AbortSignal): Promise<HeroManifest> {
  const urls = [HERO_MANIFEST_URL, LOCAL_MANIFEST_URL];
  let lastError: unknown;

  for (const url of urls) {
    try {
      const response = await fetch(url, {
        signal,
        cache: url === HERO_MANIFEST_URL ? "force-cache" : "default",
      });

      if (!response.ok) {
        throw new Error(`Hero manifest request failed with ${response.status}`);
      }

      const manifest = (await response.json()) as HeroManifest;
      const baseUrl = url === HERO_MANIFEST_URL ? HERO_SEQUENCE_BASE_URL : null;

      return normalizeManifest(manifest, baseUrl);
    } catch (error) {
      if (signal?.aborted) throw error;
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Hero frame manifest could not be loaded");
}
