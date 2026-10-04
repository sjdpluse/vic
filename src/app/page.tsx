import Link from "next/link";
import { HeroSequence } from "@/components/hero-sequence";
import { HomepageNavBridge } from "@/components/homepage-nav-bridge";
import { FreeQuoteForm } from "@/components/free-quote-form";
import { ServiceCarousel } from "@/components/service-carousel";
import { getPublishedProjects, projectCover } from "@/lib/projects";
import { services } from "@/lib/services";

export const dynamic = "force-dynamic";

const process = [
  ["01", "Start with the project", "Tell us what you are planning, where the property is and which service you need."],
  ["02", "Review the scope", "We review the information provided and arrange the next practical step for the project."],
  ["03", "Quote & planning", "Once the scope is understood, the work can be discussed and quoted before proceeding."],
] as const;

export default async function Home() {
  const projects = await getPublishedProjects(6);
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

      <section className="intro section-shell" id="about" aria-labelledby="about-title">
        <div className="intro__grid">
          <h2 id="about-title">About Us</h2>
          <div className="intro__copy">
            <p className="intro__lead">VIC PREMIER CONSTRUCTION TEAM delivers residential and commercial construction and renovation services across Melbourne.</p>
            <p>The work spans renovation, painting, roof restoration, gutters, tiling, rendering and general carpentry. The focus is simple: a clear scope, considered workmanship and finishes that belong to the property rather than fight it.</p>
            <Link className="editorial-link" href="/about">More about VIC Premier <span aria-hidden="true">↗</span></Link>
          </div>
        </div>
        <div className="intro__statement" aria-hidden="true"><span>CONSTRUCT</span><i /><span>RENEW</span><i /><span>FINISH</span></div>
      </section>

      <section className="services section-shell" id="services" aria-labelledby="services-title">
        <div className="section-heading"><div><div className="section-index section-index--light">02 / Capabilities</div><h2 id="services-title">Work that moves from structure to finish.</h2></div><p>A coordinated set of construction and finishing services for existing homes, commercial spaces and renovation projects.</p></div>
        <div className="services__list">{services.map((service,index)=><Link href={`/services/${service.slug}`} className="service-row" key={service.slug}><span className="service-row__index">{String(index+1).padStart(2,"0")}</span><h3>{service.shortTitle}</h3><p>{service.summary}</p><span className="service-row__arrow" aria-hidden="true">↗</span></Link>)}</div>
      </section>
      <section className="projects section-shell" id="projects" aria-labelledby="projects-title"><div className="section-index">03 / Selected work</div><div className="projects__heading"><h2 id="projects-title">Real work should carry the page.</h2><p>Selected projects are published here only from confirmed client-supplied content.</p></div>{projects.length>0?<div className="projects__canvas projects__canvas--live" aria-label="Selected projects">{projects.map((project,index)=>{const cover=projectCover(project);const shapeClass=index%3===1?"project-frame--portrait":index%3===2?"project-frame--square":"project-frame--wide";return <Link href={`/projects/${project.slug}`} className={`project-frame project-frame--live ${shapeClass}`} key={project.id} style={{padding:0,background:"#d7d4cc"}} aria-label={`View ${project.title}`}>{cover?<img src={cover.src} alt={cover.alt} loading="lazy" decoding="async" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",display:"block",zIndex:0}}/>:null}<div className="project-frame__overlay" style={{position:"absolute",inset:"auto 0 0 0",zIndex:2,display:"grid",gap:10,padding:"clamp(22px, 3vw, 42px)",color:"#fff",background:"linear-gradient(180deg, rgb(0 0 0 / 0%) 0%, rgb(0 0 0 / 70%) 100%)"}}><span style={{color:"inherit"}}>{project.title}</span>{project.summary?<small style={{color:"rgb(255 255 255 / 82%)",justifySelf:"start"}}>{project.summary}</small>:null}<small style={{color:"rgb(255 255 255 / 82%)",justifySelf:"start"}}>View project ↗</small></div></Link>})}</div>:<div className="projects__canvas" aria-label="Selected projects awaiting publication"><div className="project-frame project-frame--wide"><span>SELECTED WORK</span><small>Verified client project media will be published here.</small></div><div className="project-frame project-frame--portrait"><span>DETAIL</span><small>Project scope / finish / process</small></div><div className="project-frame project-frame--square"><span>COMING SOON</span><small>Only confirmed client-supplied work will appear here.</small></div></div>}</section>
      <section className="process section-shell" id="process" aria-labelledby="process-title"><div className="process__header"><div className="section-index">04 / Process</div><h2 id="process-title">A direct path from enquiry to the next step.</h2></div><div className="process__steps">{process.map(([index,title,copy])=><article key={index}><span>{index}</span><h3>{title}</h3><p>{copy}</p></article>)}</div></section>
      <section className="quote" id="consultation" aria-labelledby="quote-title"><div className="quote__grid"><div><div className="section-index section-index--light">05 / Start a project</div><h2 id="quote-title">Have a property that needs work?</h2><p style={{maxWidth:560,lineHeight:1.7,color:"rgb(255 255 255 / 76%)"}}>Free quotes are available. Send the project details and optional photos or plans. Attachments are stored privately for the VIC Premier team to review.</p></div><div className="quote__copy"><FreeQuoteForm /></div></div></section>
      <footer className="site-footer"><div className="site-footer__brand"><strong>VIC PREMIER</strong><span>CONSTRUCTION TEAM</span></div><div className="site-footer__meta"><span>Melbourne, Victoria</span><span>ABN 25 938 974 580</span><span>6 Windsor St, Hallam VIC 3803</span><Link href="/about">About</Link><Link href="/contact">Contact</Link><Link href="/privacy">Privacy</Link></div><a className="site-footer__top" href="#hero-title">Back to top ↑</a></footer>
    </main>
  );
}
