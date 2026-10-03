import { HeroSequence } from "@/components/hero-sequence";

const services = [
  {
    index: "01",
    title: "Residential construction & renovation",
    copy: "Considered upgrades, alterations and renovation work for homes, shaped around the existing building and the intended finish.",
  },
  {
    index: "02",
    title: "Commercial construction & renovation",
    copy: "Construction and renovation support for commercial spaces with an emphasis on clear scope, durable finishes and coordinated delivery.",
  },
  {
    index: "03",
    title: "Interior & exterior painting",
    copy: "Interior and exterior painting focused on preparation, finish quality and a clean final presentation.",
  },
  {
    index: "04",
    title: "Roof restoration",
    copy: "Roof restoration work intended to renew the appearance and help protect the existing roof system.",
  },
  {
    index: "05",
    title: "Gutters & fascia",
    copy: "Gutter installation, repair and replacement, coordinated with exterior renewal and roof-related work where required.",
  },
  {
    index: "06",
    title: "Tiling",
    copy: "Tiling for kitchens, bathrooms and living areas with attention to alignment, transitions and the surrounding finish.",
  },
  {
    index: "07",
    title: "Wall rendering",
    copy: "Rendering for renewed exterior and interior wall surfaces, prepared as part of a broader finishing system.",
  },
  {
    index: "08",
    title: "General carpentry",
    copy: "General carpentry for structural and finishing work across residential and commercial projects.",
  },
] as const;

const process = [
  ["01", "Start with the project", "Tell us what you are planning, where the property is and which service you need."],
  ["02", "Review the scope", "We review the information provided and arrange the next practical step for the project."],
  ["03", "Quote & planning", "Once the scope is understood, the work can be discussed and quoted before proceeding."],
] as const;

function ArrowIcon() {
  return <span aria-hidden="true">↗</span>;
}

export default function Home() {
  return (
    <main>
      <HeroSequence />

      <section className="intro section-shell" id="about" aria-labelledby="intro-title">
        <div className="section-index">01 / Studio</div>
        <div className="intro__grid">
          <h2 id="intro-title">Existing spaces, renewed with intent.</h2>
          <div className="intro__copy">
            <p className="intro__lead">
              VIC PREMIER CONSTRUCTION TEAM delivers residential and commercial construction
              and renovation services across Melbourne.
            </p>
            <p>
              The work spans renovation, painting, roof restoration, gutters, tiling,
              rendering and general carpentry. The focus is simple: a clear scope, considered
              workmanship and finishes that belong to the property rather than fight it.
            </p>
            <a className="editorial-link" href="#services">
              Explore our services <ArrowIcon />
            </a>
          </div>
        </div>
        <div className="intro__statement" aria-hidden="true">
          <span>CONSTRUCT</span>
          <i />
          <span>RENEW</span>
          <i />
          <span>FINISH</span>
        </div>
      </section>

      <section className="services section-shell" id="services" aria-labelledby="services-title">
        <div className="section-heading">
          <div>
            <div className="section-index section-index--light">02 / Capabilities</div>
            <h2 id="services-title">Work that moves from structure to finish.</h2>
          </div>
          <p>
            A coordinated set of construction and finishing services for existing homes,
            commercial spaces and renovation projects.
          </p>
        </div>

        <div className="services__list">
          {services.map((service) => (
            <article className="service-row" key={service.index}>
              <span className="service-row__index">{service.index}</span>
              <h3>{service.title}</h3>
              <p>{service.copy}</p>
              <span className="service-row__arrow" aria-hidden="true">↗</span>
            </article>
          ))}
        </div>
      </section>

      <section className="projects section-shell" id="projects" aria-labelledby="projects-title">
        <div className="section-index">03 / Selected work</div>
        <div className="projects__heading">
          <h2 id="projects-title">Real work should carry the page.</h2>
          <p>
            This area is reserved for client-supplied project photography. Project names,
            locations and scopes will only be shown when they are confirmed.
          </p>
        </div>

        <div className="projects__canvas" aria-label="Project gallery placeholder awaiting verified project media">
          <div className="project-frame project-frame--wide">
            <span>PROJECT MEDIA</span>
            <small>Featured project / awaiting verified content</small>
          </div>
          <div className="project-frame project-frame--portrait">
            <span>DETAIL</span>
            <small>Material / finish / process</small>
          </div>
          <div className="project-frame project-frame--square">
            <span>PROJECT MEDIA</span>
            <small>Additional selected work</small>
          </div>
        </div>
      </section>

      <section className="process section-shell" id="process" aria-labelledby="process-title">
        <div className="process__header">
          <div className="section-index">04 / Process</div>
          <h2 id="process-title">A direct path from enquiry to the next step.</h2>
        </div>
        <div className="process__steps">
          {process.map(([index, title, copy]) => (
            <article key={index}>
              <span>{index}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="quote" id="consultation" aria-labelledby="quote-title">
        <div className="quote__grid">
          <div>
            <div className="section-index section-index--light">05 / Start a project</div>
            <h2 id="quote-title">Have a property that needs work?</h2>
          </div>
          <div className="quote__copy">
            <p>
              Free quotes are available. Share the service you need and a short outline of
              the project so the next step can be arranged.
            </p>
            <div className="quote__actions">
              <a href="tel:+61411786573" aria-label="Call VIC Premier Construction Team">
                <span>Call us</span><ArrowIcon />
              </a>
              <a href="mailto:vicpremier_constructionteam@yahoo.com" aria-label="Email VIC Premier Construction Team">
                <span>Email us</span><ArrowIcon />
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="site-footer__brand">
          <strong>VIC PREMIER</strong>
          <span>CONSTRUCTION TEAM</span>
        </div>
        <div className="site-footer__meta">
          <span>Melbourne, Victoria</span>
          <span>ABN 25 938 974 580</span>
          <span>6 Windsor St, Hallam VIC 3803</span>
        </div>
        <a className="site-footer__top" href="#hero-title">Back to top ↑</a>
      </footer>
    </main>
  );
}
