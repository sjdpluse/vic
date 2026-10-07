"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import styles from "./selected-work-carousel.module.css";

export type SelectedWorkCard = {
  id: string;
  title: string;
  beforeSrc: string;
  afterSrc: string;
  beforeAlt: string;
  afterAlt: string;
};

type SelectedWorkCarouselProps = {
  cards: SelectedWorkCard[];
};

type Direction = "prev" | "next";
type ComparisonPhase = "before" | "transition" | "after" | "returning" | "split" | "manual";

const MOTION_DURATION = 1300;
const MOTION_STAGGER = 50;
const MOTION_EASING = "cubic-bezier(0.65, 0, 0, 1)";
const MOTION_FAILSAFE = 250;
const DRAG_THRESHOLD = 5;

const BEFORE_HOLD = 650;
const REVEAL_DURATION = 1250;
const AFTER_HOLD = 420;
const CENTER_DURATION = 820;
const BETWEEN_CARDS = 260;

function Arrow({ next = false }: { next?: boolean }) {
  return (
    <svg viewBox="0 0 60 60" fill="none" aria-hidden="true" className={next ? styles.nextArrow : undefined}>
      <path d="M26 30L32.7845 23L34 24.2542L28.4311 30L34 35.7458L32.7845 37L26 30Z" fill="currentColor" />
    </svg>
  );
}

function CompareHandleIcon() {
  return (
    <svg viewBox="0 0 44 24" fill="none" aria-hidden="true">
      <path d="M17 7L11 12L17 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M27 7L33 12L27 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function easeInOut(value: number) {
  return value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

export function SelectedWorkCarousel({ cards }: SelectedWorkCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const handleRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const animationsRef = useRef<Animation[]>([]);
  const commitTimerRef = useRef<number | null>(null);
  const comparisonTimerRef = useRef<number | null>(null);
  const comparisonFrameRef = useRef<number | null>(null);
  const comparisonRunRef = useRef(0);
  const splitValuesRef = useRef<number[]>(cards.map(() => 0));
  const animatingRef = useRef(false);
  const dragRef = useRef({ pointerId: null as number | null, startX: 0, startScroll: 0, moved: false });
  const compareDragRef = useRef({ pointerId: null as number | null, cardIndex: -1 });

  const [isAnimating, setIsAnimating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isAtStart, setIsAtStart] = useState(true);
  const [isAtEnd, setIsAtEnd] = useState(false);
  const [comparisonDraggingIndex, setComparisonDraggingIndex] = useState<number | null>(null);
  const [phases, setPhases] = useState<ComparisonPhase[]>(() => cards.map(() => "before"));

  function cardElements() {
    return cardRefs.current.filter((card): card is HTMLElement => Boolean(card));
  }

  function reducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function setPhase(index: number, phase: ComparisonPhase) {
    setPhases((current) => {
      if (current[index] === phase) return current;
      const next = [...current];
      next[index] = phase;
      return next;
    });
  }

  function applySplit(index: number, value: number) {
    const card = cardRefs.current[index];
    if (!card) return;

    const split = Math.max(0, Math.min(100, value));
    splitValuesRef.current[index] = split;

    card.style.setProperty("--split", `${split}%`);
    card.style.setProperty("--after-label-x", `${split / 2}%`);
    card.style.setProperty("--before-label-x", `${split + (100 - split) / 2}%`);

    const handle = handleRefs.current[index];
    if (handle) handle.setAttribute("aria-valuenow", String(Math.round(split)));
  }

  function stopComparisonSequence() {
    comparisonRunRef.current += 1;

    if (comparisonFrameRef.current !== null) {
      window.cancelAnimationFrame(comparisonFrameRef.current);
      comparisonFrameRef.current = null;
    }

    if (comparisonTimerRef.current !== null) {
      window.clearTimeout(comparisonTimerRef.current);
      comparisonTimerRef.current = null;
    }
  }

  function waitFor(ms: number, token: number) {
    return new Promise<boolean>((resolve) => {
      comparisonTimerRef.current = window.setTimeout(() => {
        comparisonTimerRef.current = null;
        resolve(token === comparisonRunRef.current);
      }, ms);
    });
  }

  function animateSplit(index: number, from: number, to: number, duration: number, token: number) {
    return new Promise<boolean>((resolve) => {
      if (token !== comparisonRunRef.current) {
        resolve(false);
        return;
      }

      if (reducedMotion()) {
        applySplit(index, to);
        resolve(true);
        return;
      }

      const startedAt = performance.now();

      const frame = (now: number) => {
        if (token !== comparisonRunRef.current) {
          comparisonFrameRef.current = null;
          resolve(false);
          return;
        }

        const progress = Math.min(1, (now - startedAt) / duration);
        const eased = easeInOut(progress);
        applySplit(index, from + (to - from) * eased);

        if (progress >= 1) {
          comparisonFrameRef.current = null;
          resolve(true);
          return;
        }

        comparisonFrameRef.current = window.requestAnimationFrame(frame);
      };

      comparisonFrameRef.current = window.requestAnimationFrame(frame);
    });
  }

  function visibleCardIndexes() {
    const track = trackRef.current;
    if (!track) return [] as number[];

    const trackRect = track.getBoundingClientRect();

    return cardRefs.current
      .map((card, index) => {
        if (!card) return null;
        const rect = card.getBoundingClientRect();
        const visibleWidth = Math.min(rect.right, trackRect.right) - Math.max(rect.left, trackRect.left);
        if (visibleWidth <= Math.min(48, rect.width * 0.15)) return null;
        return { index, left: rect.left };
      })
      .filter((item): item is { index: number; left: number } => Boolean(item))
      .sort((a, b) => a.left - b.left)
      .map((item) => item.index);
  }

  function restartVisibleComparisons() {
    stopComparisonSequence();
    const token = comparisonRunRef.current;
    const visible = visibleCardIndexes();
    if (!visible.length) return;

    visible.forEach((index) => {
      applySplit(index, 0);
      setPhase(index, "before");
    });

    if (reducedMotion()) {
      visible.forEach((index) => {
        applySplit(index, 50);
        setPhase(index, "split");
      });
      return;
    }

    void (async () => {
      for (const index of visible) {
        if (token !== comparisonRunRef.current) return;

        setPhase(index, "before");
        if (!(await waitFor(BEFORE_HOLD, token))) return;

        setPhase(index, "transition");
        if (!(await animateSplit(index, 0, 100, REVEAL_DURATION, token))) return;

        setPhase(index, "after");
        if (!(await waitFor(AFTER_HOLD, token))) return;

        setPhase(index, "returning");
        if (!(await animateSplit(index, 100, 50, CENTER_DURATION, token))) return;

        setPhase(index, "split");
        if (!(await waitFor(BETWEEN_CARDS, token))) return;
      }
    })();
  }

  function cancelActiveAnimations() {
    animationsRef.current.forEach((animation) => animation.cancel());
    cardElements().forEach((card) => {
      card.style.willChange = "";
    });
    animationsRef.current = [];
  }

  function checkScrollState() {
    const track = trackRef.current;
    if (!track) return;
    setIsAtStart(track.scrollLeft <= 1);
    setIsAtEnd(Math.ceil(track.scrollLeft + track.clientWidth) >= track.scrollWidth - 1);
  }

  function scheduleComparisonReplay(delay = 180) {
    window.setTimeout(() => restartVisibleComparisons(), delay);
  }

  function snapPositions(currentScroll: number) {
    const track = trackRef.current;
    if (!track) return [] as number[];
    const elements = cardElements();
    if (!elements.length) return [] as number[];

    const trackRect = track.getBoundingClientRect();
    const scrollPadding = Number.parseFloat(getComputedStyle(track).scrollPaddingLeft) || 0;
    const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);

    return elements
      .map((card) => {
        const left = card.getBoundingClientRect().left - trackRect.left + currentScroll;
        return Math.max(0, Math.min(maxScroll, left - scrollPadding));
      })
      .concat(maxScroll);
  }

  function findAdjacentSnap(currentScroll: number, direction: Direction) {
    const positions = snapPositions(currentScroll);
    const tolerance = 0.5;
    if (!positions.length) return currentScroll;

    if (direction === "next") {
      let next = Number.POSITIVE_INFINITY;
      positions.forEach((position) => {
        if (position > currentScroll + tolerance && position < next) next = position;
      });
      return next === Number.POSITIVE_INFINITY ? currentScroll : next;
    }

    let previous = Number.NEGATIVE_INFINITY;
    positions.forEach((position) => {
      if (position < currentScroll - tolerance && position > previous) previous = position;
    });
    return previous === Number.NEGATIVE_INFINITY ? currentScroll : previous;
  }

  function findNearestSnap(currentScroll: number) {
    const positions = snapPositions(currentScroll);
    if (!positions.length) return currentScroll;
    let nearest = positions[0];
    let distance = Math.abs(nearest - currentScroll);
    positions.forEach((position) => {
      const nextDistance = Math.abs(position - currentScroll);
      if (nextDistance < distance) {
        nearest = position;
        distance = nextDistance;
      }
    });
    return nearest;
  }

  function getCardsForStep(delta: number) {
    const track = trackRef.current;
    if (!track) return [] as HTMLElement[];
    const trackRect = track.getBoundingClientRect();
    const left = delta < 0 ? trackRect.left + delta : trackRect.left;
    const right = delta > 0 ? trackRect.right + delta : trackRect.right;

    return cardElements().filter((card) => {
      const rect = card.getBoundingClientRect();
      return rect.right > left + 1 && rect.left < right - 1;
    });
  }

  function commitStep(targetScroll: number) {
    const track = trackRef.current;
    if (!track || !animationsRef.current.length) return;

    if (commitTimerRef.current !== null) {
      window.clearTimeout(commitTimerRef.current);
      commitTimerRef.current = null;
    }

    track.scrollLeft = targetScroll;
    cancelActiveAnimations();
    window.requestAnimationFrame(() => {
      animatingRef.current = false;
      setIsAnimating(false);
      checkScrollState();
      scheduleComparisonReplay();
    });
  }

  function stepBy(direction: Direction) {
    const track = trackRef.current;
    if (!track || animatingRef.current || isDragging) return;

    stopComparisonSequence();

    const targetScroll = findAdjacentSnap(track.scrollLeft, direction);
    const delta = targetScroll - track.scrollLeft;
    if (delta === 0) {
      scheduleComparisonReplay(80);
      return;
    }

    const affectedCards = reducedMotion() ? [] : getCardsForStep(delta);
    if (!affectedCards.length) {
      track.scrollBy({ left: delta, behavior: "auto" });
      window.requestAnimationFrame(() => {
        checkScrollState();
        scheduleComparisonReplay();
      });
      return;
    }

    const orderedCards = direction === "next" ? affectedCards : [...affectedCards].reverse();
    animatingRef.current = true;
    setIsAnimating(true);

    animationsRef.current = orderedCards.map((card, order) => {
      card.style.willChange = "transform";
      return card.animate(
        [
          { transform: "translateX(0)" },
          { transform: `translateX(${-delta}px)` },
        ],
        {
          duration: MOTION_DURATION,
          delay: order * MOTION_STAGGER,
          easing: MOTION_EASING,
          fill: "forwards",
        },
      );
    });

    const totalDuration = MOTION_DURATION + (orderedCards.length - 1) * MOTION_STAGGER;
    commitTimerRef.current = window.setTimeout(() => {
      if (animationsRef.current.length) commitStep(targetScroll);
    }, totalDuration + MOTION_FAILSAFE);

    animationsRef.current.at(-1)?.finished
      .then(() => commitStep(targetScroll))
      .catch(() => undefined);
  }

  useEffect(() => {
    splitValuesRef.current = cards.map(() => 0);
    setPhases(cards.map(() => "before"));

    const track = trackRef.current;
    if (!track) return;

    const onScroll = () => checkScrollState();
    const onResize = () => {
      checkScrollState();
      scheduleComparisonReplay(120);
    };

    track.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    checkScrollState();

    const initialTimer = window.setTimeout(() => restartVisibleComparisons(), 420);

    return () => {
      window.clearTimeout(initialTimer);
      track.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (commitTimerRef.current !== null) window.clearTimeout(commitTimerRef.current);
      cancelActiveAnimations();
      stopComparisonSequence();
    };
  }, [cards.length]);

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "touch" || animatingRef.current || event.button !== 0) return;
    const track = trackRef.current;
    if (!track) return;
    dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startScroll: track.scrollLeft, moved: false };
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const track = trackRef.current;
    if (!track || dragRef.current.pointerId !== event.pointerId) return;

    const delta = event.clientX - dragRef.current.startX;
    if (!dragRef.current.moved) {
      if (Math.abs(delta) < DRAG_THRESHOLD) return;
      dragRef.current.moved = true;
      stopComparisonSequence();
      setIsDragging(true);
      track.setPointerCapture(event.pointerId);
    }

    track.scrollLeft = dragRef.current.startScroll - delta;
  }

  function onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    const track = trackRef.current;
    if (!track || dragRef.current.pointerId !== event.pointerId) return;

    if (track.hasPointerCapture(event.pointerId)) track.releasePointerCapture(event.pointerId);
    dragRef.current.pointerId = null;

    if (!dragRef.current.moved) return;

    const preventClick = (clickEvent: MouseEvent) => {
      clickEvent.preventDefault();
      clickEvent.stopPropagation();
    };
    track.addEventListener("click", preventClick, { capture: true, once: true });
    window.setTimeout(() => track.removeEventListener("click", preventClick, { capture: true }), 0);

    const target = findNearestSnap(track.scrollLeft);
    setIsDragging(false);
    dragRef.current.moved = false;

    if (target !== track.scrollLeft) {
      track.scrollTo({ left: target, behavior: reducedMotion() ? "auto" : "smooth" });
      scheduleComparisonReplay(reducedMotion() ? 100 : 650);
    } else {
      checkScrollState();
      scheduleComparisonReplay();
    }
  }

  function updateManualSplit(cardIndex: number, clientX: number) {
    const card = cardRefs.current[cardIndex];
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const split = ((clientX - rect.left) / rect.width) * 100;
    applySplit(cardIndex, split);
  }

  function onComparePointerDown(event: React.PointerEvent<HTMLSpanElement>, cardIndex: number) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();

    stopComparisonSequence();
    compareDragRef.current = { pointerId: event.pointerId, cardIndex };
    setComparisonDraggingIndex(cardIndex);
    setPhase(cardIndex, "manual");
    event.currentTarget.setPointerCapture(event.pointerId);
    updateManualSplit(cardIndex, event.clientX);
  }

  function onComparePointerMove(event: React.PointerEvent<HTMLSpanElement>, cardIndex: number) {
    if (compareDragRef.current.pointerId !== event.pointerId || compareDragRef.current.cardIndex !== cardIndex) return;
    event.preventDefault();
    event.stopPropagation();
    updateManualSplit(cardIndex, event.clientX);
  }

  function onComparePointerUp(event: React.PointerEvent<HTMLSpanElement>, cardIndex: number) {
    if (compareDragRef.current.pointerId !== event.pointerId || compareDragRef.current.cardIndex !== cardIndex) return;
    event.preventDefault();
    event.stopPropagation();

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    compareDragRef.current = { pointerId: null, cardIndex: -1 };
    setComparisonDraggingIndex(null);
    setPhase(cardIndex, "manual");
  }

  function onCompareKeyDown(event: React.KeyboardEvent<HTMLSpanElement>, cardIndex: number) {
    let next = splitValuesRef.current[cardIndex] ?? 50;

    if (event.key === "ArrowLeft") next -= 5;
    else if (event.key === "ArrowRight") next += 5;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = 100;
    else return;

    event.preventDefault();
    event.stopPropagation();
    stopComparisonSequence();
    setPhase(cardIndex, "manual");
    applySplit(cardIndex, next);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      stepBy("prev");
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      stepBy("next");
    }
  }

  if (!cards.length) return null;

  return (
    <section className={styles.section} id="selected-work" aria-labelledby="selected-work-title" onKeyDown={onKeyDown}>
      <div className={styles.heading}>
        <h2 id="selected-work-title">Our Projects</h2>
      </div>

      <div className={styles.carouselInner}>
        <div
          ref={trackRef}
          className={`${styles.track} ${isAnimating ? styles.animating : ""} ${isDragging ? styles.dragging : ""}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          aria-label="Our projects carousel"
        >
          {cards.map((card, cardIndex) => {
            const phase = phases[cardIndex] ?? "before";
            const phaseClass = {
              before: styles.phaseBefore,
              transition: styles.phaseTransition,
              after: styles.phaseAfter,
              returning: styles.phaseReturning,
              split: styles.phaseSplit,
              manual: styles.phaseManual,
            }[phase];

            const handleReady =
              (phase === "split" || phase === "manual") && comparisonDraggingIndex !== cardIndex;


            return (
              <article
                key={card.id}
                ref={(node) => { cardRefs.current[cardIndex] = node; }}
                className={`${styles.card} ${phaseClass}`}
                role="group"
                aria-roledescription="slide"
                aria-label={`${cardIndex + 1} of ${cards.length}: ${card.title}`}
              >
                <div className={styles.comparison} aria-label={`Before and after comparison for ${card.title}`}>
                  <img className={styles.beforeMedia} src={card.beforeSrc} alt={card.beforeAlt} draggable={false} loading="eager" decoding="async" />
                  <div className={styles.afterReveal} aria-hidden="true">
                    <img className={styles.afterMedia} src={card.afterSrc} alt="" draggable={false} loading="eager" decoding="async" />
                  </div>
                </div>

                <span className={styles.wipeLine} aria-hidden="true" />

                <span
                  ref={(node) => { handleRefs.current[cardIndex] = node; }}
                  className={`${styles.comparisonHandle} ${handleReady ? styles.handleReady : ""}`}
                  role="slider"
                  tabIndex={phase === "split" || phase === "manual" ? 0 : -1}
                  aria-label={`Before and after comparison slider for ${card.title}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(splitValuesRef.current[cardIndex] ?? 0)}
                  onPointerDown={(event) => onComparePointerDown(event, cardIndex)}
                  onPointerMove={(event) => onComparePointerMove(event, cardIndex)}
                  onPointerUp={(event) => onComparePointerUp(event, cardIndex)}
                  onPointerCancel={(event) => onComparePointerUp(event, cardIndex)}
                  onKeyDown={(event) => onCompareKeyDown(event, cardIndex)}
                >
                  <CompareHandleIcon />
                </span>

                <div className={styles.comparisonLabels} aria-hidden="true">
                  <span className={styles.afterLabel}>After</span>
                  <span className={styles.beforeLabel}>Before</span>
                </div>

                <Link className={styles.cta} href="/#services">View service</Link>
              </article>
            );
          })}
        </div>

        <div className={styles.controls} aria-label="Selected work carousel controls">
          <button type="button" className={styles.control} onClick={() => stepBy("prev")} disabled={isAtStart || isAnimating} aria-label="Previous card"><Arrow /></button>
          <button type="button" className={styles.control} onClick={() => stepBy("next")} disabled={isAtEnd || isAnimating} aria-label="Next card"><Arrow next /></button>
        </div>
      </div>
    </section>
  );
}
