import type { Metadata } from "next";
import Link from "next/link";
import { ConsultationGallery } from "@/components/consultation-gallery";
import { FreeQuoteForm } from "@/components/free-quote-form";
import { PublicFooter } from "@/components/public-footer";
import { PublicHeader } from "@/components/public-header";
import { getConsultationGalleryImages } from "@/lib/consultation-gallery";
import styles from "./consultation.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Request a Free Quote | VIC Premier Construction Team",
  description:
    "Tell VIC Premier Construction Team about your residential or commercial construction, renovation or property improvement project.",
};

export default async function ConsultationPage() {
  const managedImages = await getConsultationGalleryImages();
  const images = managedImages.length
    ? managedImages
    : [{ id: "fallback", src: "/images/consultation-builder.webp" }];

  return (
    <>
      <PublicHeader />
      <main id="main-content" className={styles.page}>
        <section className={styles.shell} aria-labelledby="consultation-title">
          <div className={styles.visual}>
            <ConsultationGallery images={images} />
            <div className={styles.visualShade} aria-hidden="true" />
            <h1 id="consultation-title" className={styles.visualTitle}>
              <span>Tell us about</span>
              <em>your project.</em>
            </h1>
          </div>

          <div className={styles.formPanel}>
            <div className={styles.formInner}>
              <div className={styles.formHeader}>
                <div>
                  <span>Start a project</span>
                  <strong>Project details</strong>
                </div>
                <Link href="/" aria-label="Return to VIC Premier home">Close ↗</Link>
              </div>
              <FreeQuoteForm />
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
