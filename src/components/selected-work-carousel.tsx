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

const MOTION_DURATION = 1300;
const MOTION_STAGGER = 50;
const MOTION_EASING = "cubic-bezier(0.65, 0, 0, 1)";
const MOTION_FAILSAFE = 250;
const DRAG_THRESHOLD = 5;

function Arrow({ next = false }: { next?: boolean }) {
  return (
    <svg viewBox="0 0 60 60" fill="none" aria-hidden="true" className={next ? styles.nextArrow : undefined}>
      <path d="M26 30L32.7845 23L34 24.2542L28.4311 30L34 35.7458L32.7845 37L26 30Z" fill="currentColor" />
    </svg>
  );
}

export function SelectedWorkCarousel({ cards }: SelectedWorkCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const animationsRef = useRef<Animation[]>([]);
  const commitTimerRef = useRef<number | null>(null);
  const animatingRef = useRef(false);
  const dragRef = useRef({ pointerId: null as number | null, startX: 0, startScroll: 0, moved: false });
  const [isAnimating, setIsAnimating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isAtStart, setIsAtStart] = useState(true);
  const [isAtEnd, setIsAtEnd] = useState(false);

  function cardElements() {
    return cardRefs.current.filter((card): card is HTMLElement => Boolean(card));
  }

  function reducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
    });
  }

  function stepBy(direction: Direction) {
    const track = trackRef.current;
    if (!track || animatingRef.current || isDragging) return;

    const targetScroll = findAdjacentSnap(track.scrollLeft, direction);
    const delta = targetScroll - track.scrollLeft;
    if (delta === 0) return;

    const affectedCards = reducedMotion() ? [] : getCardsForStep(delta);
    if (!affectedCards.length) {
      track.scrollBy({ left: delta, behavior: "auto" });
      window.requestAnimationFrame(checkScrollState);
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
    const track = trackRef.current;
    if (!track) return;

    const onScroll = () => checkScrollState();
    const onResize = () => checkScrollState();
    track.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    checkScrollState();

    return () => {
      track.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (commitTimerRef.current !== null) window.clearTimeout(commitTimerRef.current);
      cancelActiveAnimations();
    };
  }, []);

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
    } else {
      checkScrollState();
    }
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
    <section className={styles.section} id="projects" aria-labelledby="selected-work-title" onKeyDown={onKeyDown}>
      <div className={styles.heading}>
        <h2 id="selected-work-title">Selected Work</h2>
      </div>

      <div className={styles.carouselInner}>
        <div
          ref={trackRef}
          className={`${styles.track} ${isAnimating ? styles.animating : ""} ${isDragging ? styles.dragging : ""}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          aria-label="Selected work carousel"
        >
          {cards.map((card, cardIndex) => (
            <article
              key={card.id}
              ref={(node) => { cardRefs.current[cardIndex] = node; }}
              className={styles.card}
              role="group"
              aria-roledescription="slide"
              aria-label={`${cardIndex + 1} of ${cards.length}: ${card.title}`}
            >
              <div className={styles.comparison} aria-label={`Before and after comparison for ${card.title}`}>
                <img className={styles.beforeMedia} src={card.beforeSrc} alt={card.beforeAlt} draggable={false} loading="eager" decoding="async" />
                <div className={styles.afterReveal} aria-hidden="true">
                  <img className={styles.afterMedia} src={card.afterSrc} alt="" draggable={false} loading="eager" decoding="async" />
                </div>
                <span className={styles.wipeLine} aria-hidden="true" />
              </div>
              <div className={styles.comparisonLabels} aria-hidden="true">
                <span className={styles.beforeLabel}>Before</span>
                <span className={styles.afterLabel}>After</span>
              </div>
              <Link className={styles.cta} href="/#services">View service</Link>
            </article>
          ))}
        </div>

        <div className={styles.controls} aria-label="Selected work carousel controls">
          <button type="button" className={styles.control} onClick={() => stepBy("prev")} disabled={isAtStart || isAnimating} aria-label="Previous card"><Arrow /></button>
          <button type="button" className={styles.control} onClick={() => stepBy("next")} disabled={isAtEnd || isAnimating} aria-label="Next card"><Arrow next /></button>
        </div>
      </div>
    </section>
  );
}
