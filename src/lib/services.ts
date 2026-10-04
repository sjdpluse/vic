export type ServiceDefinition = {
  slug: string;
  title: string;
  shortTitle: string;
  summary: string;
  detail: string;
};

export const services: ServiceDefinition[] = [
  {
    slug: "residential-construction-renovation",
    title: "Residential Construction & Renovation",
    shortTitle: "Residential construction & renovation",
    summary: "Residential construction and renovation work for existing and new spaces.",
    detail: "VIC PREMIER CONSTRUCTION TEAM works on residential construction and renovation projects with the scope shaped around the property, the work required and the intended finish.",
  },
  {
    slug: "commercial-construction-renovation",
    title: "Commercial Construction & Renovation",
    shortTitle: "Commercial construction & renovation",
    summary: "Commercial construction and renovation work shaped around the project scope.",
    detail: "Commercial construction and renovation work is planned around the site, the agreed scope and the practical requirements of the space.",
  },
  {
    slug: "interior-exterior-painting",
    title: "Interior & Exterior Painting",
    shortTitle: "Interior & exterior painting",
    summary: "Interior and exterior painting with a focus on clean, high-quality finishes.",
    detail: "Interior and exterior painting can be delivered as standalone work or as part of a broader renovation, with preparation and finish considered as part of the job.",
  },
  {
    slug: "roof-restoration",
    title: "Roof Restoration",
    shortTitle: "Roof restoration",
    summary: "Roof restoration work focused on durability, protection and finish.",
    detail: "Roof restoration work can be scoped around the existing roof condition and the renewal work required for the project.",
  },
  {
    slug: "gutters",
    title: "Gutter Installation, Repair & Replacement",
    shortTitle: "Gutters & fascia",
    summary: "Gutter installation, repair and replacement for residential and commercial properties.",
    detail: "Gutter installation, repair and replacement can be coordinated with roof and exterior works where they form part of the same project scope.",
  },
  {
    slug: "tiling",
    title: "Tiling",
    shortTitle: "Tiling",
    summary: "Tiling for kitchens, bathrooms and living areas.",
    detail: "Tiling work can be planned for kitchens, bathrooms and living areas with attention to layout, transitions and the surrounding finish.",
  },
  {
    slug: "wall-rendering",
    title: "Wall Rendering",
    shortTitle: "Wall rendering",
    summary: "Wall rendering for renewed exterior and interior surfaces.",
    detail: "Wall rendering can be included in exterior or interior renewal work where the project requires a refreshed rendered surface.",
  },
  {
    slug: "general-carpentry",
    title: "General Carpentry",
    shortTitle: "General carpentry",
    summary: "General carpentry for structural and finishing work.",
    detail: "General carpentry can support both construction and finishing work across residential and commercial projects.",
  },
];

export function getService(slug: string) {
  return services.find((service) => service.slug === slug) ?? null;
}
