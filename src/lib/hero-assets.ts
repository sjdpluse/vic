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
const rawBaseUrl = process.env.NEXT_PUBLIC_HERO_SEQUENCE_BASE_URL?.trim();

export const HERO_SEQUENCE_BASE_URL = rawBaseUrl
  ? rawBaseUrl.replace(/\/+$/, "")
  : null;

export const HERO_MANIFEST_URL = HERO_SEQUENCE_BASE_URL
  ? `${HERO_SEQUENCE_BASE_URL}/manifest.json`
  : LOCAL_MANIFEST_URL;

export function resolveHeroAssetUrl(value: string) {
  if (/^https?:\/\//i.test(value)) return value;
  if (!HERO_SEQUENCE_BASE_URL) return value;
  return `${HERO_SEQUENCE_BASE_URL}/${value.replace(/^\/+/, "")}`;
}

export function frameSourceCandidates(frame: HeroFrame) {
  const values = [frame.sources?.avif, frame.sources?.webp, frame.src]
    .filter((value): value is string => Boolean(value))
    .map(resolveHeroAssetUrl);

  return [...new Set(values)];
}

export async function fetchHeroManifest(signal?: AbortSignal): Promise<HeroManifest> {
  const urls = HERO_SEQUENCE_BASE_URL
    ? [HERO_MANIFEST_URL, LOCAL_MANIFEST_URL]
    : [LOCAL_MANIFEST_URL];

  let lastError: unknown;

  for (const url of urls) {
    try {
      const response = await fetch(url, {
        signal,
        cache: HERO_SEQUENCE_BASE_URL && url === HERO_MANIFEST_URL ? "force-cache" : "default",
      });

      if (!response.ok) {
        throw new Error(`Hero manifest request failed with ${response.status}`);
      }

      return (await response.json()) as HeroManifest;
    } catch (error) {
      if (signal?.aborted) throw error;
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Hero frame manifest could not be loaded");
}
