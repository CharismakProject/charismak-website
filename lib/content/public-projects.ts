import { projects, type Project } from "@/app/site-data";

type ProjectOverride = Partial<Project>;

const overrides: Record<string, ProjectOverride> = {
  "coco-gwarimpa-project": {
    title: "COCO Gwarimpa Showroom, Office & Workshop",
    heroTitle: "Renovation and completion of a multi-use commercial facility in Gwarimpa, Abuja.",
    role: "Main Contractor",
    client: undefined,
    summary:
      "Renovation and completion works for a combined showroom, office and workshop facility in Gwarimpa. Charismak coordinated the remaining building works, finishes, services interfaces and close-out activities required to bring the facility into operational use.",
    attribution: "Direct Charismak contract.",
    services: [
      "Renovation & Completion",
      "Project Management",
      "Construction Coordination",
      "Building Services Coordination",
      "Architectural Finishing",
      "Close-out Works",
    ],
  },
  "flawless-spa-renovation": {
    heroTitle: "Interior renovation and finishing for a contemporary wellness environment.",
    summary:
      "Specialist renovation and finishing works for a premium wellness space in Abuja, covering interior finishes, ceiling and wall treatments, lighting coordination, fittings and detailed close-out.",
    attribution: "Specialist subcontract works delivered by Charismak Project Nigeria Limited.",
  },
  "jahi-project-development": {
    heroTitle: "Specialist construction delivery for a residential development in Jahi, Abuja.",
    summary:
      "Specialist construction works within an ongoing residential development in Jahi, including masonry, temporary works, ceiling and tiling activities, plumbing coordination, finishing works and quality monitoring.",
    attribution: "Specialist subcontract works delivered by Charismak Project Nigeria Limited.",
  },
  "djibouti-residential-estate": {
    heroTitle: "International quantity surveying and construction delivery experience in Djibouti.",
    summary:
      "Residential estate experience with ERSA Construction SARL covering measurement, valuation, cost control, quantity surveying, construction supervision and multidisciplinary project coordination.",
    attribution: "Professional experience with ERSA Construction SARL.",
  },
  "steel-fabrication-km-steel": {
    heroTitle: "Commercial and technical experience across structural steel fabrication and installation.",
    summary:
      "Structural steel and fabrication experience with KM Steel & Structure, including measurement, cost review, production monitoring, valuation, installation coordination and site delivery support.",
    attribution: "Professional experience with KM Steel & Structure.",
  },
  "office-renovation-cannon": {
    heroTitle: "Commercial renovation and completion supported by cost and site coordination.",
    summary:
      "Office renovation and completion experience with Cannon Projects covering measurement, cost monitoring, procurement coordination, interior finishes, ceiling works, fittings and progress reporting.",
    attribution: "Professional experience with Cannon Projects.",
  },
  "block-of-flats-cvl": {
    heroTitle: "Residential cost management and construction coordination experience.",
    summary:
      "Block-of-flats experience with Cannon Projects covering measurement, bill preparation, procurement review, valuation, cost monitoring and construction coordination.",
    attribution: "Professional experience with Cannon Projects.",
  },
  "hillside-mansions": {
    heroTitle: "Premium residential delivery experience supported by commercial control.",
    summary:
      "Residential mansion development experience with Cannon Projects covering cost planning, measurement, valuation, procurement review, technical coordination and construction monitoring.",
    attribution: "Professional experience with Cannon Projects.",
  },
  "hilltop-pentagon": {
    heroTitle: "Cost management and project coordination experience on building developments in Maitama.",
    summary:
      "Building development experience with Cannon Projects covering quantity surveying, cost reporting, contractor valuation, procurement coordination and construction monitoring.",
    attribution: "Professional experience with Cannon Projects.",
  },
  "architectural-department-building": {
    heroTitle: "Institutional building experience supported by quantity surveying and cost control.",
    summary:
      "Institutional construction experience with Three O's Nigeria Limited covering measurement, bill preparation, valuation, materials assessment, cost control and construction coordination.",
    attribution: "Professional experience with Three O's Nigeria Limited.",
  },
  "residential-development-asiwaju": {
    heroTitle: "Residential quantity surveying and cost management experience.",
    summary:
      "Private residential development experience with Three O's Nigeria Limited covering quantity take-off, cost planning, valuation, procurement support and construction monitoring.",
    attribution: "Professional experience with Three O's Nigeria Limited.",
  },
  "block-of-flats-asokoro": {
    heroTitle: "Residential quantity surveying and commercial coordination in Asokoro, Abuja.",
    summary:
      "Block-of-flats experience with Cannon Projects covering measurement, cost control, contractor valuation, procurement review and construction coordination.",
    attribution: "Professional experience with Cannon Projects.",
  },
};

export const publicProjects: Project[] = projects
  .filter((project) => project.slug !== "block-of-flats-student-hostels")
  .map((project) => ({ ...project, ...(overrides[project.slug] ?? {}) }));

export const publicProjectBySlug = (slug: string) =>
  publicProjects.find((project) => project.slug === slug);
