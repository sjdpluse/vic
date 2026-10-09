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

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 17 17 7M9 7h8v8" />
    </svg>
  );
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

      <section className={styles.hero} aria-labelledby="service-title">
        <img
          src={service.image}
          alt={service.imageAlt}
          className={styles.heroImage}
          loading="eager"
          fetchPriority="high"
          decoding="async"
        />
        <div className={styles.heroOverlay} aria-hidden="true" />

        <div className={styles.heroTopline}>
          <span>VIC PREMIER / SERVICE</span>
          <span>{String(index + 1).padStart(2, "0")} / {String(services.length).padStart(2, "0")}</span>
        </div>

        <div className={styles.heroContent}>
          <h1 id="service-title">{service.title}</h1>
          <div className={styles.heroSummary}>
            <span>Service overview</span>
            <p>{service.summary}</p>
          </div>
        </div>
      </section>

      <section className={styles.overview} aria-labelledby="overview-title">
        <div className={styles.sectionLabel}>
          <span>01</span>
          <span>Overview</span>
        </div>

        <div className={styles.overviewGrid}>
          <h2 id="overview-title">Work shaped around the property, the scope and the intended finish.</h2>
          <div className={styles.overviewCopy}>
            <p>{service.detail}</p>
            <p>
              Every enquiry starts with the property, the work required and the practical outcome you are looking for.
              Share the key details and any useful photos or plans so the scope can be reviewed clearly before the next step.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.scope} aria-labelledby="scope-title">
        <div className={styles.sectionLabel}>
          <span>02</span>
          <span>Scope</span>
        </div>

        <div className={styles.scopeHeader}>
          <h2 id="scope-title">What this service can include.</h2>
          <p>
            The final scope depends on the property and the work required. These are common ways this service can form part of a VIC Premier project.
          </p>
        </div>

        <div className={styles.scopeList}>
          {service.highlights.map((item, itemIndex) => (
            <article key={item}>
              <span>{String(itemIndex + 1).padStart(2, "0")}</span>
              <p>{item}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.projectCta} aria-labelledby="project-cta-title">
        <div>
          <span className={styles.ctaKicker}>03 / Project enquiry</span>
          <h2 id="project-cta-title">Have a project in mind?</h2>
          <p>Send the location, scope and any useful photos or plans. We can then review the information and discuss the next practical step.</p>
        </div>

        <Link href="/consultation" className={styles.cta}>
          <span>Start a project</span>
          <ArrowIcon />
        </Link>
      </section>

      <nav className={styles.serviceNav} aria-label="Other services">
        <Link href={`/services/${previous.slug}`} className={styles.previous}>
          <span>Previous service</span>
          <strong>← {previous.shortTitle}</strong>
        </Link>
        <Link href="/#services" className={styles.allServices}>All services</Link>
        <Link href={`/services/${next.slug}`} className={styles.next}>
          <span>Next service</span>
          <strong>{next.shortTitle} →</strong>
        </Link>
      </nav>

      <PublicFooter />
    </main>
  );
}
