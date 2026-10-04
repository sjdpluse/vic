import type { Metadata } from "next";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import styles from "../public-info.module.css";

export const metadata: Metadata = {
  title: "Privacy | VIC Premier Construction Team",
  description: "How VIC Premier Construction Team handles information submitted through the website.",
};

export default function PrivacyPage() {
  return (
    <>
      <PublicHeader />
      <main id="main-content" className={styles.page}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>VIC PREMIER / PRIVACY</p>
          <h1>Privacy and project enquiries.</h1>
          <p className={styles.lead}>This page explains how information sent through the VIC Premier website is used for project enquiries and contact.</p>
        </section>
        <section className={styles.content}>
          <article><h2>Information you provide</h2><p>The free quote form can collect your name, phone number or email address, suburb or postcode, requested service, project description, preferred timeframe and any optional photos, plans or PDF files you choose to attach.</p></article>
          <article><h2>How it is used</h2><p>The information is used to review your enquiry, understand the requested scope and contact you about the project. It is not collected through the form for unrelated marketing purposes.</p></article>
          <article><h2>Attachments</h2><p>Optional attachments are stored privately for authorised VIC Premier administration access. Do not upload documents containing information that is not needed to assess the project.</p></article>
          <article><h2>Website protection</h2><p>The enquiry form uses anti-spam and rate-limiting controls. Technical request information may be processed for fraud, abuse and security protection.</p></article>
          <article><h2>Contact</h2><p>Questions about information submitted through this website can be sent to <a href="mailto:vicpremier_constructionteam@yahoo.com">vicpremier_constructionteam@yahoo.com</a> or by calling <a href="tel:+61411786573">0411 786 573</a>.</p></article>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
