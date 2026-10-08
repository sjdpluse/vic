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

const projectChecklist = [
  ["01", "Property", "Suburb or postcode and the type of property involved."],
  ["02", "Scope", "What needs to be built, repaired, restored or renovated."],
  ["03", "Timing", "When you would ideally like the work to begin."],
] as const;

export default function ConsultationPage() {
  return (
    <>
      <PublicHeader />
      <main id="main-content" className={styles.page}>
        <section className={styles.shell} aria-labelledby="consultation-title">
          <div className={styles.intro}>
            <div className={styles.eyebrow}>Project enquiry / Free quote</div>
            <h1 id="consultation-title">
              Tell us about
              <em> your project.</em>
            </h1>
            <p className={styles.lede}>
              Share the property, scope and timing. Add photos or plans if they help explain the work.
              VIC Premier will review the details and contact you about the next practical step.
            </p>

            <div className={styles.checklist} aria-label="Helpful project information">
              {projectChecklist.map(([index, title, copy]) => (
                <div className={styles.checkItem} key={index}>
                  <span>{index}</span>
                  <div>
                    <strong>{title}</strong>
                    <p>{copy}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.direct}>
              <span>Prefer to speak directly?</span>
              <a href="tel:+61411786573">0411 786 573 ↗</a>
              <a href="mailto:vicpremier_constructionteam@yahoo.com">Email VIC Premier ↗</a>
            </div>
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
