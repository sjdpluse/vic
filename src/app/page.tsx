import { HeroSequence } from "@/components/hero-sequence";

export default function Home() {
  return (
    <main>
      <HeroSequence />

      <section className="handoff" id="capabilities" aria-labelledby="capabilities-title">
        <div className="handoff__eyebrow">VIC Premier Construction Team</div>
        <div className="handoff__grid">
          <h2 id="capabilities-title">
            Existing spaces,
            <br />
            renewed with intent.
          </h2>
          <div className="handoff__copy">
            <p>
              Residential and commercial construction and renovation across Melbourne,
              with services spanning roof restoration, painting, rendering, tiling,
              guttering and general carpentry.
            </p>
            <a className="text-link" href="#consultation">
              Explore the next experience layer <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
        <div className="capability-line" aria-label="Selected services">
          <span>Roof restoration</span>
          <span>Exterior finishes</span>
          <span>Renovation</span>
          <span>Carpentry</span>
        </div>
      </section>

      <section className="prototype-end" id="consultation" aria-labelledby="prototype-end-title">
        <p className="prototype-end__index">Phase 0 / Prototype</p>
        <h2 id="prototype-end-title">The cinematic layer hands back to normal content.</h2>
        <p>
          This section deliberately remains simple: the current branch proves motion,
          loading, reversal and the hero-to-content transition without building the full site.
        </p>
      </section>
    </main>
  );
}
