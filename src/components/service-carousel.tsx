"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, MouseEvent, PointerEvent, WheelEvent } from "react";
import type { ServiceDefinition } from "@/lib/services";
import styles from "./service-carousel.module.css";

type ServiceCarouselProps = { services: ServiceDefinition[] };

const serviceImages: Record<string, { src: string; alt: string }> = {
  "residential-construction-renovation": {
    src: "https://images.unsplash.com/photo-1768321916292-ade0ca9c091d?auto=format&fit=crop&w=1400&q=84",
    alt: "Interior framing during a residential renovation",
  },
  "commercial-construction-renovation": {
    src: "https://images.unsplash.com/photo-1761896171748-ca4e9c81b5de?auto=format&fit=crop&w=1400&q=84",
    alt: "Commercial construction site with cranes and buildings",
  },
  "interior-exterior-painting": {
    src: "https://images.unsplash.com/photo-1693985120993-e9b203ce7631?auto=format&fit=crop&w=1400&q=84",
    alt: "Painter applying paint to a wall with a roller",
  },
  "roof-restoration": {
    src: "https://images.unsplash.com/photo-1727637598483-0c139a8fb48f?auto=format&fit=crop&w=1400&q=84",
    alt: "Residential roof prepared for restoration work",
  },
  gutters: {
    src: "https://images.unsplash.com/photo-1634853982486-c06f0e17940f?auto=format&fit=crop&w=1400&q=84",
    alt: "Rain gutter installed along a residential roof edge",
  },
  tiling: {
    src: "https://images.unsplash.com/photo-1523413363574-c30aa1c2a516?auto=format&fit=crop&w=1400&q=84",
    alt: "Hands installing tiles during renovation work",
  },
  "wall-rendering": {
    src: "https://images.unsplash.com/photo-1768839725085-829e6ac7ac26?auto=format&fit=crop&w=1400&q=84",
    alt: "Hands applying plaster to a wall with trowels",
  },
  "general-carpentry": {
    src: "https://images.unsplash.com/photo-1769353086138-19ee65291a04?auto=format&fit=crop&w=1400&q=84",
    alt: "Carpenter working with timber in a workshop",
  },
};

const rotations = [-4.5, 3.2, -2.6, 4.2, -3.4, 2.8, -4, 3.5];

export function ServiceCarousel({ services }: ServiceCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ active: false, startX: 0, scrollLeft: 0, moved: false });
  const [dragging, setDragging] = useState(false);
  const [canBack, setCanBack] = useState(false);
  const [canForward, setCanForward] = useState(true);

  const updateControls = useCallback(() => {
    const node = scrollerRef.current;
    if (!node) return;
    setCanBack(node.scrollLeft > 6);
    setCanForward(node.scrollLeft < node.scrollWidth - node.clientWidth - 6);
  }, []);

  useEffect(() => {
    updateControls();
    const node = scrollerRef.current;
    if (!node) return;
    const observer = new ResizeObserver(updateControls);
    observer.observe(node);
    return () => observer.disconnect();
  }, [updateControls]);

  const step = useCallback((direction: -1 | 1) => {
    const node = scrollerRef.current;
    if (!node) return;
    const card = node.querySelector<HTMLElement>("[data-service-card]");
    const gap = 28;
    const distance = (card?.offsetWidth ?? node.clientWidth * 0.34) + gap;
    node.scrollBy({ left: direction * distance, behavior: "smooth" });
  }, []);

  function onWheel(event: WheelEvent<HTMLDivElement>) {
    const node = scrollerRef.current;
    if (!node) return;
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
    if ((event.deltaY < 0 && !canBack) || (event.deltaY > 0 && !canForward)) return;
    event.preventDefault();
    node.scrollLeft += event.deltaY;
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "touch") return;
    const node = scrollerRef.current;
    if (!node) return;
    dragRef.current = { active: true, startX: event.clientX, scrollLeft: node.scrollLeft, moved: false };
    setDragging(true);
    node.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const node = scrollerRef.current;
    const drag = dragRef.current;
    if (!node || !drag.active) return;
    const delta = event.clientX - drag.startX;
    if (Math.abs(delta) > 5) drag.moved = true;
    node.scrollLeft = drag.scrollLeft - delta;
  }

  function finishDrag(event: PointerEvent<HTMLDivElement>) {
    const node = scrollerRef.current;
    if (!node || !dragRef.current.active) return;
    dragRef.current.active = false;
    setDragging(false);
    if (node.hasPointerCapture(event.pointerId)) node.releasePointerCapture(event.pointerId);
  }

  function guardDraggedLink(event: MouseEvent<HTMLAnchorElement>) {
    if (dragRef.current.moved) {
      event.preventDefault();
      dragRef.current.moved = false;
    }
  }

  return (
    <section className={styles.section} aria-labelledby="service-carousel-title">
      <div className={styles.blobBlue} aria-hidden="true" />
      <div className={styles.blobRed} aria-hidden="true" />
      <div className={styles.headlineWrap}>
        <span className={styles.eyebrow}>01 / Services</span>
        <h2 id="service-carousel-title">Built for every stage of the work.</h2>
      </div>

      <div
        ref={scrollerRef}
        className={`${styles.scroller} ${dragging ? styles.dragging : ""}`}
        onScroll={updateControls}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        onPointerLeave={(event) => {
          if (dragRef.current.active && event.buttons === 0) finishDrag(event);
        }}
        aria-label="VIC Premier services"
      >
        <div className={styles.track}>
          {services.map((service, index) => {
            const image = serviceImages[service.slug];
            return (
              <Link
                data-service-card
                key={service.slug}
                href={`/services/${service.slug}`}
                className={styles.card}
                style={{ "--card-rotation": `${rotations[index % rotations.length]}deg` } as CSSProperties}
                onClick={guardDraggedLink}
              >
                <div className={styles.media}>
                  {image ? <img src={image.src} alt={image.alt} draggable={false} loading="lazy" decoding="async" /> : null}
                </div>
                <div className={styles.copy}>
                  <h3>{service.shortTitle}</h3>
                  <p>{service.summary}</p>
                  <span>Explore service <span aria-hidden="true">→</span></span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className={styles.controls} aria-label="Service carousel controls">
        <button type="button" onClick={() => step(-1)} disabled={!canBack} aria-label="Previous services">←</button>
        <button type="button" onClick={() => step(1)} disabled={!canForward} aria-label="Next services">→</button>
      </div>
      <p className={styles.note}>Service imagery is illustrative and is not presented as VIC Premier project photography.</p>
    </section>
  );
}
