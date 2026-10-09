"use client";

import { useEffect, useState, type CSSProperties } from "react";
import styles from "./site-intro.module.css";

type IntroPhase = "pre" | "entering" | "leaving";

const hats = [
  { className: "hat0", delay: "0ms", duration: "8.8s", floatX: "34px", floatY: "42px", floatR: "10deg" },
  { className: "hat1", delay: "120ms", duration: "10.4s", floatX: "-28px", floatY: "36px", floatR: "-12deg" },
  { className: "hat2", delay: "220ms", duration: "9.6s", floatX: "-36px", floatY: "-32px", floatR: "11deg" },
  { className: "hat3", delay: "320ms", duration: "11.2s", floatX: "30px", floatY: "-38px", floatR: "-10deg" },
] as const;

export function SiteIntro() {
  const [phase, setPhase] = useState<IntroPhase>("pre");
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    const frame = window.requestAnimationFrame(() => setPhase("entering"));
    const leaveTimer = window.setTimeout(
      () => setPhase("leaving"),
      reduceMotion ? 700 : 2300,
    );
    const doneTimer = window.setTimeout(
      () => setVisible(false),
      reduceMotion ? 980 : 3050,
    );

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(leaveTimer);
      window.clearTimeout(doneTimer);
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, []);

  useEffect(() => {
    if (visible) return;
    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className={`${styles.intro} ${styles[phase]}`}
      aria-hidden="true"
    >
      <div className={styles.hats}>
        {hats.map((hat, index) => (
          <div
            key={hat.className}
            className={`${styles.hat} ${styles[hat.className]}`}
            style={{
              "--hat-delay": hat.delay,
              "--hat-duration": hat.duration,
              "--hat-float-x": hat.floatX,
              "--hat-float-y": hat.floatY,
              "--hat-float-r": hat.floatR,
            } as CSSProperties}
          >
            <div className={styles.hatFloat}>
              <img
                src="/images/vic-hard-hat.png"
                alt=""
                width="192"
                height="144"
                draggable={false}
              />
            </div>
          </div>
        ))}
      </div>

      <div className={styles.copy}>
        <strong>VIC PREMIER</strong>
        <span>WE SHAPE YOUR VISION</span>
      </div>
    </div>
  );
}
