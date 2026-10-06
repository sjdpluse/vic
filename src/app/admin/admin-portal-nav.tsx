"use client";

import Image from "next/image";
import Link from "next/link";
import styles from "./admin-portal-nav.module.css";

export function AdminPortalNav() {
  return (
    <div className={styles.wrap}>
      <Link href="/" className={styles.brand} aria-label="VIC Premier home">
        <span className={styles.logoWrap}>
          <Image src="/brand-logo.webp" alt="" width={52} height={42} className={styles.logo} priority />
        </span>
        <span className={styles.brandCopy}>
          <strong>VIC PREMIER</strong>
          <small>CONSTRUCTION TEAM</small>
        </span>
      </Link>

      <nav className={styles.switcher} aria-label="Admin sections">
        <Link href="/admin/enquiries" className={styles.active} aria-current="page">
          <span className={styles.navIcon} aria-hidden="true">✉</span>
          <span>Enquiries</span>
        </Link>
      </nav>

      <Link href="/" className={styles.viewSite} target="_blank" rel="noreferrer">
        View site <span aria-hidden="true">↗</span>
      </Link>
    </div>
  );
}
