import Link from "next/link";
import styles from "./public-header.module.css";

type PublicHeaderProps = { overlay?: boolean };

export function PublicHeader({ overlay = false }: PublicHeaderProps) {
  return (
    <>
      <a className={styles.skip} href="#main-content">Skip to content</a>
      <header className={`${styles.header} ${overlay ? styles.overlay : ""}`}>
        <Link className={styles.wordmark} href="/" aria-label="VIC Premier Construction Team home">
          <span>VIC PREMIER</span>
          <small>CONSTRUCTION TEAM</small>
        </Link>
        <nav className={styles.nav} aria-label="Primary navigation">
          <Link href="/about">About</Link>
          <Link href="/#services">Services</Link>
          <Link href="/#selected-work">Selected Work</Link>
          <Link href="/contact">Contact</Link>
        </nav>
        <Link className={styles.quote} href="/consultation">Free quote <span aria-hidden="true">↗</span></Link>
        <details className={styles.mobile}>
          <summary aria-label="Open navigation menu">Menu</summary>
          <nav className={styles.panel} aria-label="Mobile navigation">
            <Link href="/">Home</Link>
            <Link href="/about">About</Link>
            <Link href="/#services">Services</Link>
            <Link href="/#selected-work">Selected Work</Link>
            <Link href="/#process">Process</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/consultation">Free quote</Link>
          </nav>
        </details>
      </header>
    </>
  );
}
