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
  const queuedRef = useRef(new Set<number>());
  const queueRef = useRef<number[]>([]);
  const runningRef = useRef(0);
  const desiredRef = useRef(0);
  const profileRef = useRef<Profile | null>(null);
  const [manifest, setManifest] = useState<FrameManifest | null>(null);
  const [activeBeat, setActiveBeat] = useState(0);
  const [canvasReady, setCanvasReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [profileName, setProfileName] = useState<"desktop" | "mobile">("desktop");
  const [fallbackSrc, setFallbackSrc] = useState("/frames/desktop/frame-0001.jpg");

  const draw = useCallback((requested: number) => {
    const canvas = canvasRef.current;
    const profile = profileRef.current;
    if (!canvas || !profile) return;

    const index = nearestLoaded(requested, loadedRef.current, profile.frameCount);
    if (index === null) return;

    const image = loadedRef.current.get(index);
    if (!image) return;

    const context = canvas.getContext("2d", { alpha: false });
    if (!context) return;

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    setCanvasReady(true);
  }, []);

  const pumpQueue = useCallback(() => {
    const profile = profileRef.current;
    if (!profile) return;

    while (runningRef.current < 4 && queueRef.current.length > 0) {
      const index = queueRef.current.shift();
      if (index === undefined || loadedRef.current.has(index)) continue;

      runningRef.current += 1;
      const image = new Image();
      image.decoding = "async";
      image.src = profile.frames[index].src;
      image.onload = () => {
        loadedRef.current.set(index, image);
        runningRef.current -= 1;
        if (Math.abs(index - desiredRef.current) <= 1 || loadedRef.current.size === 1) {
          draw(desiredRef.current);
        }
        pumpQueue();
      };
      image.onerror = () => {
        runningRef.current -= 1;
        pumpQueue();
      };
    }
  }, [draw]);

  const enqueue = useCallback(
    (index: number) => {
      const profile = profileRef.current;
      if (!profile || index < 0 || index >= profile.frameCount) return;
      if (loadedRef.current.has(index) || queuedRef.current.has(index)) return;
      queuedRef.current.add(index);
      queueRef.current.push(index);
      pumpQueue();
    },
    [pumpQueue],
  );

  const preloadAround = useCallback(
    (index: number) => {
      const profile = profileRef.current;
      if (!profile) return;
      enqueue(index);
      for (let distance = 1; distance <= profile.preloadRadius; distance += 1) {
        enqueue(index + distance);
        enqueue(index - distance);
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

      setProfileName(nextProfileName);
      setReducedMotion(reduceQuery.matches);
      setFallbackSrc(
        reduceQuery.matches
          ? profile.frames[profile.frameCount - 1].src
          : profile.frames[0].src,
      );

      loadedRef.current.clear();
      queuedRef.current.clear();
      queueRef.current = [];
      runningRef.current = 0;
      profileRef.current = profile;
      desiredRef.current = reduceQuery.matches ? profile.frameCount - 1 : 0;
      enqueue(desiredRef.current);
      enqueue(profile.frameCount - 1);
      preloadAround(desiredRef.current);
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

      const requested = Math.round(progress * (profile.frameCount - 1));
      desiredRef.current = requested;
      preloadAround(requested);
      draw(requested);

      const nextBeat = beatIndex(progress);
      setActiveBeat((current) => (current === nextBeat ? current : nextBeat));

      // Normal document scroll already moves the hero upward. Counterbalancing
      // part of that travel keeps the renewed house in-frame until the content
      // handoff, while the net screen-space motion still rises substantially.
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
      scrub: true,
      invalidateOnRefresh: true,
      onUpdate: (self) => updateProgress(self.progress),
    });

    const scheduleBackgroundPreload = () => {
      const profile = profileRef.current;
      if (!profile) return;
      for (let index = 0; index < profile.frameCount; index += 1) enqueue(index);
    };

    const idleId = window.requestIdleCallback
      ? window.requestIdleCallback(scheduleBackgroundPreload, { timeout: 1800 })
      : window.setTimeout(scheduleBackgroundPreload, 900);

    return () => {
      trigger.kill();
      if (typeof idleId === "number") {
        if (window.cancelIdleCallback) window.cancelIdleCallback(idleId);
        else window.clearTimeout(idleId);
      }
    };
  }, [draw, enqueue, manifest, preloadAround, reducedMotion]);

  return (
    <section className="hero" ref={sectionRef} aria-labelledby="hero-title">
      <header className="site-header">
        <a className="wordmark" href="#hero-title" aria-label="VIC Premier Construction Team home">
          <span>VIC PREMIER</span>
          <small>CONSTRUCTION TEAM</small>
        </a>
        <nav aria-label="Primary prototype navigation">
          <a href="#capabilities">Services</a>
          <a href="#consultation">Consultation</a>
        </nav>
        <a className="icon-cta" href="#consultation">
          <span>Request a quote</span>
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
          A cinematic study of an existing property moving toward a clean renewed finish.
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
