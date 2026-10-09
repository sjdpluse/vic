export type ServiceDefinition = {
  slug: string;
  title: string;
  shortTitle: string;
  summary: string;
  detail: string;
  image: string;
  imageAlt: string;
  highlights: string[];
};

export const services: ServiceDefinition[] = [
  {
    slug: "residential-construction-renovation",
    title: "Residential Construction & Renovation",
    shortTitle: "Residential construction & renovation",
    summary: "Residential construction and renovation work for existing and new spaces.",
    detail: "VIC PREMIER CONSTRUCTION TEAM works on residential construction and renovation projects with the scope shaped around the property, the work required and the intended finish.",
    image: "https://images.unsplash.com/photo-1768321916292-ade0ca9c091d?auto=format&fit=crop&w=1800&q=88",
    imageAlt: "Interior framing during a residential renovation",
    highlights: [
      "Residential construction and renovation scopes for existing or new spaces.",
      "Internal upgrades, alterations and practical improvements shaped around the property.",
      "Coordination with painting, tiling, rendering and carpentry where those trades form part of the same project.",
    ],
  },
  {
    slug: "commercial-construction-renovation",
    title: "Commercial Construction & Renovation",
    shortTitle: "Commercial construction & renovation",
    summary: "Commercial construction and renovation work shaped around the project scope.",
    detail: "Commercial construction and renovation work is planned around the site, the agreed scope and the practical requirements of the space.",
    image: "https://images.unsplash.com/photo-1761896171748-ca4e9c81b5de?auto=format&fit=crop&w=1800&q=88",
    imageAlt: "Commercial construction site with cranes and buildings",
    highlights: [
      "Construction and renovation work for commercial spaces.",
      "Alterations and upgrades planned around the site and agreed project scope.",
      "Coordination of related finishing work where required as part of the same project.",
    ],
  },
  {
    slug: "interior-exterior-painting",
    title: "Interior & Exterior Painting",
    shortTitle: "Interior & exterior painting",
    summary: "Interior and exterior painting with a focus on clean, high-quality finishes.",
    detail: "Interior and exterior painting can be delivered as standalone work or as part of a broader renovation, with preparation and finish considered as part of the job.",
    image: "https://images.unsplash.com/photo-1693985120993-e9b203ce7631?auto=format&fit=crop&w=1800&q=88",
    imageAlt: "Painter applying paint to a wall with a roller",
    highlights: [
      "Interior and exterior repainting for residential and commercial properties.",
      "Surface preparation and finishing considered as part of the painting scope.",
      "Painting coordinated with renovation or repair work when completed together.",
    ],
  },
  {
    slug: "roof-restoration",
    title: "Roof Restoration",
    shortTitle: "Roof restoration",
    summary: "Roof restoration work focused on durability, protection and finish.",
    detail: "Roof restoration work can be scoped around the existing roof condition and the renewal work required for the project.",
    image: "https://images.unsplash.com/photo-1727637598483-0c139a8fb48f?auto=format&fit=crop&w=1800&q=88",
    imageAlt: "Residential roof prepared for restoration work",
    highlights: [
      "Roof restoration work shaped around the existing roof condition.",
      "Renewal work focused on protection, presentation and practical longevity.",
      "Coordination with gutters, fascia and related exterior work where appropriate.",
    ],
  },
  {
    slug: "gutters",
    title: "Gutter Installation, Repair & Replacement",
    shortTitle: "Gutters & fascia",
    summary: "Gutter installation, repair and replacement for residential and commercial properties.",
    detail: "Gutter installation, repair and replacement can be coordinated with roof and exterior works where they form part of the same project scope.",
    image: "https://images.unsplash.com/photo-1634853982486-c06f0e17940f?auto=format&fit=crop&w=1800&q=88",
    imageAlt: "Rain gutter installed along a residential roof edge",
    highlights: [
      "New gutter installation for residential and commercial properties.",
      "Repair or replacement of worn and damaged gutter sections.",
      "Coordination with roof, fascia and other exterior work where required.",
    ],
  },
  {
    slug: "tiling",
    title: "Tiling",
    shortTitle: "Tiling",
    summary: "Tiling for kitchens, bathrooms and living areas.",
    detail: "Tiling work can be planned for kitchens, bathrooms and living areas with attention to layout, transitions and the surrounding finish.",
    image: "https://images.unsplash.com/photo-1523413363574-c30aa1c2a516?auto=format&fit=crop&w=1800&q=88",
    imageAlt: "Hands installing tiles during renovation work",
    highlights: [
      "Tiling for kitchens, bathrooms and living areas.",
      "Layouts and transitions considered in relation to surrounding finishes.",
      "Standalone tiling or tiling delivered as part of a broader renovation.",
    ],
  },
  {
    slug: "wall-rendering",
    title: "Wall Rendering",
    shortTitle: "Wall rendering",
    summary: "Wall rendering for renewed exterior and interior surfaces.",
    detail: "Wall rendering can be included in exterior or interior renewal work where the project requires a refreshed rendered surface.",
    image: "https://images.unsplash.com/photo-1768839725085-829e6ac7ac26?auto=format&fit=crop&w=1800&q=88",
    imageAlt: "Hands applying plaster to a wall with trowels",
    highlights: [
      "Rendering for exterior and interior wall surfaces.",
      "Renewal of tired or damaged rendered finishes where the scope allows.",
      "Rendering coordinated with painting and broader renovation work when required.",
    ],
  },
  {
    slug: "general-carpentry",
    title: "General Carpentry",
    shortTitle: "General carpentry",
    summary: "General carpentry for structural and finishing work.",
    detail: "General carpentry can support both construction and finishing work across residential and commercial projects.",
    image: "https://images.unsplash.com/photo-1769353086138-19ee65291a04?auto=format&fit=crop&w=1800&q=88",
    imageAlt: "Carpenter working with timber in a workshop",
    highlights: [
      "General carpentry for construction, renovation and finishing work.",
      "Repairs, alterations and practical timber-based improvements.",
      "Carpentry coordinated with broader residential or commercial project scopes.",
    ],
  },
];

export function getService(slug: string) {
  return services.find((service) => service.slug === slug) ?? null;
}
