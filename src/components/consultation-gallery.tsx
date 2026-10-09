"use client";

import { useEffect, useState } from "react";
import type { ConsultationGalleryImage } from "@/lib/consultation-gallery";
import styles from "./consultation-gallery.module.css";

type Props = {
  images: ConsultationGalleryImage[];
};

export function ConsultationGallery({ images }: Props) {
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
    if (images.length < 2 || reduceMotion) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % images.length);
    }, 5600);
    return () => window.clearInterval(timer);
  }, [images.length, reduceMotion]);

  useEffect(() => {
    if (images.length < 2) return;
    const nextIndex = (activeIndex + 1) % images.length;
    const preload = new window.Image();
    preload.src = images[nextIndex].src;
  }, [activeIndex, images]);

  if (!images.length) return null;

  return (
    <div className={styles.gallery} aria-hidden="true">
      {images.map((image, index) => (
        <img
          key={image.id}
          src={image.src}
          alt=""
          className={styles.slide + " " + (index === activeIndex ? styles.active : "")}
          loading={index < 2 ? "eager" : "lazy"}
          fetchPriority={index === 0 ? "high" : "auto"}
          decoding="async"
        />
      ))}
    </div>
  );
}
