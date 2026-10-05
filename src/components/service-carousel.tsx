"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { ServiceDefinition } from "@/lib/services";
import styles from "./service-carousel.module.css";

type ServiceCarouselProps = { services: ServiceDefinition[] };

const ANGLE_STEP = 10;
const VISIBLE_ANGLE = 20.1;
const BUFFER = 4;
const MOTION_DURATION = 1300;
const MOTION_STAGGER = 50;
const MOTION_FAILSAFE = 250;

const serviceImages: Record<string, { src: string; alt: string }> = {
  "residential-construction-renovation": { src: "https://images.unsplash.com/photo-1768321916292-ade0ca9c091d?auto=format&fit=crop&w=1400&q=84", alt: "Interior framing during a residential renovation" },
  "commercial-construction-renovation": { src: "https://images.unsplash.com/photo-1761896171748-ca4e9c81b5de?auto=format&fit=crop&w=1400&q=84", alt: "Commercial construction site with cranes and buildings" },
  "interior-exterior-painting": { src: "https://images.unsplash.com/photo-1693985120993-e9b203ce7631?auto=format&fit=crop&w=1400&q=84", alt: "Painter applying paint to a wall with a roller" },
  "roof-restoration": { src: "https://images.unsplash.com/photo-1727637598483-0c139a8fb48f?auto=format&fit=crop&w=1400&q=84", alt: "Residential roof prepared for restoration work" },
  gutters: { src: "https://images.unsplash.com/photo-1634853982486-c06f0e17940f?auto=format&fit=crop&w=1400&q=84", alt: "Rain gutter installed along a residential roof edge" },
  tiling: { src: "https://images.unsplash.com/photo-1523413363574-c30aa1c2a516?auto=format&fit=crop&w=1400&q=84", alt: "Hands installing tiles during renovation work" },
  "wall-rendering": { src: "https://images.unsplash.com/photo-1768839725085-829e6ac7ac26?auto=format&fit=crop&w=1400&q=84", alt: "Hands applying plaster to a wall with trowels" },
  "general-carpentry": { src: "https://images.unsplash.com/photo-1769353086138-19ee65291a04?auto=format&fit=crop&w=1400&q=84", alt: "Carpenter working with timber in a workshop" },
};

function mod(value: number, count: number) {
  return ((value % count) + count) % count;
}

function ArrowIcon({ next = false }: { next?: boolean }) {
  const path = next
    ? "M34 30L27.2155 23L26 24.2542L31.5689 30L26 35.7458L27.2155 37L34 30Z"
    : "M26 30L32.7845 23L34 24.2542L28.4311 30L34 35.7458L32.7845 37L26 30Z";

  return (
    <svg width="100%" height="100%" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d={path} fill="currentColor" />
    </svg>
  );
}

export function ServiceCarousel({ services }: ServiceCarouselProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ active: false, startX: 0, startPosition: 0, moved: false });
  const motionTimerRef = useRef<number | null>(null);
  const [position, setPosition] = useState(0);
  const [radius, setRadius] = useState(1650);
  const [interacting, setInteracting] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [motionDirection, setMotionDirection] = useState<-1 | 0 | 1>(0);

  const activeVirtualIndex = Math.round(position);
  const activeIndex = services.length ? mod(activeVirtualIndex, services.length) : 0;

  const virtualCards = useMemo(() => {
    if (!services.length) return [] as number[];
    const start = Math.floor(position) - BUFFER;
    return Array.from({ length: BUFFER * 2 + 2 }, (_, offset) => start + offset);
  }, [position, services.length]);

  const measure = useCallback(() => {
    const width = stageRef.current?.clientWidth ?? window.innerWidth;
    setRadius(width > 1024 ? 2700 : 1650);
  }, []);

  useEffect(() => {
    measure();
    const node = stageRef.current;
    if (!node) return;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [measure]);

  useEffect(() => () => {
    if (motionTimerRef.current !== null) window.clearTimeout(motionTimerRef.current);
  }, []);

  const step = useCallback((direction: -1 | 1) => {
    if (animating) return;

    if (motionTimerRef.current !== null) window.clearTimeout(motionTimerRef.current);
    setInteracting(false);
    setMotionDirection(direction);
    setAnimating(true);
    setPosition((current) => Math.round(current) + direction);

    const totalDuration = MOTION_DURATION + (BUFFER * 2 + 1) * MOTION_STAGGER;
    motionTimerRef.current = window.setTimeout(() => {
      setAnimating(false);
      setMotionDirection(0);
      motionTimerRef.current = null;
    }, totalDuration + MOTION_FAILSAFE);
  }, [animating]);

  function onKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      step(-1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      step(1);
    }
  }

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (animating || (event.pointerType === "mouse" && event.button !== 0)) return;
    const node = stageRef.current;
    if (!node) return;
    setMotionDirection(0);
    dragRef.current = { active: true, startX: event.clientX, startPosition: position, moved: false };
    setInteracting(true);
    node.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag.active) return;
    const delta = event.clientX - drag.startX;
    if (Math.abs(delta) > 5) drag.moved = true;
    const pixelsPerCard = Math.max(120, radius * Math.sin((ANGLE_STEP * Math.PI) / 180));
    setPosition(drag.startPosition - delta / pixelsPerCard);
  }

  function finishDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const node = stageRef.current;
    if (!dragRef.current.active || !node) return;
    dragRef.current.active = false;
    if (node.hasPointerCapture(event.pointerId)) node.releasePointerCapture(event.pointerId);
    setPosition((current) => {
      const snapped = Math.round(current);
      window.requestAnimationFrame(() => setInteracting(false));
      return snapped;
    });
  }

  function guardDraggedLink(event: ReactMouseEvent<HTMLAnchorElement>) {
    if (!dragRef.current.moved) return;
    event.preventDefault();
    dragRef.current.moved = false;
  }

  if (!services.length) return null;

  return (
    <section className={styles.section} id="services" aria-labelledby="service-carousel-title">
      <div className={styles.heading}>
        <h2 id="service-carousel-title">Our Services</h2>
      </div>

      <div
        ref={stageRef}
        className={`${styles.stage} ${interacting ? styles.interacting : ""} ${animating ? styles.animating : ""}`}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        aria-label="VIC Premier services carousel. Drag left or right, or use the arrow keys to navigate."
      >
        <div className={styles.circle} style={{ width: `${radius * 2}px`, height: `${radius * 2}px` }}>
          {virtualCards.map((virtualIndex) => {
            const serviceIndex = mod(virtualIndex, services.length);
            const service = services[serviceIndex];
            const relative = virtualIndex - position;
            const angle = relative * ANGLE_STEP;
            const radians = (angle * Math.PI) / 180;
            const x = radius + radius * Math.sin(radians);
            const y = radius - radius * Math.cos(radians);
            const visible = Math.abs(angle) <= VISIBLE_ANGLE;
            const isActive = virtualIndex === activeVirtualIndex;
            const image = serviceImages[service.slug];
            const staggerOrder = motionDirection === 1
              ? Math.max(0, relative + BUFFER)
              : motionDirection === -1
                ? Math.max(0, BUFFER - relative)
                : 0;
            const style = {
              "--card-x": `${x}px`,
              "--card-y": `${y}px`,
              "--card-angle": `${angle}deg`,
              "--card-delay": `${staggerOrder * MOTION_STAGGER}ms`,
              zIndex: 100 - Math.round(Math.abs(angle)),
            } as CSSProperties;

            return (
              <article
                key={virtualIndex}
                className={`${styles.cardPosition} ${visible ? styles.visible : styles.hidden} ${isActive ? styles.centered : ""}`}
                style={style}
                aria-hidden={!visible}
              >
                <div className={styles.card}>
                  <div className={styles.media}>
                    {image ? <img src={image.src} alt={image.alt} draggable={false} loading="eager" decoding="async" /> : null}
                  </div>
                  <div className={styles.content}>
                    <h3>{service.shortTitle}</h3>
                    <p>{service.summary}</p>
                    <Link
                      href={`/services/${service.slug}`}
                      className={styles.cta}
                      tabIndex={isActive ? 0 : -1}
                      onClick={guardDraggedLink}
                    >
                      <span>Explore service</span>
                      <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <div className={styles.controls} aria-label="Service carousel controls">
        <button type="button" onClick={() => step(-1)} disabled={animating} aria-label="Previous service"><ArrowIcon /></button>
        <button type="button" onClick={() => step(1)} disabled={animating} aria-label="Next service"><ArrowIcon next /></button>
      </div>
      <span className={styles.srOnly} aria-live="polite">{services[activeIndex]?.title}</span>
    </section>
  );
}
