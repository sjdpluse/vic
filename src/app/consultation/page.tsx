import type { Metadata } from "next";
import Link from "next/link";
import { FreeQuoteForm } from "@/components/free-quote-form";
import { PublicFooter } from "@/components/public-footer";
import { PublicHeader } from "@/components/public-header";
import styles from "./consultation.module.css";

export const metadata: Metadata = {
  title: "Request a Free Quote | VIC Premier Construction Team",
  description:
    "Tell VIC Premier Construction Team about your residential or commercial construction, renovation or property improvement project.",
};

export default function ConsultationPage() {
  return (
    <>
      <PublicHeader />
      <main id="main-content" className={styles.page}>
        <section className={styles.shell} aria-labelledby="consultation-title">
          <div className={styles.visual}>
            <img
              src="/images/consultation-builder.webp"
              alt="Builder holding a construction hard hat"
              className={styles.visualImage}
            />
            <div className={styles.visualShade} aria-hidden="true" />
            <h1 id="consultation-title" className={styles.visualTitle}>
              <span>Tell us about</span>
              <em>your project.</em>
            </h1>
          </div>

          <div className={styles.formPanel}>
            <div className={styles.formHeader}>
              <div>
                <span>Start a project</span>
                <strong>Project details</strong>
              </div>
              <Link href="/" aria-label="Return to VIC Premier home">Close ↗</Link>
            </div>
            <FreeQuoteForm />
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
