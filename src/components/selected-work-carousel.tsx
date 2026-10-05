"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./selected-work-carousel.module.css";

type WorkCard = {
  title: string;
  label: string;
  secondary: string;
  description: string;
  href: string;
  image: string;
  alt: string;
};

const cards: WorkCard[] = [
  {
    title: "Residential Renovation",
    label: "Before & After",
    secondary: "Preview",
    description: "Placeholder media for a future client-supplied before-and-after renovation composition.",
    href: "/services/residential-construction-renovation",
    image: "https://images.unsplash.com/photo-1768321916292-ade0ca9c091d?auto=format&fit=crop&w=1600&q=86",
    alt: "Residential renovation framing used as temporary visual placeholder",
  },
  {
    title: "Commercial Renewal",
    label: "Before & After",
    secondary: "Preview",
    description: "Temporary visual direction for a future commercial project transformation card.",
    href: "/services/commercial-construction-renovation",
    image: "https://images.unsplash.com/photo-1761896171748-ca4e9c81b5de?auto=format&fit=crop&w=1600&q=86",
    alt: "Commercial construction scene used as temporary visual placeholder",
  },
  {
    title: "Roof Restoration",
    label: "Before & After",
    secondary: "Preview",
    description: "Placeholder imagery until verified before-and-after project media is supplied for publication.",
    href: "/services/roof-restoration",
    image: "https://images.unsplash.com/photo-1727637598483-0c139a8fb48f?auto=format&fit=crop&w=1600&q=86",
    alt: "Residential roofing used as temporary visual placeholder",
  },
  {
    title: "Tiling & Finish",
    label: "Before & After",
    secondary: "Preview",
    description: "Temporary visual reference for a future client-supplied finish transformation.",
    href: "/services/tiling",
    image: "https://images.unsplash.com/photo-1523413363574-c30aa1c2a516?auto=format&fit=crop&w=1600&q=86",
    alt: "Tiling work used as temporary visual placeholder",
  },
  {
    title: "Carpentry Detail",
    label: "Before & After",
    secondary: "Preview",
    description: "Placeholder media for the future Selected Work library of verified client transformations.",
    href: "/services/general-carpentry",
    image: "https://images.unsplash.com/photo-1769353086138-19ee65291a04?auto=format&fit=crop&w=1600&q=86",
    alt: "Carpentry work used as temporary visual placeholder",
  },
];

function Arrow({ next = false }: { next?: boolean }) {
  const d = next
    ? "M34 30L27.2155 23L26 24.2542L31.5689 30L26 35.7458L27.2155 37L34 30Z"
    : "M26 30L32.7845 23L34 24.2542L28.4311 30L34 35.7458L32.7845 37L26 30Z";
  return (
    <svg viewBox="0 0 60 60" fill="none" aria-hidden="true">
      <path d={d} fill="currentColor" />
    </svg>
  );
}

export function SelectedWorkCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const dragRef = useRef({ active: false, startX: 0, startScroll: 0 });
  const [index, setIndex] = useState(0);
  const [dragging, setDragging] = useState(false);

  const scrollToIndex = useCallback((nextIndex: number) => {
    const track = trackRef.current;
    const card = cardRefs.current[nextIndex];
    if (!track || !card) return;
    const left = card.offsetLeft - track.offsetLeft;
    track.scrollTo({ left, behavior: "smooth" });
    setIndex(nextIndex);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const trackLeft = track.scrollLeft;
        let closest = 0;
        let distance = Number.POSITIVE_INFINITY;
        cardRefs.current.forEach((card, cardIndex) => {
          if (!card) return;
          const delta = Math.abs(card.offsetLeft - track.offsetLeft - trackLeft);
          if (delta < distance) {
            closest = cardIndex;
            distance = delta;
          }
        });
        setIndex(closest);
      });
    };

    track.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      track.removeEventListener("scroll", onScroll);
    };
  }, []);

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const track = trackRef.current;
    if (!track) return;
    dragRef.current = { active: true, startX: event.clientX, startScroll: track.scrollLeft };
    setDragging(true);
    track.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const track = trackRef.current;
    if (!track || !dragRef.current.active) return;
    const delta = event.clientX - dragRef.current.startX;
    track.scrollLeft = dragRef.current.startScroll - delta;
  }

  function endPointer(event: React.PointerEvent<HTMLDivElement>) {
    const track = trackRef.current;
    if (!track || !dragRef.current.active) return;
    dragRef.current.active = false;
    setDragging(false);
    if (track.hasPointerCapture(event.pointerId)) track.releasePointerCapture(event.pointerId);
    scrollToIndex(index);
  }

  return (
    <section className={styles.section} id="projects" aria-labelledby="selected-work-title">
      <div className={styles.heading}>
        <h2 id="selected-work-title">Selected Work</h2>
        <p>Before-and-after transformations will live here. The current imagery is temporary and will be replaced with verified client project composites.</p>
      </div>

      <div
        ref={trackRef}
        className={`${styles.track} ${dragging ? styles.dragging : ""}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        aria-label="Selected work carousel"
      >
        {cards.map((card, cardIndex) => (
          <article
            key={card.title}
            ref={(node) => { cardRefs.current[cardIndex] = node; }}
            className={styles.card}
            role="group"
            aria-roledescription="slide"
            aria-label={`${cardIndex + 1} of ${cards.length}`}
          >
            <img className={styles.media} src={card.image} alt={card.alt} draggable={false} loading="eager" decoding="async" />
            <div className={styles.pills}>
              <div className={styles.pill}>
                <span>{card.label}</span>
                <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 8H13.5M9 4L13.5 8L9 12" /></svg>
              </div>
              <div className={styles.pill}>{card.secondary}</div>
            </div>
            <h3>{card.title}</h3>
            <div className={styles.description}><p>{card.description}</p></div>
            <Link className={styles.cta} href={card.href}>View service</Link>
          </article>
        ))}
      </div>

      <div className={styles.controls} aria-label="Selected work carousel controls">
        <button type="button" className={styles.control} onClick={() => scrollToIndex(Math.max(0, index - 1))} disabled={index === 0} aria-label="Previous card"><Arrow /></button>
        <button type="button" className={styles.control} onClick={() => scrollToIndex(Math.min(cards.length - 1, index + 1))} disabled={index === cards.length - 1} aria-label="Next card"><Arrow next /></button>
      </div>
    </section>
  );
}
