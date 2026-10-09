"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./home-about.module.css";

type AboutPair = {
  id: string;
  beforeSrc: string;
  afterSrc: string;
  beforeAlt: string;
  afterAlt: string;
};

type HomeAboutShowcaseProps = {
  cards: AboutPair[];
};

export function HomeAboutShowcase({ cards }: HomeAboutShowcaseProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (cards.length < 2 || reduceMotion) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % cards.length);
    }, 5200);

    return () => window.clearInterval(timer);
  }, [cards.length, reduceMotion]);

  useEffect(() => {
    if (cards.length < 2) return;
    const next = cards[(activeIndex + 1) % cards.length];
    const before = new window.Image();
    const after = new window.Image();
    before.src = next.beforeSrc;
    after.src = next.afterSrc;
  }, [activeIndex, cards]);

  const hasMedia = cards.length > 0;

  return (
    <section className={styles.section} id="about" aria-labelledby="about-title">
      {hasMedia ? (
        <>
          <div className={styles.media + " " + styles.beforeMedia} aria-label="Before project images">
            {cards.map((card, index) => (
              <img
                key={"before-" + card.id}
                src={card.beforeSrc}
                alt={index === activeIndex ? card.beforeAlt : ""}
                className={styles.image + " " + (index === activeIndex ? styles.active : "")}
                loading={index < 2 ? "eager" : "lazy"}
                fetchPriority={index === 0 ? "high" : "auto"}
                decoding="async"
              />
            ))}
            <span className={styles.mediaLabel}>Before</span>
          </div>

          <div className={styles.media + " " + styles.afterMedia} aria-label="After project images">
            {cards.map((card, index) => (
              <img
                key={"after-" + card.id}
                src={card.afterSrc}
                alt={index === activeIndex ? card.afterAlt : ""}
                className={styles.image + " " + (index === activeIndex ? styles.active : "")}
                loading={index < 2 ? "eager" : "lazy"}
                fetchPriority={index === 0 ? "high" : "auto"}
                decoding="async"
              />
            ))}
            <span className={styles.mediaLabel}>After</span>
          </div>
        </>
      ) : null}

      <div className={styles.content}>
        <span className={styles.star} aria-hidden="true">✦</span>
        <h2 id="about-title">
          <span>If you can <em>dream it</em>, we</span>
          <span>can <em>build it.</em></span>
        </h2>
        <p>
          We bring construction, renovation and finishing work together with a clear understanding of the property, the scope and the result you want to achieve.
        </p>
        <Link className={styles.cta} href="/about">
          Discover VIC Premier
        </Link>
      </div>
    </section>
  );
}
