import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import { getAboutHeroMedia } from "@/lib/about-media";
import styles from "./about.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "About | VIC Premier Construction Team",
  description:
    "About VIC Premier Construction Team and its residential and commercial construction and renovation services.",
};

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 17 17 7M9 7h8v8" />
    </svg>
  );
}

export default async function AboutPage() {
  const heroMedia = await getAboutHeroMedia();

  return (
    <main id="main-content" className={styles.page}>
      <PublicHeader />

      <section className={styles.hero} aria-labelledby="about-title">
        {heroMedia ? (
          <img
            src={heroMedia.src}
            alt="VIC Premier construction and renovation work"
            className={styles.heroImage}
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
        ) : (
          <div className={styles.heroFallback} aria-hidden="true" />
        )}
        <div className={styles.heroOverlay} aria-hidden="true" />

        <div className={styles.heroTopline}>
          <span>VIC PREMIER / ABOUT</span>
        </div>

        <div className={styles.heroContent}>
          <h1 id="about-title">Existing spaces, renewed with intent.</h1>
          <div className={styles.heroSummary}>
            <span>About VIC Premier</span>
            <p>
              Residential and commercial construction and renovation work shaped around the property,
              the scope and the finish.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.overview} aria-labelledby="about-overview-title">
        <div className={styles.sectionLabel}>About the work</div>

        <div className={styles.overviewGrid}>
          <h2 id="about-overview-title">
            Practical construction and renovation, considered from scope through to finish.
          </h2>
          <div className={styles.overviewCopy}>
            <p>
              VIC PREMIER CONSTRUCTION TEAM delivers residential and commercial construction and
              renovation services across Melbourne.
            </p>
            <p>
              The work spans renovation, painting, roof restoration, gutters, tiling, rendering and
              general carpentry. The focus is simple: a clear scope, considered workmanship and
              finishes that belong to the property rather than fight it.
            </p>
            <Link className={styles.link} href="/#services">
              <span>Explore our services</span>
              <ArrowIcon />
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.statement} aria-label="VIC Premier approach">
        <span>CONSTRUCT</span>
        <i aria-hidden="true" />
        <span>RENEW</span>
        <i aria-hidden="true" />
        <span>FINISH</span>
      </section>

      <PublicFooter />
    </main>
  );
}
