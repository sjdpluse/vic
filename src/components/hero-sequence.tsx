"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { HERO_SEQUENCE_BASE_URL } from "@/lib/hero-assets";

const beats = [
  { at: 0, label: "Existing condition" },
  { at: 0.18, label: "Roof restoration" },
  { at: 0.42, label: "Exterior renewal" },
  { at: 0.62, label: "Render & finish" },
  { at: 0.82, label: "Renewed" },
] as const;

const VIDEO_SRC = "/hero/renovation-scrub.mp4";
const VIDEO_FPS = 24;
const POSTER_SRC = `${HERO_SEQUENCE_BASE_URL}/desktop/avif/frame-0001.avif`;

function beatIndex(progress: number) {
  let active = 0;
  for (let index = 0; index < beats.length; index += 1) {
    if (progress >= beats[index].at) active = index;
  }
  return active;
}

export function HeroSequence() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const previousTimestampRef = useRef<number | null>(null);
  const targetProgressRef = useRef(0);
  const renderedTimeRef = useRef(0);
  const durationRef = useRef(8);
  const [activeBeat, setActiveBeat] = useState(0);
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const configure = () => setReducedMotion(reduceQuery.matches);
    configure();
    reduceQuery.addEventListener("change", configure);
    return () => reduceQuery.removeEventListener("change", configure);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const syncMetadata = () => {
      if (Number.isFinite(video.duration) && video.duration > 0) {
        durationRef.current = video.duration;
      }

      video.pause();
      const endTime = Math.max(0, durationRef.current - 1 / VIDEO_FPS);
      const initialTime = reducedMotion ? endTime : targetProgressRef.current * endTime;
      renderedTimeRef.current = initialTime;
      video.currentTime = initialTime;
    };

    const markReady = () => setVideoReady(true);
    const markFailed = () => setVideoFailed(true);

    video.addEventListener("loadedmetadata", syncMetadata);
    video.addEventListener("loadeddata", markReady);
    video.addEventListener("error", markFailed);
    video.load();

    return () => {
      video.removeEventListener("loadedmetadata", syncMetadata);
      video.removeEventListener("loadeddata", markReady);
      video.removeEventListener("error", markFailed);
    };
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion) {
      setActiveBeat(beats.length - 1);
      const video = videoRef.current;
      if (video && video.readyState >= 1) {
        const endTime = Math.max(0, durationRef.current - 1 / VIDEO_FPS);
        renderedTimeRef.current = endTime;
        video.currentTime = endTime;
      }
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const section = sectionRef.current;
    const stage = stageRef.current;
    const copy = copyRef.current;
    if (!section || !stage || !copy) return;

    let disposed = false;

    const renderLoop = (timestamp: number) => {
      if (disposed) return;

      const video = videoRef.current;
      const previousTimestamp = previousTimestampRef.current ?? timestamp;
      const deltaMs = Math.min(50, Math.max(0, timestamp - previousTimestamp));
      previousTimestampRef.current = timestamp;

      if (video && video.readyState >= 1 && !videoFailed) {
        const endTime = Math.max(0, durationRef.current - 1 / VIDEO_FPS);
        const target = targetProgressRef.current * endTime;
        const current = renderedTimeRef.current;
        const difference = target - current;

        if (Math.abs(difference) > 1 / 240) {
          const response = 1 - Math.exp(-deltaMs / 54);
          const unconstrainedStep = difference * response;
          const maxStep = deltaMs * 0.016;
          const step = Math.max(-maxStep, Math.min(maxStep, unconstrainedStep));
          const next = Math.max(0, Math.min(endTime, current + step));

          renderedTimeRef.current = Math.abs(target - next) < 1 / 240 ? target : next;

          // The production scrub video is all-intra: every source frame is a keyframe.
          // Avoid piling seeks on top of one another; the browser can decode each seek directly.
          if (!video.seeking && Math.abs(video.currentTime - renderedTimeRef.current) >= 1 / 48) {
            video.currentTime = renderedTimeRef.current;
          }
        }
      }

      animationFrameRef.current = window.requestAnimationFrame(renderLoop);
    };

    const updateProgress = (progress: number) => {
      targetProgressRef.current = progress;

      const nextBeat = beatIndex(progress);
      setActiveBeat((current) => (current === nextBeat ? current : nextBeat));

      const rise = gsap.utils.interpolate(8, 48, progress);
      const scale = gsap.utils.interpolate(0.96, 1.015, progress);
      gsap.set(stage, { y: `${rise}svh`, xPercent: -50, scale });

      const copyFade = progress < 0.52 ? 1 : Math.max(0, 1 - (progress - 0.52) / 0.3);
      gsap.set(copy, { y: -progress * 34, opacity: copyFade });
    };

    updateProgress(0);
    animationFrameRef.current = window.requestAnimationFrame(renderLoop);

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      invalidateOnRefresh: true,
      onUpdate: (self) => updateProgress(self.progress),
    });

    return () => {
      disposed = true;
      trigger.kill();
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      previousTimestampRef.current = null;
    };
  }, [reducedMotion, videoFailed]);

  return (
    <section
      className="hero"
      ref={sectionRef}
      aria-labelledby="hero-title"
      style={{
        background:
          "linear-gradient(180deg, #7dafca 0%, #7dafca 52%, #dce6e5 70%, #f5f3ed 82%, #f5f3ed 100%)",
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
        data-renderer="video-scrub"
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
        <img
          className="hero__poster"
          src={POSTER_SRC}
          alt=""
          aria-hidden="true"
          style={{ opacity: videoReady && !videoFailed ? 0 : 1 }}
        />
        <video
          ref={videoRef}
          src={VIDEO_SRC}
          poster={POSTER_SRC}
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
          tabIndex={-1}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
            display: "block",
            width: "100%",
            height: "100%",
            objectFit: "contain",
            opacity: videoReady && !videoFailed ? 1 : 0,
          }}
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
