import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";

export const metadata: Metadata = {
  title: "About | VIC Premier Construction Team",
  description: "About VIC Premier Construction Team and its residential and commercial construction and renovation services.",
};

export default function AboutPage() {
  return (
    <>
      <PublicHeader />
      <main id="main-content" className="about-page">
        <section className="intro section-shell" aria-labelledby="about-title">
          <div className="section-index">01 / Studio</div>
          <div className="intro__grid">
            <h1 id="about-title">Existing spaces, renewed with intent.</h1>
            <div className="intro__copy">
              <p className="intro__lead">VIC PREMIER CONSTRUCTION TEAM delivers residential and commercial construction and renovation services across Melbourne.</p>
              <p>The work spans renovation, painting, roof restoration, gutters, tiling, rendering and general carpentry. The focus is simple: a clear scope, considered workmanship and finishes that belong to the property rather than fight it.</p>
              <Link className="editorial-link" href="/#services">Explore our services <span aria-hidden="true">↗</span></Link>
            </div>
          </div>
          <div className="intro__statement" aria-hidden="true"><span>CONSTRUCT</span><i /><span>RENEW</span><i /><span>FINISH</span></div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
