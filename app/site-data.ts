import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  Building2,
  ClipboardCheck,
  DraftingCompass,
  Factory,
  FileText,
  Hammer,
  HardHat,
  Home,
  Lightbulb,
  ShieldCheck,
  Users,
  Wrench,
} from "lucide-react";

export const brand = {
  navy: "#0D3B66",
  deepNavy: "#071E33",
  orange: "#A82B05",
  darkOrange: "#8B1E00",
  gold: "#C8A45D",
  brightGold: "#F2B544",
  charcoal: "#151B22",
  grey: "#3A4653",
  light: "#F5F7FA",
  white: "#FFFFFF",
};

/** Canonical fallbacks. Public pages prefer the managed CMS values. */
export const company = {
  name: "Charismak Project Nigeria Limited",
  shortName: "Charismak",
  tagline: "Design, Cost & Build",
  rcNumber: "RC No: 1982890",
  logo: "/Images/logo/logo.png",
  email: "info@charismakproject.com",
  emailAliases: [
    "md@charismakproject.com",
    "projects@charismakproject.com",
    "account@charismakproject.com",
    "secretary@charismakproject.com",
  ],
  phones: ["+234 706 661 9598"],
  addresses: ["Sankuru Close, off El-Amin Street, Maitama, Abuja"],
  about:
    "Charismak Project Nigeria Limited is a registered Nigerian construction company providing building construction, civil engineering, renovation, steel fabrication, project management, technical consultancy, facility maintenance and architectural finishing services.",
  overview:
    "We combine practical construction experience, technical competence, commercial awareness, quality supervision and transparent communication to support clients from project planning through execution and handover.",
  vision:
    "To become a trusted benchmark for construction delivery, engineering excellence and professional project execution across Nigeria and Africa.",
  mission:
    "To deliver reliable construction, engineering, renovation, fabrication and project management solutions through integrity, accountability, technical competence and client-focused service.",
  values: [
    "Integrity",
    "Transparency",
    "Professionalism",
    "Technical Excellence",
    "Client Satisfaction",
  ],
  profilePdf: "/company-profile.pdf",
  mdProfilePdf: "/documents/company-profile.pdf",
};

export type Service = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export type ProjectCategory = "Charismak Project" | "MD Professional Experience";
export type EngagementTag =
  | "Direct Contract"
  | "Subcontract"
  | "Consultancy"
  | "Supervision"
  | "Quantity Surveying"
  | "Expatriate Experience";

export type Project = {
  slug: string;
  title: string;
  heroTitle?: string;
  publicCategory: ProjectCategory;
  engagementTag: EngagementTag;
  role: string;
  organisation: string;
  location: string;
  status: string;
  client?: string;
  summary: string;
  attribution: string;
  cover: string;
  heroImages: string[];
  images: string[];
  videos: string[];
  services: string[];
  featured?: boolean;
  showOnProjectsPage?: boolean;
};

export type Person = {
  name: string;
  role: string;
  image: string;
  group: "Active Team" | "Supporting Team";
  category: string;
  bio: string;
};

export type InspirationItem = {
  title: string;
  category: string;
  description: string;
  image: string;
  link: string;
};

export type ResourceItem = {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
};

function projectGallery(folder: string, count = 5, extension = "jpg"): string[] {
  return Array.from(
    { length: count },
    (_, index) => `/Images/Projects/${folder}/${String(index + 1).padStart(2, "0")}.${extension}`,
  );
}

function projectCover(folder: string, extension = "jpg"): string {
  return `/Images/Projects/${folder}/cover.${extension}`;
}

function projectHero(folder: string, extension = "jpg"): string {
  return `/Images/Projects/${folder}/hero.${extension}`;
}

export const services: Service[] = [
  {
    title: "Building Construction",
    description:
      "Residential, commercial and institutional building construction delivered through planning, supervision, quality workmanship and structured execution.",
    icon: Building2,
  },
  {
    title: "Civil Engineering",
    description:
      "Civil works, concrete structures, drainage, external works and infrastructure support delivered with technical control.",
    icon: HardHat,
  },
  {
    title: "Renovation & Remodeling",
    description:
      "Interior and exterior transformation including ceilings, wall finishes, lighting coordination, fittings and complete space upgrades.",
    icon: Hammer,
  },
  {
    title: "Project Management",
    description:
      "Project planning, procurement coordination, progress reporting, contractor supervision, cost awareness and delivery control.",
    icon: ClipboardCheck,
  },
  {
    title: "Steel Fabrication",
    description:
      "Fabrication and installation of gates, structural frames, railings, roofing supports and customised steel solutions.",
    icon: Factory,
  },
  {
    title: "Facility Maintenance",
    description:
      "Building inspections, repairs, preventive maintenance, operational support and facility improvement solutions.",
    icon: Wrench,
  },
  {
    title: "Architectural Finishing",
    description:
      "Tiling, screeding, painting, ceilings, facade detailing, fittings and premium finishing coordination.",
    icon: DraftingCompass,
  },
  {
    title: "Residential Development",
    description:
      "Residential developments focused on durability, planning efficiency, quality construction and long-term value.",
    icon: Home,
  },
];

/**
 * Clean migration fallback for the project CMS. Keep this list aligned with the
 * approved public portfolio so a CMS outage cannot resurrect removed/incorrect work.
 */
export const projects: Project[] = [
  {
    slug: "coco-gwarimpa-project",
    title: "COCO Gwarimpa Showroom, Office & Workshop",
    heroTitle:
      "Renovation and completion of a multi-use commercial facility in Gwarimpa, Abuja.",
    publicCategory: "Charismak Project",
    engagementTag: "Direct Contract",
    role: "Main Contractor",
    organisation: "Charismak Project Nigeria Limited",
    location: "Gwarimpa, Abuja",
    status: "Completed",
    summary:
      "Renovation and completion works for a combined showroom, office and workshop facility in Gwarimpa. Charismak coordinated the remaining building works, finishes, services interfaces and close-out activities required to bring the facility into operational use.",
    attribution: "Direct Charismak contract.",
    cover: projectCover("coco"),
    heroImages: [projectHero("coco"), projectCover("coco")],
    images: projectGallery("coco", 10),
    videos: [],
    services: [
      "Renovation & Completion",
      "Project Management",
      "Construction Coordination",
      "Building Services Coordination",
      "Architectural Finishing",
      "Close-out Works",
    ],
    featured: true,
    showOnProjectsPage: true,
  },
  {
    slug: "flawless-spa-renovation",
    title: "Flawless Spa Renovation",
    heroTitle: "Interior renovation and finishing for a contemporary wellness environment.",
    publicCategory: "Charismak Project",
    engagementTag: "Subcontract",
    role: "Specialist Subcontractor",
    organisation: "Charismak Project Nigeria Limited",
    location: "Abuja, Nigeria",
    status: "Completed",
    client: "Flawless Spa",
    summary:
      "Specialist renovation and finishing works for a premium wellness space in Abuja, covering interior finishes, ceiling and wall treatments, lighting coordination, fittings and detailed close-out.",
    attribution:
      "Specialist subcontract works delivered by Charismak Project Nigeria Limited.",
    cover: projectCover("Flawless"),
    heroImages: [projectHero("Flawless"), projectCover("Flawless")],
    images: projectGallery("Flawless", 10),
    videos: [],
    services: [
      "Interior Renovation",
      "Architectural Finishing",
      "Ceiling and Wall Finishes",
      "Lighting Coordination",
      "Finishing Supervision",
    ],
    featured: true,
    showOnProjectsPage: true,
  },
  {
    slug: "jahi-project-development",
    title: "Jahi Residential Development",
    heroTitle:
      "Specialist construction delivery for a residential development in Jahi, Abuja.",
    publicCategory: "Charismak Project",
    engagementTag: "Subcontract",
    role: "Specialist Subcontractor",
    organisation: "Charismak Project Nigeria Limited",
    location: "Jahi, Abuja",
    status: "Ongoing",
    summary:
      "Specialist construction works within an ongoing residential development in Jahi, including masonry, temporary works, ceiling and tiling activities, plumbing coordination, finishing works and quality monitoring.",
    attribution:
      "Specialist subcontract works delivered by Charismak Project Nigeria Limited.",
    cover: projectCover("Jahi"),
    heroImages: [projectHero("Jahi"), projectCover("Jahi")],
    images: projectGallery("Jahi", 10),
    videos: [],
    services: [
      "Specialist Construction Works",
      "Masonry Coordination",
      "Temporary Works",
      "Ceiling and Tiling Works",
      "Finishing Coordination",
      "Quality Monitoring",
    ],
    featured: true,
    showOnProjectsPage: true,
  },
  {
    slug: "djibouti-residential-estate",
    title: "Djibouti Residential Estate",
    heroTitle:
      "International quantity surveying and construction delivery experience in Djibouti.",
    publicCategory: "MD Professional Experience",
    engagementTag: "Expatriate Experience",
    role: "Project Quantity Surveyor",
    organisation: "ERSA Construction SARL",
    location: "Djibouti, East Africa",
    status: "Completed Professional Reference",
    summary:
      "Residential estate experience with ERSA Construction SARL covering measurement, valuation, cost control, quantity surveying, construction supervision and multidisciplinary project coordination.",
    attribution: "Professional experience with ERSA Construction SARL.",
    cover: projectCover("Djibouti"),
    heroImages: [projectHero("Djibouti"), projectCover("Djibouti")],
    images: projectGallery("Djibouti", 10),
    videos: [],
    services: [
      "Quantity Surveying",
      "Cost Control",
      "Interim Valuation",
      "Construction Supervision",
      "Technical Coordination",
      "Project Reporting",
    ],
    featured: true,
    showOnProjectsPage: true,
  },
  {
    slug: "steel-fabrication-km-steel",
    title: "Steel Fabrication Works",
    heroTitle:
      "Commercial and technical experience across structural steel fabrication and installation.",
    publicCategory: "MD Professional Experience",
    engagementTag: "Quantity Surveying",
    role: "Quantity Surveyor / Project Coordinator",
    organisation: "KM Steel & Structure",
    location: "Abuja, Nigeria",
    status: "Professional Project Reference",
    summary:
      "Structural steel and fabrication experience with KM Steel & Structure, including measurement, cost review, production monitoring, valuation, installation coordination and site delivery support.",
    attribution: "Professional experience with KM Steel & Structure.",
    cover: projectCover("fabrication"),
    heroImages: [projectHero("fabrication"), projectCover("fabrication")],
    images: projectGallery("fabrication", 10),
    videos: [],
    services: [
      "Quantity Surveying",
      "Steelwork Measurement",
      "Cost Review",
      "Fabrication Monitoring",
      "Installation Coordination",
      "Valuation and Reporting",
    ],
    featured: true,
    showOnProjectsPage: true,
  },
  {
    slug: "office-renovation-cannon",
    title: "Office Renovation & Completion",
    heroTitle:
      "Commercial renovation and completion supported by cost and site coordination.",
    publicCategory: "MD Professional Experience",
    engagementTag: "Supervision",
    role: "Quantity Surveyor / Construction Manager",
    organisation: "Cannon Projects",
    location: "Abuja, Nigeria",
    status: "Completed Professional Reference",
    summary:
      "Office renovation and completion experience with Cannon Projects covering measurement, cost monitoring, procurement coordination, interior finishes, ceiling works, fittings and progress reporting.",
    attribution: "Professional experience with Cannon Projects.",
    cover: projectCover("Office"),
    heroImages: [projectHero("Office"), projectCover("Office")],
    images: projectGallery("Office", 10),
    videos: [],
    services: [
      "Quantity Surveying",
      "Construction Supervision",
      "Cost Monitoring",
      "Procurement Coordination",
      "Progress Valuation",
      "Project Reporting",
    ],
    featured: false,
    showOnProjectsPage: true,
  },
  {
    slug: "block-of-flats-cvl",
    title: "Block of Flats for CVL",
    heroTitle: "Residential cost management and construction coordination experience.",
    publicCategory: "MD Professional Experience",
    engagementTag: "Quantity Surveying",
    role: "Quantity Surveyor",
    organisation: "Cannon Projects",
    location: "Nigeria",
    status: "Professional Project Reference",
    summary:
      "Block-of-flats experience with Cannon Projects covering measurement, bill preparation, procurement review, valuation, cost monitoring and construction coordination.",
    attribution: "Professional experience with Cannon Projects.",
    cover: projectCover("Block-of-flat-cvl"),
    heroImages: [projectHero("Block-of-flat-cvl"), projectCover("Block-of-flat-cvl")],
    images: projectGallery("Block-of-flat-cvl", 10),
    videos: [],
    services: [
      "Quantity Surveying",
      "Bill Preparation",
      "Cost Monitoring",
      "Interim Valuation",
      "Procurement Review",
      "Construction Coordination",
    ],
    featured: false,
    showOnProjectsPage: true,
  },
  {
    slug: "hillside-mansions",
    title: "Hillside Mansions",
    heroTitle:
      "Premium residential delivery experience supported by commercial control.",
    publicCategory: "MD Professional Experience",
    engagementTag: "Quantity Surveying",
    role: "Quantity Surveyor / Project Professional",
    organisation: "Cannon Projects",
    location: "Abuja, Nigeria",
    status: "Professional Project Reference",
    summary:
      "Residential mansion development experience with Cannon Projects covering cost planning, measurement, valuation, procurement review, technical coordination and construction monitoring.",
    attribution: "Professional experience with Cannon Projects.",
    cover: projectCover("hillside", "png"),
    heroImages: [projectHero("hillside", "png"), projectCover("hillside", "png")],
    images: projectGallery("hillside", 7, "png"),
    videos: [],
    services: [
      "Cost Planning",
      "Quantity Surveying",
      "Measurement and Valuation",
      "Procurement Review",
      "Project Coordination",
      "Construction Monitoring",
    ],
    featured: false,
    showOnProjectsPage: true,
  },
  {
    slug: "hilltop-pentagon",
    title: "Hilltop & Pentagon Developments",
    heroTitle:
      "Cost management and project coordination experience on building developments in Maitama.",
    publicCategory: "MD Professional Experience",
    engagementTag: "Supervision",
    role: "Quantity Surveyor / Assistant Project Manager",
    organisation: "Cannon Projects",
    location: "Maitama, Abuja",
    status: "Professional Project Reference",
    summary:
      "Building development experience with Cannon Projects covering quantity surveying, cost reporting, contractor valuation, procurement coordination and construction monitoring.",
    attribution: "Professional experience with Cannon Projects.",
    cover: projectCover("hilltop-pentagon"),
    heroImages: [projectHero("hilltop-pentagon"), projectCover("hilltop-pentagon")],
    images: projectGallery("hilltop-pentagon", 10),
    videos: [],
    services: [
      "Quantity Surveying",
      "Cost Reporting",
      "Contractor Valuation",
      "Procurement Coordination",
      "Construction Monitoring",
    ],
    featured: false,
    showOnProjectsPage: true,
  },
  {
    slug: "architectural-department-building",
    title: "Architectural Department Building",
    heroTitle:
      "Institutional building experience supported by quantity surveying and cost control.",
    publicCategory: "MD Professional Experience",
    engagementTag: "Quantity Surveying",
    role: "Quantity Surveyor",
    organisation: "Three O's Nigeria Limited",
    location: "Nigeria",
    status: "Professional Project Reference",
    summary:
      "Institutional construction experience with Three O's Nigeria Limited covering measurement, bill preparation, valuation, materials assessment, cost control and construction coordination.",
    attribution: "Professional experience with Three O's Nigeria Limited.",
    cover: projectCover("architectural-department"),
    heroImages: [
      projectHero("architectural-department"),
      projectCover("architectural-department"),
    ],
    images: projectGallery("architectural-department", 12),
    videos: [],
    services: [
      "Quantity Surveying",
      "Bill Preparation",
      "Measurement",
      "Valuation",
      "Materials Assessment",
      "Cost Control",
    ],
    featured: false,
    showOnProjectsPage: true,
  },
  {
    slug: "residential-development-asiwaju",
    title: "Residential Development for Asiwaju",
    heroTitle: "Residential quantity surveying and cost management experience.",
    publicCategory: "MD Professional Experience",
    engagementTag: "Quantity Surveying",
    role: "Quantity Surveyor",
    organisation: "Three O's Nigeria Limited",
    location: "Nigeria",
    status: "Professional Project Reference",
    summary:
      "Private residential development experience with Three O's Nigeria Limited covering quantity take-off, cost planning, valuation, procurement support and construction monitoring.",
    attribution: "Professional experience with Three O's Nigeria Limited.",
    cover: projectCover("asiwaju"),
    heroImages: [projectHero("asiwaju"), projectCover("asiwaju")],
    images: projectGallery("asiwaju", 2),
    videos: [],
    services: [
      "Quantity Take-Off",
      "Cost Planning",
      "Valuation",
      "Procurement Support",
      "Construction Monitoring",
    ],
    featured: false,
    showOnProjectsPage: true,
  },
  {
    slug: "block-of-flats-asokoro",
    title: "Block of Flats at Asokoro",
    heroTitle:
      "Residential quantity surveying and commercial coordination in Asokoro, Abuja.",
    publicCategory: "MD Professional Experience",
    engagementTag: "Quantity Surveying",
    role: "Quantity Surveyor / Project Professional",
    organisation: "Cannon Projects",
    location: "Asokoro, Abuja",
    status: "Professional Project Reference",
    summary:
      "Block-of-flats experience with Cannon Projects covering measurement, cost control, contractor valuation, procurement review and construction coordination.",
    attribution: "Professional experience with Cannon Projects.",
    cover: projectCover("asokoro", "png"),
    heroImages: [projectHero("asokoro", "png"), projectCover("asokoro", "png")],
    images: projectGallery("asokoro", 10, "png"),
    videos: [],
    services: [
      "Quantity Surveying",
      "Measurement",
      "Cost Control",
      "Contractor Valuation",
      "Procurement Review",
      "Construction Coordination",
    ],
    featured: false,
    showOnProjectsPage: true,
  },
];

export const people: Person[] = [
  {
    name: "Abiodun Christopher Akinola",
    role: "Project Director, Managing Director",
    image: "/Images/Team/md.png",
    group: "Active Team",
    category: "Leadership",
    bio:
      "Provides executive leadership, commercial oversight, project strategy and technical direction across company operations.",
  },
  {
    name: "Adetiloye O. Adesida",
    role: "Business Development Officer",
    image: "/Images/Team/adesida.png",
    group: "Active Team",
    category: "Business Development",
    bio:
      "Leads business development, client relationships and growth strategy for the company.",
  },
  {
    name: "Akinola Toyin",
    role: "Supporting Secretary",
    image: "/Images/Team/toyin.png",
    group: "Active Team",
    category: "Corporate Administration",
    bio:
      "Supports corporate documentation, communication, records and company secretarial responsibilities.",
  },
  {
    name: "Paul Chukwudi Amiarah",
    role: "Site Supervisor (Main)",
    image: "/Images/Team/chuks.png",
    group: "Active Team",
    category: "Site Operations",
    bio:
      "Leads day-to-day site supervision, quality monitoring, technical inspections and coordinated field execution.",
  },
  {
    name: "Lawal Mamman",
    role: "Site Supervisor (Assistant)",
    image: "/Images/Team/lawal.png",
    group: "Active Team",
    category: "Site Operations",
    bio:
      "Supports site supervision, workforce coordination, logistics and daily construction operations.",
  },
  {
    name: "Seyi Fituyi",
    role: "Project Director (South)",
    image: "/Images/Team/fituyi.png",
    group: "Supporting Team",
    category: "Project Leadership",
    bio:
      "Provides project leadership, operational coordination and construction delivery oversight across southern operations.",
  },
  {
    name: "Hammed K. Hamzat",
    role: "Construction Manager",
    image: "/Images/Team/hammed.png",
    group: "Supporting Team",
    category: "Construction Management",
    bio:
      "Provides construction management, technical supervision and project coordination support.",
  },
  {
    name: "Wonder Martins",
    role: "Site Engineer",
    image: "/Images/Team/wonder.png",
    group: "Supporting Team",
    category: "Site Engineering",
    bio:
      "Supports site engineering, quality inspections, construction monitoring and process control.",
  },
  {
    name: "Samuel",
    role: "Project Engineer",
    image: "/Images/Team/samuel.png",
    group: "Supporting Team",
    category: "Project Engineering",
    bio:
      "Supports project engineering, design coordination, documentation and technical records.",
  },
  {
    name: "Princebell Bello",
    role: "Project Architect",
    image: "/Images/Team/princebell.png",
    group: "Supporting Team",
    category: "Architecture",
    bio:
      "Supports architectural design, technical coordination, reporting and project administration.",
  },
  {
    name: "Jude",
    role: "Project Engineer",
    image: "/Images/Team/jude.png",
    group: "Supporting Team",
    category: "Project Engineering",
    bio:
      "Supports construction supervision, site monitoring and field coordination.",
  },
];

export const mdProfile = {
  name: "Abiodun Christopher Akinola, MNIQS",
  position: "Project Director, Managing Director",
  title: "Project Director, Managing Director",
  subtitle:
    "Quantity Surveyor | Construction Project Manager | Cost Consultant | Construction Executive",
  image: "/Images/Team/md-profile.png",
  resume: "/md-profile.pdf",
  profilePdf: "/md-profile.pdf",
  phone: "+2347066619598",
  email: "info@charismakproject.com",
  personalEmail: "akinolaca@gmail.com",
  linkedin: "https://linkedin.com/in/abiodun-christopher-akinola-80364b11b",
  location: "Abuja, Nigeria",
  summary:
    "Construction and cost management professional with extensive experience across quantity surveying, project management, building construction, steel fabrication, renovation, construction supervision, digital reporting systems and international project assignments across Nigeria and East Africa.",
  highlights: [
    "Managing Director of Charismak Project Nigeria Limited",
    "Professional Member, Nigerian Institute of Quantity Surveyors",
    "Member, Green Building Council Nigeria",
    "International construction and quantity surveying experience in Djibouti, East Africa",
    "Professional involvement across residential, commercial, institutional, renovation, infrastructure and steel fabrication projects",
  ],
  expertise: [
    "Quantity Surveying",
    "Construction Project Management",
    "Cost Planning and Control",
    "Bill of Quantities Preparation",
    "Measurement and Valuation",
    "Contract Administration",
    "Tender Documentation",
    "Construction Supervision",
    "Procurement Management",
    "Renovation and Finishing Works",
    "Steel Fabrication Coordination",
    "Digital Construction Systems",
  ],
  education: [
    {
      degree: "B.Tech Quantity Surveying",
      institution: "Federal University of Technology, Akure",
      year: "2016",
      note: "Second Class Upper Division",
    },
    {
      degree: "Diploma in Computer Appreciation",
      institution: "KKU Computer Institute, Ikere-Ekiti",
      year: "2010",
      note: "Distinction",
    },
  ],
  certifications: [
    "Professional Member, Nigerian Institute of Quantity Surveyors",
    "Member, Green Building Council Nigeria",
    "Construction Project Management - Columbia University / Coursera",
    "The Construction Industry: The Way Forward - Columbia University / Coursera",
    "Understanding Research Methods - University of London / Coursera",
    "NYSC Discharge Certificate",
  ],
};

export const trustItems = [
  {
    title: "Quality Assurance",
    icon: ShieldCheck,
    text:
      "Routine inspections and technical checks support structural standards, workmanship quality and finishing excellence.",
  },
  {
    title: "Skilled Coordination",
    icon: Users,
    text:
      "Experienced project personnel support supervision, procurement, reporting, site execution and project control.",
  },
  {
    title: "Controlled Delivery",
    icon: BadgeCheck,
    text:
      "Structured supervision supports transparency, accountability, cost awareness, communication and project discipline.",
  },
];

export type Testimonial = {
  quote: string;
  name: string;
  role: string;
  project?: string;
};

export const testimonials: Testimonial[] = [
  {
    quote:
      "Charismak Project delivered with strong attention to detail and met their commitments as agreed. Their level of consistency stood out compared to other vendors we have worked with.",
    name: "Wandel International Limited",
    role: "Client, COCO Gwarimpa Project",
    project: "coco-gwarimpa-project",
  },
  {
    quote:
      "We have consistently trusted Charismak with our key projects because of their attention to detail and professionalism. They remain on retainership with us for that reason.",
    name: "Cannon Projects Nigeria Limited",
    role: "Client",
  },
  {
    quote:
      "Abiodun is well-organised, thorough, and brings a strong technical grounding to his work. It was a pleasure working with him.",
    name: "Three O's Nigeria Limited",
    role: "Managing Director",
  },
];

export const inspirationHub: InspirationItem[] = [
  {
    title: "Modern Residential Ideas",
    category: "Residential Design",
    description: "Contemporary facade, layout and residential development references.",
    image: "/Images/Inspiration/residential.jpg",
    link: "https://www.pinterest.com/search/pins/?q=modern%20residential%20architecture",
  },
  {
    title: "Gate House & Entrance Ideas",
    category: "Estate Infrastructure",
    description: "Gate house, entrance gate and estate access design inspiration.",
    image: "/Images/Inspiration/gate-house.jpg",
    link: "https://www.pinterest.com/search/pins/?q=modern%20gatehouse%20design",
  },
  {
    title: "Interior Finishing",
    category: "Interior Design",
    description: "Modern lighting, ceiling, wall finish and interior detailing references.",
    image: "/Images/Inspiration/interior.jpg",
    link: "https://www.pinterest.com/search/pins/?q=modern%20interior%20finishing",
  },
  {
    title: "Steel and Staircase Concepts",
    category: "Steel Fabrication",
    description: "Steel staircases, railings, frames and fabrication design ideas.",
    image: "/Images/Inspiration/steel.jpg",
    link: "https://www.pinterest.com/search/pins/?q=modern%20steel%20staircase%20design",
  },
];

export const resources: ResourceItem[] = [
  {
    title: "Company Profile",
    description: "Download the official Charismak Project Nigeria Limited company profile.",
    icon: FileText,
    href: "/company-profile.pdf",
  },
  {
    title: "Managing Director Profile",
    description: "View and download the Managing Director's professional profile.",
    icon: FileText,
    href: "/md-profile",
  },
  {
    title: "Design Inspiration",
    description:
      "Explore selected construction ideas, finishing references and design inspiration.",
    icon: Lightbulb,
    href: "/inspiration",
  },
];
