"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./admin-portal-nav.module.css";

export function AdminPortalNav() {
  const pathname = usePathname();
  const onSelectedWork = pathname === "/admin";
  const onEnquiries = pathname.startsWith("/admin/enquiries");
  return (
    <div className={styles.wrap}>
      <Link href="/" className={styles.brand} aria-label="VIC Premier home">
        <span className={styles.logoWrap}><Image src="/brand-logo.webp" alt="" width={52} height={42} className={styles.logo} priority /></span>
        <span className={styles.brandCopy}><strong>VIC PREMIER</strong><small>CONSTRUCTION TEAM</small></span>
      </Link>
      <nav className={styles.switcher} aria-label="Admin sections">
        <Link href="/admin" className={onSelectedWork ? styles.active : undefined} aria-current={onSelectedWork ? "page" : undefined}><span className={styles.navIcon} aria-hidden="true">◫</span><span>Selected Work</span></Link>
        <Link href="/admin/enquiries" className={onEnquiries ? styles.active : undefined} aria-current={onEnquiries ? "page" : undefined}><span className={styles.navIcon} aria-hidden="true">✉</span><span>Enquiries</span></Link>
      </nav>
      <Link href="/" className={styles.viewSite} target="_blank" rel="noreferrer">View site <span aria-hidden="true">↗</span></Link>
    </div>
  );
}
