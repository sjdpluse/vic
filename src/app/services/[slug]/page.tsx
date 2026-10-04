import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getService, services } from "@/lib/services";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
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

  const index = services.findIndex((item) => item.slug === service.slug);
  const previous = services[(index - 1 + services.length) % services.length];
  const next = services[(index + 1) % services.length];

  return (
    <main className={styles.page} id="main-content">
      <PublicHeader />
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
      <nav className={styles.serviceNav} aria-label="Other services">
        <Link href={`/services/${previous.slug}`}>← {previous.shortTitle}</Link>
        <Link href="/#services">All services</Link>
        <Link href={`/services/${next.slug}`}>{next.shortTitle} →</Link>
      </nav>
      <PublicFooter />
    </main>
  );
}
