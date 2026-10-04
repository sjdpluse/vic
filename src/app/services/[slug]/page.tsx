import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getService, services } from "@/lib/services";
import styles from "./service.module.css";

type ServicePageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return services.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({ params }: ServicePageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) return {};
  return {
    title: `${service.title} | VIC Premier Construction Team`,
    description: service.summary,
  };
}

export default async function ServicePage({ params }: ServicePageProps) {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) notFound();

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/#services">← All services</Link>
        <Link href="/#consultation">Request a free quote ↗</Link>
      </header>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>VIC PREMIER / SERVICE</p>
        <h1>{service.title}</h1>
        <p className={styles.lead}>{service.summary}</p>
      </section>
      <section className={styles.body}>
        <div>
          <p className={styles.eyebrow}>SCOPE</p>
          <h2>Work shaped around the property and agreed project scope.</h2>
        </div>
        <div className={styles.copy}>
          <p>{service.detail}</p>
          <p>Send the property location, the work you need and any useful photos or plans through the free quote form. VIC Premier can then review the information and arrange the next practical step.</p>
          <Link className={styles.cta} href="/#consultation">Start a project ↗</Link>
        </div>
      </section>
      <footer className={styles.footer}>
        <strong>VIC PREMIER CONSTRUCTION TEAM</strong>
        <span>6 Windsor St, Hallam VIC 3803</span>
        <span>0411 786 573</span>
      </footer>
    </main>
  );
}
