import { HeroSequence } from "@/components/hero-sequence";
import { SiteIntro } from "@/components/site-intro";
import { HomeAboutShowcase } from "./home-about-showcase";
import { HomepageNavBridge } from "@/components/homepage-nav-bridge";
import { PublicFooter } from "@/components/public-footer";
import { ServiceCarousel } from "@/components/service-carousel";
import { SelectedWorkCarousel } from "@/components/selected-work-carousel";
import { services } from "@/lib/services";
import { getSelectedWorkCards } from "@/lib/selected-work";
import { getHeroCloudMedia } from "@/lib/hero-clouds";

export const dynamic = "force-dynamic";

const process = [
  ["01", "Start with the project", "Tell us what you are planning, where the property is and which service you need."],
  ["02", "Review the scope", "We review the information provided and arrange the next practical step for the project."],
  ["03", "Quote & planning", "Once the scope is understood, the work can be discussed and quoted before proceeding."],
] as const;

export default async function Home() {
  const [selectedWorkCards, heroClouds] = await Promise.all([
    getSelectedWorkCards(),
    getHeroCloudMedia(),
  ]);

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
      <SiteIntro />
      <HeroSequence clouds={heroClouds} />
      <HomepageNavBridge />
      <ServiceCarousel services={services} />

      <HomeAboutShowcase cards={selectedWorkCards} />

      <SelectedWorkCarousel cards={selectedWorkCards} />

      <section className="process section-shell" id="process" aria-labelledby="process-title"><div className="process__header"><h2 id="process-title">A direct path from enquiry to the next step.</h2></div><div className="process__steps">{process.map(([index,title,copy])=><article key={index}><span>{index}</span><h3>{title}</h3><p>{copy}</p></article>)}</div></section>
      <PublicFooter />
    </main>
  );
}
