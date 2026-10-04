"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ProjectMedia } from "@/lib/projects";
import { projectMediaUrl } from "@/lib/projects";
import styles from "./project-gallery.module.css";

type ProjectGalleryProps = { projectTitle: string; media: ProjectMedia[] };

export function ProjectGallery({ projectTitle, media }: ProjectGalleryProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const imageItems = useMemo(() => media.filter((item) => item.media_type === "image"), [media]);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);

  const activeIndex = imageItems.findIndex((item) => item.id === activeImageId);
  const activeImage = activeIndex >= 0 ? imageItems[activeIndex] : null;

  function open(id: string) {
    setActiveImageId(id);
    dialogRef.current?.showModal();
  }

  function close() {
    dialogRef.current?.close();
    setActiveImageId(null);
  }

  function move(direction: -1 | 1) {
    if (!imageItems.length || activeIndex < 0) return;
    const next = (activeIndex + direction + imageItems.length) % imageItems.length;
    setActiveImageId(imageItems[next].id);
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!dialogRef.current?.open) return;
      if (event.key === "ArrowLeft") move(-1);
      if (event.key === "ArrowRight") move(1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  return (
    <>
      <section className={styles.gallery} aria-label={`${projectTitle} project media`}>
        {media.map((item, index) => (
          <figure className={`${styles.media} ${index === 0 ? styles.lead : ""}`} key={item.id}>
            {item.media_type === "image" ? (
              <button className={styles.imageButton} type="button" onClick={() => open(item.id)} aria-label={`Open image ${index + 1} of ${projectTitle}`}>
                <img src={projectMediaUrl(item)} alt={item.alt_text || projectTitle} loading={index === 0 ? "eager" : "lazy"} decoding="async" fetchPriority={index === 0 ? "high" : "auto"} />
              </button>
            ) : (
              <video src={projectMediaUrl(item)} controls playsInline preload="metadata" />
            )}
            {item.caption ? <figcaption>{item.caption}</figcaption> : null}
          </figure>
        ))}
      </section>

      <dialog className={styles.dialog} ref={dialogRef} onClose={() => setActiveImageId(null)}>
        {activeImage ? (
          <div className={styles.viewer}>
            <button className={styles.close} type="button" onClick={close} aria-label="Close image viewer">Close</button>
            {imageItems.length > 1 ? <button className={styles.previous} type="button" onClick={() => move(-1)} aria-label="Previous image">←</button> : null}
            <img src={projectMediaUrl(activeImage)} alt={activeImage.alt_text || projectTitle} />
            {imageItems.length > 1 ? <button className={styles.next} type="button" onClick={() => move(1)} aria-label="Next image">→</button> : null}
            {activeImage.caption ? <p className={styles.caption}>{activeImage.caption}</p> : null}
          </div>
        ) : null}
      </dialog>
    </>
  );
}
