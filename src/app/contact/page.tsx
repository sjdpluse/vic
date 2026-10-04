import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import styles from "../public-info.module.css";

export const metadata: Metadata = {
  title: "Contact | VIC Premier Construction Team",
  description: "Contact VIC Premier Construction Team about construction, renovation and finishing work in Melbourne.",
};

export default function ContactPage() {
  return (
    <>
      <PublicHeader />
      <main id="main-content" className={styles.page}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>VIC PREMIER / CONTACT</p>
          <h1>Start with the project.</h1>
          <p className={styles.lead}>Send the scope, property location and any useful photos or plans through the free quote form, or contact VIC Premier directly.</p>
        </section>
        <section className={styles.content}>
          <article><h2>Phone</h2><p><a href="tel:+61411786573">0411 786 573</a></p></article>
          <article><h2>Email</h2><p><a href="mailto:vicpremier_constructionteam@yahoo.com">vicpremier_constructionteam@yahoo.com</a></p></article>
          <article><h2>Address</h2><p>6 Windsor St, Hallam VIC 3803, Australia</p></article>
          <article><h2>Business</h2><p>VIC PREMIER CONSTRUCTION TEAM<br />ABN 25 938 974 580</p></article>
          <article><h2>Free quote</h2><p><Link href="/#consultation">Open the project enquiry form ↗</Link></p></article>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
