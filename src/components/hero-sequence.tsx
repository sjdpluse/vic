"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  fetchHeroManifest,
  frameSourceCandidates,
  type HeroManifest,
  type HeroProfile,
} from "@/lib/hero-assets";

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

function frameCacheKey(profile: HeroProfile, index: number) {
  return frameSourceCandidates(profile.frames[index]).join("|");
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
  const concurrencyRef = useRef(8);
  const generationRef = useRef(0);
  const desiredPositionRef = useRef(0);
  const renderedPositionRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const previousTimestampRef = useRef<number | null>(null);
  const lastDrawnIndexRef = useRef<number | null>(null);
  const canvasReadyRef = useRef(false);
  const profileRef = useRef<HeroProfile | null>(null);
  const [manifest, setManifest] = useState<HeroManifest | null>(null);
  const [canvasReady, setCanvasReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [profileName, setProfileName] = useState<"desktop" | "mobile">("desktop");
  const [fallbackSrc, setFallbackSrc] = useState("/frames/desktop/frame-0001.jpg");
  const [menuOpen, setMenuOpen] = useState(false);
  const [headerHidden, setHeaderHidden] = useState(false);

  const drawPosition = useCallback((position: number) => {
    const canvas = canvasRef.current;
    const profile = profileRef.current;
    if (!canvas || !profile) return;

    const context = canvas.getContext("2d", { alpha: false });
    if (!context) return;

    const requested = Math.max(0, Math.min(profile.frameCount - 1, Math.round(position)));
    const index = nearestLoaded(requested, loadedRef.current, profile.frameCount);
    if (index === null || index === lastDrawnIndexRef.current) return;

    const image = loadedRef.current.get(index);
    if (!image) return;

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.globalAlpha = 1;
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    lastDrawnIndexRef.current = index;

    if (!canvasReadyRef.current) {
      canvasReadyRef.current = true;
      setCanvasReady(true);
    }
  }, []);

  const pumpQueue = useCallback(() => {
    const activeProfile = profileRef.current;
    const activeGeneration = generationRef.current;
    if (!activeProfile) return;

    while (runningRef.current < concurrencyRef.current && queueRef.current.length > 0) {
      const index = queueRef.current.shift();
      if (index === undefined || loadedRef.current.has(index)) continue;

      const candidates = frameSourceCandidates(activeProfile.frames[index]);
      const cacheKey = frameCacheKey(activeProfile, index);
      const reusedImage = loadedBySrcRef.current.get(cacheKey);

      if (reusedImage) {
        loadedRef.current.set(index, reusedImage);
        queuedRef.current.delete(index);
        drawPosition(renderedPositionRef.current);
        continue;
      }

      if (candidates.length === 0) {
        queuedRef.current.delete(index);
        continue;
      }

      runningRef.current += 1;
      let candidateIndex = 0;
      const image = new Image();
      image.decoding = "async";

      const finishCurrentRequest = () => {
        runningRef.current = Math.max(0, runningRef.current - 1);
        pumpQueue();
      };

      const commitLoadedImage = () => {
        if (
          generationRef.current !== activeGeneration ||
          profileRef.current !== activeProfile
        ) {
          finishCurrentRequest();
          return;
        }

        loadedBySrcRef.current.set(cacheKey, image);

        for (let frameIndex = 0; frameIndex < activeProfile.frames.length; frameIndex += 1) {
          if (frameCacheKey(activeProfile, frameIndex) === cacheKey) {
            loadedRef.current.set(frameIndex, image);
            queuedRef.current.delete(frameIndex);
          }
        }

        finishCurrentRequest();
        drawPosition(renderedPositionRef.current);
      };

      const loadCandidate = () => {
        image.src = candidates[candidateIndex];
      };

      image.onload = () => {
        image
          .decode()
          .catch(() => undefined)
          .finally(commitLoadedImage);
      };

      image.onerror = () => {
        candidateIndex += 1;
        if (candidateIndex < candidates.length) {
          loadCandidate();
          return;
        }

        queuedRef.current.delete(index);
        finishCurrentRequest();
      };

      loadCandidate();
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

      const center = Math.round(position);
      const radius = Math.max(profile.preloadRadius, 18);
      enqueue(center, true);

      for (let distance = 1; distance <= radius; distance += 1) {
        enqueue(center + distance, distance <= 10);
        enqueue(center - distance, distance <= 10);
      }
    },
    [enqueue],
  );

  const preloadCorridor = useCallback(
    (from: number, to: number) => {
      const profile = profileRef.current;
      if (!profile) return;

      const start = Math.round(from);
      const end = Math.round(to);
      const direction = end >= start ? 1 : -1;
      const distance = Math.abs(end - start);
      const limit = Math.min(distance, 48);

      for (let step = 0; step <= limit; step += 1) {
        enqueue(start + step * direction, true);
      }

      preloadAround(to);
    },
    [enqueue, preloadAround],
  );

  useEffect(() => {
    const controller = new AbortController();

    fetchHeroManifest(controller.signal)
      .then(setManifest)
      .catch(() => {
        // Stable poster remains visible; the rest of the page stays usable.
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  useEffect(() => {
    let previousY = window.scrollY;
    let accumulatedDelta = 0;
    let ticking = false;

    const updateHeader = () => {
      const currentY = window.scrollY;
      const delta = currentY - previousY;

      if (currentY <= 20) {
        setHeaderHidden(false);
        accumulatedDelta = 0;
      } else if (delta !== 0) {
        if (Math.sign(delta) !== Math.sign(accumulatedDelta)) accumulatedDelta = 0;
        accumulatedDelta += delta;

        if (accumulatedDelta >= 10) {
          // Google Labs interaction: scrolling down hides the fixed navigation.
          setHeaderHidden(true);
          accumulatedDelta = 0;
        } else if (accumulatedDelta <= -10) {
          // Reversing upward reveals it again.
          setHeaderHidden(false);
          accumulatedDelta = 0;
        }
      }

      previousY = currentY;
      ticking = false;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(updateHeader);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!manifest) return;

    const mobileQuery = window.matchMedia("(max-width: 767px)");
    const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const configure = () => {
      generationRef.current += 1;
      const nextProfileName = mobileQuery.matches ? "mobile" : "desktop";
      const profile = manifest.profiles[nextProfileName];
      const initialPosition = reduceQuery.matches ? profile.frameCount - 1 : 0;
      const initialFrame = profile.frames[Math.round(initialPosition)];
      const posterCandidate = initialFrame
        ? frameSourceCandidates(initialFrame)[0]
        : undefined;

      setProfileName(nextProfileName);
      setReducedMotion(reduceQuery.matches);
      if (posterCandidate) setFallbackSrc(posterCandidate);

      loadedRef.current.clear();
      loadedBySrcRef.current.clear();
      queuedRef.current.clear();
      queueRef.current = [];
      runningRef.current = 0;
      concurrencyRef.current = nextProfileName === "mobile" ? 7 : 10;
      profileRef.current = profile;
      desiredPositionRef.current = initialPosition;
      renderedPositionRef.current = initialPosition;
      previousTimestampRef.current = null;
      lastDrawnIndexRef.current = null;
      canvasReadyRef.current = false;
      setCanvasReady(false);

      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = nextProfileName === "mobile" ? 800 : 1280;
        canvas.height = nextProfileName === "mobile" ? 450 : 720;
      }

      enqueue(Math.round(initialPosition), true);
      enqueue(profile.frameCount - 1, true);
      preloadAround(initialPosition);
    };

    configure();
    mobileQuery.addEventListener("change", configure);
    reduceQuery.addEventListener("change", configure);

    return () => {
      generationRef.current += 1;
      mobileQuery.removeEventListener("change", configure);
      reduceQuery.removeEventListener("change", configure);
    };
  }, [enqueue, manifest, preloadAround]);

  useEffect(() => {
    if (!manifest || !profileRef.current || reducedMotion) return;

    gsap.registerPlugin(ScrollTrigger);

    const section = sectionRef.current;
    const stage = stageRef.current;
    const copy = copyRef.current;
    if (!section || !stage || !copy) return;

    let disposed = false;

    const renderLoop = (timestamp: number) => {
      if (disposed) return;

      const profile = profileRef.current;
      if (profile) {
        const previousTimestamp = previousTimestampRef.current ?? timestamp;
        const deltaMs = Math.min(34, Math.max(0, timestamp - previousTimestamp));
        previousTimestampRef.current = timestamp;

        const current = renderedPositionRef.current;
        const target = desiredPositionRef.current;
        const difference = target - current;

        if (Math.abs(difference) > 0.01) {
          const response = 1 - Math.exp(-deltaMs / 92);
          const easedStep = difference * response;
          const maxFramesPerSecond = profileName === "mobile" ? 52 : 62;
          const maxStep = (deltaMs / 1000) * maxFramesPerSecond;
          const step = Math.max(-maxStep, Math.min(maxStep, easedStep));
          const next = Math.max(0, Math.min(profile.frameCount - 1, current + step));

          renderedPositionRef.current = Math.abs(target - next) < 0.04 ? target : next;
          preloadCorridor(current, target);
          drawPosition(renderedPositionRef.current);
        } else {
          renderedPositionRef.current = target;
          drawPosition(target);
        }
      }

      animationFrameRef.current = window.requestAnimationFrame(renderLoop);
    };

    animationFrameRef.current = window.requestAnimationFrame(renderLoop);

    const updateProgress = (progress: number) => {
      const profile = profileRef.current;
      if (!profile) return;

      const position = progress * (profile.frameCount - 1);
      desiredPositionRef.current = position;
      preloadCorridor(renderedPositionRef.current, position);

      // Keep the current eased frame playback, but let the house physically travel
      // upward through the viewport as the renovation completes.
      const stageStartY = profileName === "mobile" ? 7 : 14;
      const stageEndY = profileName === "mobile" ? -38 : -26;
      const rise = gsap.utils.interpolate(stageStartY, stageEndY, progress);
      const scale = gsap.utils.interpolate(0.96, profileName === "mobile" ? 1.035 : 1.02, progress);
      gsap.set(stage, { y: `${rise}svh`, xPercent: -50, scale });

      // The headline stays visible and above the moving house for the full sequence.
      gsap.set(copy, { y: 0, opacity: 1 });
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

    const preloadDelay = profileName === "mobile" ? 300 : 120;
    const idleId = window.requestIdleCallback
      ? window.requestIdleCallback(scheduleBackgroundPreload, { timeout: 650 })
      : window.setTimeout(scheduleBackgroundPreload, preloadDelay);

    return () => {
      disposed = true;
      trigger.kill();
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (typeof idleId === "number") {
        if (window.cancelIdleCallback) window.cancelIdleCallback(idleId);
        else window.clearTimeout(idleId);
      }
    };
  }, [drawPosition, enqueue, manifest, preloadCorridor, profileName, reducedMotion]);

  // Page travel and frame playback are intentionally decoupled: the shorter track lets
  // the document move at a more natural pace while the rAF renderer keeps the same
  // bounded frame velocity and easing as the smoother version.
  const scrollTrackHeight = reducedMotion
    ? "112svh"
    : profileName === "mobile"
      ? "520svh"
      : "440svh";

  return (
    <section
      className="hero"
      ref={sectionRef}
      aria-labelledby="hero-title"
      style={{
        height: scrollTrackHeight,
        minHeight: 0,
        overflow: "visible",
        background: "#f5f3ed",
      }}
    >
      <header className={headerHidden ? "site-header site-header--hidden" : "site-header"}>
        <div className="header__blur" aria-hidden="true">
          <span className="header__blur-layer header__blur-layer--1" />
          <span className="header__blur-layer header__blur-layer--2" />
          <span className="header__blur-layer header__blur-layer--3" />
          <span className="header__blur-layer header__blur-layer--4" />
          <span className="header__blur-layer header__blur-layer--5" />
        </div>
        <a className="wordmark" href="#hero-title" aria-label="VIC Premier Construction Team home">
          <span>VIC PREMIER</span>
          <small>CONSTRUCTION TEAM</small>
        </a>
        <nav className="desktop-nav" aria-label="Primary navigation">
          <a href="#about">About</a>
          <a href="#services">Services</a>
          <a href="#selected-work">Selected Work</a>
          <a href="#process">Process</a>
        </nav>
        <div className="header-actions">
          <a className="header-quote-link" href="#consultation">
            <span>Free Quote</span>
            <span aria-hidden="true">↗</span>
          </a>
          <button
            className="menu-toggle"
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </button>
        </div>
      </header>

      <div
        id="mobile-navigation"
        className={menuOpen ? "mobile-nav mobile-nav--open" : "mobile-nav"}
        aria-hidden={!menuOpen}
      >
        <nav aria-label="Mobile navigation">
          <a href="#about" onClick={() => setMenuOpen(false)}><span>01</span>About</a>
          <a href="#services" onClick={() => setMenuOpen(false)}><span>02</span>Services</a>
          <a href="#selected-work" onClick={() => setMenuOpen(false)}><span>03</span>Selected Work</a>
          <a href="#process" onClick={() => setMenuOpen(false)}><span>04</span>Process</a>
        </nav>
        <a className="mobile-nav__quote" href="#consultation" onClick={() => setMenuOpen(false)}>
          Request a Free Quote <span aria-hidden="true">↗</span>
        </a>
      </div>

      <div
        className="hero__viewport"
        style={{
          position: reducedMotion ? "relative" : "sticky",
          top: 0,
          height: reducedMotion ? "112svh" : "100svh",
          overflow: "clip",
          isolation: "isolate",
          transform: "translateZ(0)",
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
          background:
            "linear-gradient(180deg, #7dafca 0%, #7dafca 52%, #dce6e5 70%, #f5f3ed 82%, #f5f3ed 100%)",
        }}
      >
        <div className="hero__copy" ref={copyRef}>
          <h1 id="hero-title" aria-label="We Shape Your Vision">
            <span className="hero__title-line hero__title-line--sans">
              <span>We Shape</span>
            </span>{" "}
            <span className="hero__title-line hero__title-line--serif">
              <em>Your Vision</em>
            </span>
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
          data-renderer="image-sequence"
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
      </div>
    </section>
  );
}
