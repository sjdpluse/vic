import Link from "next/link";
import styles from "./public-footer.module.css";

export function PublicFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.brand}><strong>VIC PREMIER</strong><span>CONSTRUCTION TEAM</span></div>
      <div className={styles.meta}><span>Melbourne, Victoria</span><span>ABN 25 938 974 580</span><span>6 Windsor St, Hallam VIC 3803</span></div>
      <div className={styles.actions}><a href="tel:+61411786573">0411 786 573</a><a href="mailto:vicpremier_constructionteam@yahoo.com">Email</a><Link href="/#consultation">Free quote ↗</Link></div>
    </footer>
  );
}
