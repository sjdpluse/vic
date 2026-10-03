"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

type Frame = {
  index: number;
  src: string;
  sourceFrame: number;
  sourceOrdinal: number;
};

type Profile = {
  frameCount: number;
  preloadRadius: number;
  frames: Frame[];
};

type FrameManifest = {
  source: {
    dimensions: { width: number; height: number };
  };
  profiles: {
    desktop: Profile;
    mobile: Profile;
  };
};

const beats = [
  { at: 0, label: "Existing condition" },
  { at: 0.18, label: "Roof restoration" },
  { at: 0.42, label: "Exterior renewal" },
  { at: 0.62, label: "Render & finish" },
  { at: 0.82, label: "Renewed" },
] as const;

function beatIndex(progress: number) {
  let active = 0;
  for (let index = 0; index < beats.length; index += 1) {
    if (progress >= beats[index].at) active = index;
  }
  return active;
}

function nearestLoaded(
  requested: number,
  loaded: Map<number, HTMLImageElement>,
  frameCount: number,
) {
  if (loaded.has(requested)) return requested;

  for (let distance = 1; distance < frameCount; distance += 1) {
    const before = requested - distance;
    const after = requested + distance;
    if (before >= 0 && loaded.has(before)) return before;
    if (after < frameCount && loaded.has(after)) return after;
  }

  return null;
}

export function HeroSequence() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loadedRef = useRef(new Map<number, HTMLImageElement>());
  const loadedBySrcRef = useRef(new Map<string, HTMLImageElement>());
  const queuedRef = useRef(new Set<number>());
  const queueRef = useRef<number[]>([]);
  const runningRef = useRef(0);
  const desiredRef = useRef(0);
  const desiredPositionRef = useRef(0);
  const profileRef = useRef<Profile | null>(null);
  const [manifest, setManifest] = useState<FrameManifest | null>(null);
  const [activeBeat, setActiveBeat] = useState(0);
  const [canvasReady, setCanvasReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [profileName, setProfileName] = useState<"desktop" | "mobile">("desktop");
  const [fallbackSrc, setFallbackSrc] = useState("/frames/desktop/frame-0001.jpg");

  const drawPosition = useCallback((position: number) => {
    const canvas = canvasRef.current;
    const profile = profileRef.current;
    if (!canvas || !profile) return;

    const context = canvas.getContext("2d", { alpha: false });
    if (!context) return;

    const lower = Math.max(0, Math.floor(position));
    const upper = Math.min(profile.frameCount - 1, Math.ceil(position));
    const fraction = position - lower;
    const lowerImage = loadedRef.current.get(lower);
    const upperImage = loadedRef.current.get(upper);

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";

    if (lowerImage && upperImage && lower !== upper) {
      context.globalAlpha = 1;
      context.drawImage(lowerImage, 0, 0, canvas.width, canvas.height);
      context.globalAlpha = fraction;
      context.drawImage(upperImage, 0, 0, canvas.width, canvas.height);
      context.globalAlpha = 1;
      setCanvasReady(true);
      return;
    }

    const requested = Math.round(position);
    const index = nearestLoaded(requested, loadedRef.current, profile.frameCount);
    if (index === null) return;

    const image = loadedRef.current.get(index);
    if (!image) return;

    context.globalAlpha = 1;
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    setCanvasReady(true);
  }, []);

  const pumpQueue = useCallback(() => {
    const profile = profileRef.current;
    if (!profile) return;

    while (runningRef.current < 6 && queueRef.current.length > 0) {
      const index = queueRef.current.shift();
      if (index === undefined || loadedRef.current.has(index)) continue;

      const src = profile.frames[index].src;
      const reusedImage = loadedBySrcRef.current.get(src);
      if (reusedImage) {
        loadedRef.current.set(index, reusedImage);
        drawPosition(desiredPositionRef.current);
        continue;
      }

      runningRef.current += 1;
      const image = new Image();
      image.decoding = "async";
      image.src = src;
      image.onload = () => {
        loadedBySrcRef.current.set(src, image);

        for (let frameIndex = 0; frameIndex < profile.frames.length; frameIndex += 1) {
          if (profile.frames[frameIndex].src === src) {
            loadedRef.current.set(frameIndex, image);
          }
        }

        runningRef.current -= 1;
        drawPosition(desiredPositionRef.current);
        pumpQueue();
      };
      image.onerror = () => {
        runningRef.current -= 1;
        pumpQueue();
      };
    }
  }, [drawPosition]);

  const enqueue = useCallback(
    (index: number, priority = false) => {
      const profile = profileRef.current;
      if (!profile || index < 0 || index >= profile.frameCount) return;
      if (loadedRef.current.has(index) || queuedRef.current.has(index)) return;
      queuedRef.current.add(index);
      if (priority) queueRef.current.unshift(index);
      else queueRef.current.push(index);
      pumpQueue();
    },
    [pumpQueue],
  );

  const preloadAround = useCallback(
    (position: number) => {
      const profile = profileRef.current;
      if (!profile) return;

      const lower = Math.floor(position);
      const upper = Math.ceil(position);
      enqueue(lower, true);
      enqueue(upper, true);

      const center = Math.round(position);
      for (let distance = 1; distance <= profile.preloadRadius; distance += 1) {
        enqueue(center + distance, distance <= 3);
        enqueue(center - distance, distance <= 3);
      }
    },
    [enqueue],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadManifest() {
      const response = await fetch("/frames/manifest.json");
      if (!response.ok) throw new Error("Hero frame manifest could not be loaded");
      const nextManifest = (await response.json()) as FrameManifest;
      if (cancelled) return;
      setManifest(nextManifest);
    }

    loadManifest().catch(() => {
      // Poster fallback remains visible; the rest of the page stays usable.
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!manifest) return;

    const mobileQuery = window.matchMedia("(max-width: 767px)");
    const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const configure = () => {
      const nextProfileName = mobileQuery.matches ? "mobile" : "desktop";
      const profile = manifest.profiles[nextProfileName];
      const initialPosition = reduceQuery.matches ? profile.frameCount - 1 : 0;

      setProfileName(nextProfileName);
      setReducedMotion(reduceQuery.matches);
      setFallbackSrc(
        reduceQuery.matches
          ? profile.frames[profile.frameCount - 1].src
          : profile.frames[0].src,
      );

      loadedRef.current.clear();
      loadedBySrcRef.current.clear();
      queuedRef.current.clear();
      queueRef.current = [];
      runningRef.current = 0;
      profileRef.current = profile;
      desiredRef.current = Math.round(initialPosition);
      desiredPositionRef.current = initialPosition;
      enqueue(desiredRef.current, true);
      enqueue(profile.frameCount - 1, true);
      preloadAround(initialPosition);
    };

    configure();
    mobileQuery.addEventListener("change", configure);
    reduceQuery.addEventListener("change", configure);

    return () => {
      mobileQuery.removeEventListener("change", configure);
      reduceQuery.removeEventListener("change", configure);
    };
  }, [enqueue, manifest, preloadAround]);

  useEffect(() => {
    if (!manifest || !profileRef.current || reducedMotion) {
      if (reducedMotion) setActiveBeat(beats.length - 1);
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const section = sectionRef.current;
    const stage = stageRef.current;
    const copy = copyRef.current;
    if (!section || !stage || !copy) return;

    const updateProgress = (progress: number) => {
      const profile = profileRef.current;
      if (!profile) return;

      const position = progress * (profile.frameCount - 1);
      const requested = Math.round(position);
      desiredRef.current = requested;
      desiredPositionRef.current = position;
      preloadAround(position);
      drawPosition(position);

      const nextBeat = beatIndex(progress);
      setActiveBeat((current) => (current === nextBeat ? current : nextBeat));

      const rise = gsap.utils.interpolate(8, 48, progress);
      const scale = gsap.utils.interpolate(0.96, 1.015, progress);
      gsap.set(stage, { y: `${rise}svh`, xPercent: -50, scale });

      const copyFade = progress < 0.52 ? 1 : Math.max(0, 1 - (progress - 0.52) / 0.3);
      gsap.set(copy, { y: -progress * 34, opacity: copyFade });
    };

    updateProgress(0);

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.18,
      invalidateOnRefresh: true,
      onUpdate: (self) => updateProgress(self.progress),
    });

    const scheduleBackgroundPreload = () => {
      const profile = profileRef.current;
      if (!profile) return;
      for (let index = 0; index < profile.frameCount; index += 1) enqueue(index);
    };

    const idleId = window.requestIdleCallback
      ? window.requestIdleCallback(scheduleBackgroundPreload, { timeout: 1200 })
      : window.setTimeout(scheduleBackgroundPreload, 500);

    return () => {
      trigger.kill();
      if (typeof idleId === "number") {
        if (window.cancelIdleCallback) window.cancelIdleCallback(idleId);
        else window.clearTimeout(idleId);
      }
    };
  }, [drawPosition, enqueue, manifest, preloadAround, reducedMotion]);

  return (
    <section
      className="hero"
      ref={sectionRef}
      aria-labelledby="hero-title"
      style={{
        background:
          "linear-gradient(180deg, #7dafca 0%, #a9d2ee 25%, #dce9ea 45%, #f5f3ed 68%, #f5f3ed 100%)",
      }}
    >
      <header className="site-header">
        <a className="wordmark" href="#hero-title" aria-label="VIC Premier Construction Team home">
          <span>VIC PREMIER</span>
          <small>CONSTRUCTION TEAM</small>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#about">About</a>
          <a href="#services">Services</a>
          <a href="#projects">Projects</a>
          <a href="#process">Process</a>
        </nav>
        <a className="icon-cta" href="#consultation">
          <span>Free quote</span>
          <span aria-hidden="true">↗</span>
        </a>
      </header>

      <div className="hero__copy" ref={copyRef}>
        <p className="hero__kicker">Melbourne · Construction & renovation</p>
        <h1 id="hero-title">
          Build. Renovate.
          <br />
          <em>Restore.</em>
        </h1>
        <p className="hero__lede">
          Residential and commercial work shaped around the property, the scope and the finish.
        </p>
        <a className="hero__cta" href="#consultation">
          Request a free quote <span aria-hidden="true">↗</span>
        </a>
      </div>

      <div
        className="hero__stage"
        ref={stageRef}
        data-profile={profileName}
        style={{
          top: "18svh",
          width: "104vw",
          maxWidth: "none",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, black 8%, black 84%, transparent 100%)",
          maskImage:
            "linear-gradient(to bottom, transparent 0%, black 8%, black 84%, transparent 100%)",
        }}
      >
        <img className="hero__poster" src={fallbackSrc} alt="" aria-hidden="true" />
        <canvas
          className={canvasReady ? "hero__canvas hero__canvas--ready" : "hero__canvas"}
          ref={canvasRef}
          width={1280}
          height={720}
          aria-hidden="true"
        />
      </div>

      <div className="hero__beat" aria-hidden="true">
        <span className="hero__beat-index">0{activeBeat + 1}</span>
        <span className="hero__beat-rule" />
        <span key={activeBeat} className="hero__beat-label">
          {beats[activeBeat].label}
        </span>
      </div>

      <div className="hero__scroll-note" aria-hidden="true">
        <span>Scroll to renovate</span>
        <i />
      </div>
    </section>
  );
}
