import Image from "next/image";
import Link from "next/link";
import { services } from "@/lib/services";
import styles from "./public-footer.module.css";

type IconName = "arrow" | "phone" | "mail" | "pin";

function Icon({ name }: { name: IconName }) {
  if (name === "arrow") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 17 17 7M9 7h8v8" />
      </svg>
    );
  }

  if (name === "phone") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7.4 3.8 10 8.5 7.9 10c1.1 2.5 3.1 4.5 5.6 5.6l1.5-2.1 4.7 2.6-.7 3.1c-.2.9-1 1.5-1.9 1.5C9.5 20.7 3.3 14.5 3.3 6.9c0-.9.6-1.7 1.5-1.9l2.6-.6Z" />
      </svg>
    );
  }

  if (name === "mail") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
        <path d="m5 7 7 5 7-5" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z" />
      <circle cx="12" cy="10" r="2.2" />
    </svg>
  );
}

const siteLinks = [
  ["Home", "/"],
  ["About", "/about"],
  ["Projects", "/#selected-work"],
  ["Free quote", "/consultation"],
  ["Contact", "/contact"],
  ["Privacy", "/privacy"],
] as const;

export function PublicFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.top}>
        <div className={styles.brandColumn}>
          <Link href="/" className={styles.brand} aria-label="VIC Premier Construction Team home">
            <span className={styles.logoWrap}>
              <Image
                src="/images/vic-premier-logo.webp"
                alt=""
                aria-hidden="true"
                width={180}
                height={120}
                className={styles.logo}
              />
            </span>
            <span className={styles.brandCopy}>
              <strong>VIC PREMIER</strong>
              <small>CONSTRUCTION TEAM</small>
            </span>
          </Link>

          <p className={styles.brandIntro}>
            Construction, renovation and property improvement work delivered across Melbourne with a clear focus on scope, finish and detail.
          </p>

          <Link href="/consultation" className={styles.primaryCta}>
            <span>Start a project</span>
            <Icon name="arrow" />
          </Link>
        </div>

        <div className={styles.servicesColumn}>
          <p className={styles.label}>Services</p>
          <nav className={styles.serviceLinks} aria-label="Services">
            {services.map((service) => (
              <Link key={service.slug} href={`/services/${service.slug}`}>
                <span>{service.shortTitle}</span>
                <Icon name="arrow" />
              </Link>
            ))}
          </nav>
        </div>

        <div className={styles.exploreColumn}>
          <p className={styles.label}>Explore</p>
          <nav className={styles.siteLinks} aria-label="Site links">
            {siteLinks.map(([label, href]) => (
              <Link key={href} href={href}>
                <span>{label}</span>
                <Icon name="arrow" />
              </Link>
            ))}
          </nav>
        </div>

        <div className={styles.contactColumn}>
          <p className={styles.label}>Contact</p>
          <div className={styles.contactList}>
            <a href="tel:+61411786573">
              <span className={styles.icon}><Icon name="phone" /></span>
              <span><small>Call</small>0411 786 573</span>
            </a>
            <a href="mailto:vicpremier_constructionteam@yahoo.com">
              <span className={styles.icon}><Icon name="mail" /></span>
              <span><small>Email</small>vicpremier_constructionteam@yahoo.com</span>
            </a>
            <a href="https://www.google.com/maps/search/?api=1&query=6+Windsor+St+Hallam+VIC+3803" target="_blank" rel="noreferrer">
              <span className={styles.icon}><Icon name="pin" /></span>
              <span><small>Visit</small>6 Windsor St, Hallam VIC 3803</span>
            </a>
          </div>
        </div>
      </div>

      <div className={styles.bottom}>
        <div>
          <span>Melbourne, Victoria</span>
          <span>ABN 25 938 974 580</span>
        </div>
        <span>© {new Date().getFullYear()} VIC Premier Construction Team</span>
      </div>
    </footer>
  );
}
