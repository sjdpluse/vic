import Link from "next/link";
import { HeroSequence } from "@/components/hero-sequence";
import { HomepageNavBridge } from "@/components/homepage-nav-bridge";
import { FreeQuoteForm } from "@/components/free-quote-form";
import { ServiceCarousel } from "@/components/service-carousel";
import { SelectedWorkCarousel } from "@/components/selected-work-carousel";
import { services } from "@/lib/services";
import { getPublishedProjects, projectMediaUrl } from "@/lib/projects";
import aboutStyles from "./home-about.module.css";

export const dynamic = "force-dynamic";

const process = [
  ["01", "Start with the project", "Tell us what you are planning, where the property is and which service you need."],
  ["02", "Review the scope", "We review the information provided and arrange the next practical step for the project."],
  ["03", "Quote & planning", "Once the scope is understood, the work can be discussed and quoted before proceeding."],
] as const;

export default async function Home() {
  const publishedProjects = await getPublishedProjects(12);
  const selectedWorkCards = publishedProjects.flatMap((project) => {
    const before = project.project_media.find((item) => item.display_role === "before" && item.media_type === "image");
    const after = project.project_media.find((item) => item.display_role === "after" && item.media_type === "image");
    if (!before || !after) return [];
    return [{
      id: project.id,
      title: project.title,
      beforeSrc: projectMediaUrl(before),
      afterSrc: projectMediaUrl(after),
      beforeAlt: before.alt_text || `${project.title} before renovation`,
      afterAlt: after.alt_text || `${project.title} after renovation`,
    }];
  });

  const localBusiness = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "VIC PREMIER CONSTRUCTION TEAM",
    identifier: "ABN 25 938 974 580",
    telephone: "+61411786573",
    email: "vicpremier_constructionteam@yahoo.com",
    address: {
      "@type": "PostalAddress",
      streetAddress: "6 Windsor St",
      addressLocality: "Hallam",
      addressRegion: "VIC",
      postalCode: "3803",
      addressCountry: "AU",
    },
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusiness) }} />
      <HeroSequence />
      <HomepageNavBridge />
      <ServiceCarousel services={services} />

      <section className={aboutStyles.section} id="about" aria-labelledby="about-title">
        <div className={aboutStyles.header}>
          <div className={aboutStyles.titleWrap}>
            <h2 id="about-title" className={aboutStyles.title}>about us</h2>
            <div className={aboutStyles.micro} aria-hidden="true"><span>construction</span><span>renovation</span></div>
          </div>
          <span className={aboutStyles.star} aria-hidden="true">✦</span>
        </div>

        <div className={aboutStyles.statementRow}>
          <p className={aboutStyles.statement}>
            <span className={aboutStyles.accent}>We renew homes and commercial spaces</span> with a clear idea: every detail should earn its place. <span className={aboutStyles.pill} aria-hidden="true" /> From structure to finish, we bring renovation, painting, roof restoration, gutters, tiling, rendering and carpentry together into <span className={aboutStyles.accent}>spaces that feel resolved, cohesive and distinctly yours.</span>
          </p>
        </div>

        <div className={aboutStyles.footer}>
          <Link className={aboutStyles.link} href="/about">Discover VIC Premier <span aria-hidden="true">↗</span></Link>
        </div>
      </section>

      <SelectedWorkCarousel cards={selectedWorkCards} />

      <section className="process section-shell" id="process" aria-labelledby="process-title"><div className="process__header"><h2 id="process-title">A direct path from enquiry to the next step.</h2></div><div className="process__steps">{process.map(([index,title,copy])=><article key={index}><span>{index}</span><h3>{title}</h3><p>{copy}</p></article>)}</div></section>
      <section className="quote" id="consultation" aria-labelledby="quote-title"><div className="quote__grid"><div><div className="section-index section-index--light">05 / Start a project</div><h2 id="quote-title">Have a property that needs work?</h2><p style={{maxWidth:560,lineHeight:1.7,color:"rgb(255 255 255 / 76%)"}}>Free quotes are available. Send the project details and optional photos or plans. Attachments are stored privately for the VIC Premier team to review.</p></div><div className="quote__copy"><FreeQuoteForm /></div></div></section>
      <footer className="site-footer"><div className="site-footer__brand"><strong>VIC PREMIER</strong><span>CONSTRUCTION TEAM</span></div><div className="site-footer__meta"><span>Melbourne, Victoria</span><span>ABN 25 938 974 580</span><span>6 Windsor St, Hallam VIC 3803</span><Link href="/about">About</Link><Link href="/contact">Contact</Link><Link href="/privacy">Privacy</Link></div><a className="site-footer__top" href="#hero-title">Back to top ↑</a></footer>
    </main>
  );
}
