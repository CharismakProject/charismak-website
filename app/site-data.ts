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

/* -------------------------------------------------------------------------- */
/*                                   BRAND                                    */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/*                                  COMPANY                                   */
/* -------------------------------------------------------------------------- */

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

  phones: [
    "+234 706 661 9598",
    "+234 701 378 4027",
    "+234 906 875 5320",
  ],

  addresses: [
    "Sankuru Close, off El-Amin Street, Maitama, Abuja",
    "No. 268, Kajola Street, Ikere-Ekiti, Ekiti State",
    "Back of Crush Rock, Mpape, Abuja",
  ],

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

  profilePdf: "/md-profile.pdf",

  mdProfilePdf:
    "/documents/md-profile.pdf",
};

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

export type Service = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export type ProjectCategory =
  | "Charismak Project"
  | "MD Professional Experience";

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

/* -------------------------------------------------------------------------- */
/*                              MEDIA GENERATORS                              */
/* -------------------------------------------------------------------------- */

function projectGallery(
  folder: string,
  count = 5,
  extension = "jpg"
): string[] {
  return Array.from(
    { length: count },
    (_, index) =>
      `/Images/Projects/${folder}/${String(index + 1).padStart(
        2,
        "0"
      )}.${extension}`
  );
}

function projectCover(folder: string, extension = "jpg"): string {
  return `/Images/Projects/${folder}/cover.${extension}`;
}

function projectHero(folder: string, extension = "jpg"): string {
  return `/Images/Projects/${folder}/hero.${extension}`;
}

function projectVideo(folder: string, available = false): string[] {
  return available ? [`/videos/${folder}/video.mp4`] : [];
}

/* -------------------------------------------------------------------------- */
/*                                  SERVICES                                  */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/*                                  PROJECTS                                  */
/* -------------------------------------------------------------------------- */

export const projects: Project[] = [
  {
    slug: "coco-gwarimpa-project",
    title: "COCO Gwarimpa Project",
    heroTitle: "Building value. Delivering excellence.",

    publicCategory: "Charismak Project",
    engagementTag: "Direct Contract",

    role: "Main Contractor",
    organisation: "Charismak Project Nigeria Limited",
    location: "Gwarimpa, Abuja",
    status: "Completed",
    client: "Private Residential Client",

    summary:
      "Premium residential construction delivered directly by Charismak through structured supervision, quality finishing, coordinated site operations and disciplined project control.",

    attribution:
      "This project was undertaken directly by Charismak Project Nigeria Limited as the main contractor.",

    cover: projectCover("coco"),
    heroImages: [projectHero("coco"), projectCover("coco")],
    images: projectGallery("coco", 10),
    videos: [],

    services: [
      "Building Construction",
      "Project Management",
      "Site Coordination",
      "Interior Finishing",
      "Quality Supervision",
      "Procurement Coordination",
    ],

    featured: true,
    showOnProjectsPage: true,
  },

  {
    slug: "flawless-spa-renovation",
    title: "Flawless Spa Renovation",
    heroTitle: "Transforming spaces through refined finishing.",

    publicCategory: "Charismak Project",
    engagementTag: "Subcontract",

    role: "Specialist Subcontractor",
    organisation: "Charismak Project Nigeria Limited",
    location: "Abuja, Nigeria",
    status: "Completed",
    client: "Flawless Spa",

    summary:
      "Interior renovation and premium finishing works executed by Charismak as a specialist delivery partner, with attention to detailing, lighting coordination, fittings and modern space transformation.",

    attribution:
      "Charismak Project Nigeria Limited participated in this project as a specialist subcontractor.",

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
      "Structured specialist delivery for a modern residential development.",

    publicCategory: "Charismak Project",
    engagementTag: "Subcontract",

    role: "Specialist Subcontractor",
    organisation: "Charismak Project Nigeria Limited",
    location: "Jahi, Abuja",
    status: "Ongoing",

    summary:
      "Residential development support involving staged construction activities, masonry works, temporary works, ceiling, tiling, plumbing coordination, finishing supervision and quality monitoring.",

    attribution:
      "Charismak Project Nigeria Limited is participating in this development as a specialist subcontractor.",

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
    slug: "block-of-flats-student-hostels",
    title: "Block of Flats (Student Hostels)",
    heroTitle:
      "Direct project management and architectural delivery in Ikere-Ekiti.",

    publicCategory: "Charismak Project",
    engagementTag: "Direct Contract",

    role: "Project Manager / Architect",
    organisation: "Charismak Project Nigeria Limited",
    location: "Ikere-Ekiti, Ekiti State",
    status: "Carcass Stage Completed",

    summary:
      "A block of student hostel flats developed directly by Charismak, covering architectural design, project management, site supervision and construction coordination through to carcass completion.",

    attribution:
      "This project was undertaken directly by Charismak Project Nigeria Limited, with the Managing Director serving as Project Manager and Architect.",

    cover: "/Images/Projects/flats/cover.png",
    heroImages: [
      "/Images/Projects/flats/hero.png",
      "/Images/Projects/flats/cover.png",
    ],
    images: [
      "/Images/Projects/flats/1.png",
      "/Images/Projects/flats/2.png",
      "/Images/Projects/flats/3.png",
      "/Images/Projects/flats/4.png",
      "/Images/Projects/flats/5.png",
      "/Images/Projects/flats/6.png",
    ],
    videos: [],

    services: [
      "Architectural Design",
      "Project Management",
      "Site Supervision",
      "Construction Coordination",
      "Cost Awareness",
    ],

    featured: false,
    showOnProjectsPage: true,
  },

  {
    slug: "djibouti-residential-estate",
    title: "Djibouti Residential Estate",
    heroTitle:
      "International quantity surveying and construction management experience.",

    publicCategory: "MD Professional Experience",
    engagementTag: "Expatriate Experience",

    role: "Project Quantity Surveyor",
    organisation: "ERSA Construction SARL",
    location: "Djibouti, East Africa",
    status: "Completed Professional Reference",

    summary:
      "International residential development experience involving quantity surveying, measurement, valuation, cost control, construction supervision, technical coordination and project delivery support.",

    attribution:
      "This project forms part of the Managing Director's professional career portfolio and was not undertaken as a Charismak contract.",

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
      "Structural and fabrication experience supported by technical control.",

    publicCategory: "MD Professional Experience",
    engagementTag: "Quantity Surveying",

    role: "Quantity Surveyor / Project Coordinator",
    organisation: "KM Steel & Structure",
    location: "Abuja, Nigeria",
    status: "Professional Project Reference",

    summary:
      "Steel fabrication and structural works experience involving measurement, cost review, production monitoring, installation coordination, valuation and site delivery supervision.",

    attribution:
      "This reference reflects the Managing Director's professional experience while working with KM Steel & Structure and is not presented as a Charismak contract.",

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
      "Commercial renovation experience supported by cost and site coordination.",

    publicCategory: "MD Professional Experience",
    engagementTag: "Supervision",

    role: "Quantity Surveyor / Construction Manager",
    organisation: "Cannon Projects",
    location: "Abuja, Nigeria",
    status: "Completed Professional Reference",

    summary:
      "Commercial office renovation and completion experience involving measurement, cost monitoring, procurement coordination, interior finishes, ceiling works, fittings and project reporting.",

    attribution:
      "This project forms part of the Managing Director's professional experience while working with Cannon Projects and was not undertaken as a Charismak contract.",

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
    heroTitle:
      "Residential cost and construction management experience.",

    publicCategory: "MD Professional Experience",
    engagementTag: "Quantity Surveying",

    role: "Quantity Surveyor",
    organisation: "Cannon Projects",
    location: "Nigeria",
    status: "Professional Project Reference",

    summary:
      "Residential block-of-flats experience involving measurement, bill preparation, cost monitoring, valuation, procurement review and construction coordination.",

    attribution:
      "This reference reflects the Managing Director's professional involvement while working with Cannon Projects and is not a Charismak contract.",

    cover: projectCover("Block-of-flat-cvl"),
    heroImages: [
      projectHero("Block-of-flat-cvl"),
      projectCover("Block-of-flat-cvl"),
    ],
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
      "Premium residential experience supported by commercial control.",

    publicCategory: "MD Professional Experience",
    engagementTag: "Quantity Surveying",

    role: "Quantity Surveyor / Project Professional",
    organisation: "Cannon Projects",
    location: "Abuja, Nigeria",
    status: "Professional Project Reference",

    summary:
      "Residential mansion development experience involving cost planning, measurement, valuation, procurement review, technical coordination and construction monitoring.",

    attribution:
      "This project is presented as part of the Managing Director's professional career experience with Cannon Projects, not as a Charismak contract.",

    cover: projectCover("hillside", "png"),
    heroImages: [
      projectHero("hillside", "png"),
      projectCover("hillside", "png"),
    ],
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
      "Building development experience shaped by cost and technical coordination.",

    publicCategory: "MD Professional Experience",
    engagementTag: "Supervision",

    role: "Quantity Surveyor / Assistant Project Manager",
    organisation: "Cannon Projects",
    location: "Maitama, Abuja",
    status: "Professional Project Reference",

    summary:
      "Building development experience involving quantity surveying, cost reporting, contractor valuation, procurement coordination and construction monitoring.",

    attribution:
      "This project forms part of the Managing Director's professional experience with Cannon Projects and is not represented as a Charismak contract.",

    cover: projectCover("hilltop-pentagon"),
    heroImages: [
      projectHero("hilltop-pentagon"),
      projectCover("hilltop-pentagon"),
    ],
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
      "Institutional construction experience supported by quantity surveying.",

    publicCategory: "MD Professional Experience",
    engagementTag: "Quantity Surveying",

    role: "Quantity Surveyor",
    organisation: "Three O's Nigeria Limited",
    location: "Nigeria",
    status: "Professional Project Reference",

    summary:
      "Institutional building experience involving measurement, bill preparation, valuation, materials assessment, cost control and construction coordination.",

    attribution:
      "This project forms part of the Managing Director's earlier professional career experience with Three O's Nigeria Limited and was not undertaken as a Charismak contract.",

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
    heroTitle:
      "Private residential experience supported by cost management.",

    publicCategory: "MD Professional Experience",
    engagementTag: "Quantity Surveying",

    role: "Quantity Surveyor",
    organisation: "Three O's Nigeria Limited",
    location: "Nigeria",
    status: "Professional Project Reference",

    summary:
      "Private residential development experience involving quantity take-off, cost planning, valuation, procurement support and construction monitoring.",

    attribution:
      "This project is included as part of the Managing Director's professional career experience with Three O's Nigeria Limited and is not a Charismak contract.",

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
      "Residential quantity surveying experience in a premium Abuja location.",

    publicCategory: "MD Professional Experience",
    engagementTag: "Quantity Surveying",

    role: "Quantity Surveyor / Project Professional",
    organisation: "Cannon Projects",
    location: "Asokoro, Abuja",
    status: "Professional Project Reference",

    summary:
      "Residential block-of-flats experience involving measurement, cost control, contractor valuation, procurement review and construction coordination.",

    attribution:
      "This project forms part of the Managing Director's professional career portfolio while working with Cannon Projects and was not undertaken as a Charismak contract.",

    cover: projectCover("asokoro", "png"),
    heroImages: [
      projectHero("asokoro", "png"),
      projectCover("asokoro", "png"),
    ],
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

/* -------------------------------------------------------------------------- */
/*                                   PEOPLE                                   */
/* -------------------------------------------------------------------------- */

export const people: Person[] = [
  /* ---------------------------------- ACTIVE TEAM ---------------------------------- */

  {
    name: "Abiodun Christopher Akinola",
    role: "General Project Director",
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
    name: "Dorathy Raymond",
    role: "Executive Assistant",
    image: "/Images/Team/dorathy.png",
    group: "Active Team",
    category: "Executive Support",
    bio:
      "Provides executive support, scheduling, correspondence and coordination for company leadership.",
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

  /* ---------------------------------- SUPPORTING TEAM ---------------------------------- */

  {
    name: "Akinola Toyin",
    role: "Secretary",
    image: "/Images/Team/toyin.png",
    group: "Supporting Team",
    category: "Corporate Administration",
    bio:
      "Supports corporate documentation, communication, records and company secretarial responsibilities.",
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

/* -------------------------------------------------------------------------- */
/*                                MD PROFILE                                  */
/* -------------------------------------------------------------------------- */

export const mdProfile = {
  name: "Abiodun Christopher Akinola, MNIQS",

  position: "Managing Director / Executive Director",

  title: "Managing Director / Executive Director",

  subtitle:
    "Quantity Surveyor | Construction Project Manager | Cost Consultant | Construction Executive",

  image: "/Images/Team/md-profile.png",

  resume:
    "/documents/Abiodun_Christopher_Akinola_MD_Profile_Resume.pdf",

  profilePdf:
    "/documents/Abiodun_Christopher_Akinola_MD_Profile_Resume.pdf",

  phone: "+2347066619598",

  email: "info@charismakproject.com",

  personalEmail: "akinolaca@gmail.com",

  linkedin:
    "https://linkedin.com/in/abiodun-christopher-akinola-80364b11b",

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

/* -------------------------------------------------------------------------- */
/*                              TRUST & QUALITY                               */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/*                                TESTIMONIALS                                */
/* -------------------------------------------------------------------------- */

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
    role: "Client, Coco Gwarimpa Project",
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

/* -------------------------------------------------------------------------- */
/*                              INSPIRATION HUB                               */
/* -------------------------------------------------------------------------- */

export const inspirationHub: InspirationItem[] = [
  {
    title: "Modern Residential Ideas",
    category: "Residential Design",
    description:
      "Contemporary facade, layout and residential development references.",
    image: "/Images/Inspiration/residential.jpg",
    link:
      "https://www.pinterest.com/search/pins/?q=modern%20residential%20architecture",
  },
  {
    title: "Gate House & Entrance Ideas",
    category: "Estate Infrastructure",
    description:
      "Gate house, entrance gate and estate access design inspiration.",
    image: "/Images/Inspiration/gate-house.jpg",
    link:
      "https://www.pinterest.com/search/pins/?q=modern%20gatehouse%20design",
  },
  {
    title: "Interior Finishing",
    category: "Interior Design",
    description:
      "Modern lighting, ceiling, wall finish and interior detailing references.",
    image: "/Images/Inspiration/interior.jpg",
    link:
      "https://www.pinterest.com/search/pins/?q=modern%20interior%20finishing",
  },
  {
    title: "Steel and Staircase Concepts",
    category: "Steel Fabrication",
    description:
      "Steel staircases, railings, frames and fabrication design ideas.",
    image: "/Images/Inspiration/steel.jpg",
    link:
      "https://www.pinterest.com/search/pins/?q=modern%20steel%20staircase%20design",
  },
];

/* -------------------------------------------------------------------------- */
/*                                  RESOURCES                                 */
/* -------------------------------------------------------------------------- */

export const resources: ResourceItem[] = [
  {
    title: "Company Profile",
    description:
      "Download the official Charismak Project Nigeria Limited company profile.",
    icon: FileText,
    href: "/company-profile.pdf",
  },
  {
    title: "Managing Director Profile",
    description:
      "View and download the Managing Director's professional profile.",
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
