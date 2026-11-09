import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Calculator,
  ClipboardCheck,
  DraftingCompass,
  Factory,
  FileDown,
  Hammer,
  HardHat,
  Home,
  Mail,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";

import { company } from "./site-data";
import { CxSection, Eyebrow, Stat } from "@/components/ui/cx";
import ProjectStatusBadge from "@/components/projects/project-status-badge";
import SiteUpdatesSlider, { type SiteUpdateSlide } from "@/components/home/site-updates-slider";
import { selectSliderPictures } from "@/lib/content/site-pictures";
import { createSeoMetadata } from "@/lib/seo";
import {
  loadPublishedProjects,
  loadPublishedSitePictures,
  loadPublishedServices,
  loadWebsiteContent,
} from "@/lib/content/website-cms";

export const metadata = createSeoMetadata({
  title: "Construction Company in Abuja, Nigeria",
  description:
    "Abuja construction company for building construction, renovation, civil engineering, steel fabrication, project management and cost planning across Nigeria.",
  path: "/",
  keywords: [
    "construction company Abuja",
    "building contractor Abuja",
    "construction company Nigeria",
    "civil engineering Abuja",
    "project management Abuja",
    "quantity surveying Nigeria",
  ],
});

const textValue = (value: unknown, fallback: string) => {
  if (typeof value === "string") return value || fallback;
  if (value && typeof value === "object" && "text" in value) {
    const text = String((value as { text?: unknown }).text ?? "").trim();
    return text || fallback;
  }
  return fallback;
};

const processSteps = [
  {
    number: "01",
    title: "Plan",
    text: "We agree the brief, scope, site conditions, priorities and budget before work starts.",
    icon: ClipboardCheck,
  },
  {
    number: "02",
    title: "Coordinate",
    text: "Drawings, procurement, programme and site activities are brought together around the agreed scope.",
    icon: Building2,
  },
  {
    number: "03",
    title: "Build",
    text: "Work is supervised on site with attention to quality, safety, cost and practical construction decisions.",
    icon: Hammer,
  },
  {
    number: "04",
    title: "Complete",
    text: "We inspect the work, close outstanding items and prepare the project for handover.",
    icon: BadgeCheck,
  },
];

const strengths = [
  {
    title: "Planning & coordination",
    text: "The work, people, information and procurement are organised before they become site problems.",
    icon: ClipboardCheck,
  },
  {
    title: "Cost awareness",
    text: "We consider the cost effect of scope, materials and construction decisions throughout delivery.",
    icon: Building2,
  },
  {
    title: "Quality supervision",
    text: "Materials and workmanship are checked at the stages that matter most.",
    icon: ShieldCheck,
  },
  {
    title: "Practical solutions",
    text: "Decisions are made with buildability, durability, use and maintenance in mind.",
    icon: Sparkles,
  },
];

const serviceIconMap = {
  building: Building2,
  hardhat: HardHat,
  hammer: Hammer,
  clipboard: ClipboardCheck,
  factory: Factory,
  wrench: Wrench,
  drafting: DraftingCompass,
  home: Home,
};

export default async function HomePage() {
  const [projects, content, managedServices, sitePictures] = await Promise.all([
    loadPublishedProjects(),
    loadWebsiteContent("company"),
    loadPublishedServices(),
    loadPublishedSitePictures(),
  ]);

  const byKey = new Map(content.map((record) => [record.contentKey, record.value]));
  const overview = textValue(byKey.get("company.overview"), company.overview);
  const directProjects = projects.filter(
    (project) => project.publicCategory === "Charismak Project" && project.showOnProjectsPage !== false,
  );
  const featuredProjects = [
    ...directProjects.filter((project) => project.featured),
    ...directProjects.filter((project) => !project.featured),
  ].slice(0, 4);
  const heroProject = featuredProjects[0] || directProjects[0] || projects[0];
  const heroImage = heroProject?.heroImages?.[0] || heroProject?.cover || "/Images/Projects/coco/hero.jpg";
  const formatUpdateDate = (value: string) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", year: "numeric" }).format(date);
  };
  // Slider: admin-published Site Pictures linked to public Charismak company projects.
  const companySlugs = new Set(directProjects.map((project) => project.slug));
  const projectBySlug = new Map(directProjects.map((project) => [project.slug, project]));
  const sliderPictures = selectSliderPictures(sitePictures, companySlugs);
  const hasSiteUpdates = sliderPictures.length > 0;
  const siteSlides: SiteUpdateSlide[] = hasSiteUpdates
    ? sliderPictures.map((picture) => {
        const project = projectBySlug.get(picture.projectSlug);
        return {
          id: picture.id,
          image: picture.imageUrl,
          alt: picture.altText || `${picture.title} — ${project?.title ?? picture.projectTitle}`,
          projectTitle: project?.title ?? picture.projectTitle,
          location: project?.location ?? picture.projectLocation,
          title: picture.title,
          summary: picture.summary,
          date: formatUpdateDate(picture.updateDate),
          href: `/projects/${picture.projectSlug}`,
        };
      })
    : // Honest fallback: portfolio photos of Charismak projects, labelled with
      // their recorded status and no invented dates or activity.
      directProjects
        .flatMap((project) =>
          [project.cover, ...(project.heroImages || [])].filter(Boolean).slice(0, 2).map((image) => ({
            id: `${project.slug}-${image}`,
            image,
            alt: project.title,
            projectTitle: `Charismak project · ${project.status}`,
            location: project.location,
            title: project.title,
            summary: "",
            date: "",
            href: `/projects/${project.slug}`,
          })),
        )
        .slice(0, 6);

  return (
    <main className="cx-page overflow-hidden pt-20">
      {/* ===== HERO ===== */}
      <section className="relative min-h-[calc(100svh-5rem)] overflow-hidden bg-[var(--cx-void)] text-white">
        <Image src={heroImage} alt={heroProject?.title || "Charismak construction project"} fill priority sizes="100vw" className="object-cover opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--cx-void)] via-[var(--cx-void)]/80 to-[var(--cx-void)]/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--cx-void)] via-transparent to-[var(--cx-void)]/40" />
        <div className="cx-grid-bg absolute inset-0 opacity-60" />

        <div className="relative mx-auto flex min-h-[calc(100svh-5rem)] max-w-7xl flex-col justify-between px-5 pb-10 pt-20 md:px-8 md:pt-28">
          <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.5fr]">
            <div className="max-w-4xl">
              <Eyebrow>Construction company · Abuja, Nigeria</Eyebrow>
              <h1 className="cx-title text-5xl sm:text-7xl xl:text-[6.5rem]">
                Priced right.
                <span className="block bg-gradient-to-r from-[var(--cx-gold-bright)] to-[var(--cx-gold)] bg-clip-text text-transparent">Built to last.</span>
              </h1>
              <p className="cx-lead mt-8 max-w-2xl text-base md:text-lg">
                Charismak Project Nigeria Limited is an Abuja-based construction company handling building construction, renovation, engineering, cost planning and project management from planning through completion.
              </p>
              <div className="mt-10 flex flex-wrap gap-3">
                <Link href="/quote" className="cx-btn cx-btn-primary">Start Your Project <ArrowRight className="h-4 w-4" /></Link>
                <Link href="/projects" className="cx-btn cx-btn-ghost backdrop-blur-sm">View Our Projects <ArrowRight className="h-4 w-4" /></Link>
              </div>
              {heroProject ? (
                <Link href={`/projects/${heroProject.slug}`} className="mt-10 inline-flex items-center gap-3 border-l border-[var(--cx-gold)] pl-4 text-sm text-white/65 hover:text-white">
                  <span>
                    <span className="cx-mono text-[11px] uppercase tracking-[0.2em] text-[var(--cx-gold)]">Featured</span>{" "}
                    <strong className="text-white">{heroProject.title}</strong>
                    <span className="mx-2 text-white/30">·</span>
                    {heroProject.location}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : null}
            </div>

            <div className="hidden justify-self-end lg:block">
              <div className="cx-card w-[330px] bg-[var(--cx-void)]/60">
                {[
                  [ShieldCheck, "Quality supervision", "Workmanship and important details checked throughout construction."],
                  [ClipboardCheck, "Project coordination", "Scope, procurement, programme and site communication kept together."],
                  [Sparkles, "Practical delivery", "Solutions chosen for the way the project will be built, used and maintained."],
                ].map(([Icon, title, text], index) => {
                  const ItemIcon = Icon as typeof ShieldCheck;
                  return (
                    <div key={String(title)} className={`grid grid-cols-[40px_1fr] gap-4 p-6 ${index > 0 ? "border-t border-white/10" : ""}`}>
                      <div className="grid h-10 w-10 place-items-center border border-[var(--cx-gold)]/40 text-[var(--cx-gold)]">
                        <ItemIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold">{String(title)}</h3>
                        <p className="mt-2 text-xs leading-5 text-white/55">{String(text)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-2 gap-8 border-t border-white/10 pt-8 md:grid-cols-4">
            <Stat value={directProjects.length || "—"} label="Projects in portfolio" />
            <Stat value={managedServices.length || "—"} label="Services offered" />
            <Stat value="FCT" label="Abuja head office" />
            <Stat value={<span className="text-[var(--cx-gold)]">24/7</span>} label="Online estimator & rates" />
          </div>
        </div>
      </section>

      {/* ===== CHARISMAK ONE ===== */}
      <CxSection id="charismak-one" grid>
        <div className="cx-reveal grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <a href="/charismak-one/charismak-one-flyer.pdf" target="_blank" rel="noreferrer" className="group relative block">
            <div className="absolute -inset-4 bg-[radial-gradient(circle,rgba(217,178,106,0.18),transparent_70%)] blur-2xl" />
            <Image
              src="/charismak-one/charismak-one-flyer.jpg"
              alt="Charismak One flyer: construction management app, call for beta testers, book a free demo"
              width={1080}
              height={1350}
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="relative h-auto w-full border border-white/10 shadow-2xl transition duration-500 group-hover:-translate-y-1"
            />
          </a>
          <div>
            <Eyebrow>Charismak One</Eyebrow>
            <h2 className="cx-title text-4xl md:text-6xl">Our construction management app is open for beta testers.</h2>
            <p className="cx-lead mt-7 text-base">
              BOQ, site progress, procurement, valuations and payments in one app, built by a working contractor in Abuja. Book a free demo and see how it works for your company.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <a href="https://wa.me/2347066619598?text=Hello%2C%20I%20would%20like%20a%20demo%20of%20Charismak%20One." target="_blank" rel="noreferrer" className="cx-btn cx-btn-primary">
                <MessageCircle className="h-4 w-4" /> WhatsApp +234 706 661 9598
              </a>
              <a href="mailto:info@charismakproject.com?subject=Charismak%20One%20demo" className="cx-btn cx-btn-ghost">
                <Mail className="h-4 w-4" /> Email us
              </a>
              <a href="/charismak-one/charismak-one-flyer.pdf" target="_blank" rel="noreferrer" className="cx-btn cx-btn-ghost">
                <FileDown className="h-4 w-4" /> Flyer (PDF)
              </a>
            </div>
            <p className="cx-mono mt-6 text-xs text-white/45">info@charismakproject.com · charismakprojectnigltd@gmail.com</p>
          </div>
        </div>
      </CxSection>

      {/* ===== SITE UPDATES ===== */}
      {siteSlides.length > 0 ? (
        <CxSection alt>
          <div className="cx-reveal">
            <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <Eyebrow>{hasSiteUpdates ? "Site Progress & Project Updates" : "Project Portfolio"}</Eyebrow>
                <h2 className="cx-title text-4xl md:text-5xl">{hasSiteUpdates ? "Latest photographs from our sites." : "Photos from Charismak projects."}</h2>
              </div>
              <Link href="/projects" className="cx-link">All projects <ArrowRight className="h-4 w-4" /></Link>
            </div>
            <SiteUpdatesSlider slides={siteSlides} />
          </div>
        </CxSection>
      ) : null}

      {/* ===== SELECTED PROJECTS ===== */}
      <CxSection>
        <div className="cx-reveal">
          <div className="mb-12 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="max-w-2xl">
              <Eyebrow>Selected Projects</Eyebrow>
              <h2 className="cx-title text-4xl md:text-6xl">A selection of projects from our portfolio.</h2>
            </div>
            <Link href="/projects" className="cx-link">View Project Portfolio <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {featuredProjects.map((project, index) => (
              <Link key={project.slug} href={`/projects/${project.slug}`} className="cx-card group overflow-hidden hover:-translate-y-1">
                <div className="relative h-64 overflow-hidden bg-[var(--cx-panel)]">
                  <Image
                    src={project.cover || project.heroImages?.[0] || project.images[0] || heroImage}
                    alt={project.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                    className="object-cover transition duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--cx-void)] via-[var(--cx-void)]/20 to-transparent" />
                  <span className="cx-mono absolute right-4 top-4 text-xs text-white/70">{String(index + 1).padStart(2, "0")}</span>
                  <span className="absolute left-4 top-4 border border-white/20 bg-[var(--cx-void)]/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white backdrop-blur">
                    {project.engagementTag}
                  </span>
                </div>
                <div className="p-6">
                  <p className="cx-mono text-[10px] uppercase tracking-[0.2em] text-[var(--cx-gold)]">{project.role}</p>
                  <h3 className="mt-3 text-lg font-semibold leading-snug text-white">{project.title}</h3>
                  <p className="mt-2 text-xs text-white/50">{project.location}</p>
                  <div className="mt-4"><ProjectStatusBadge status={project.status} tone="dark" /></div>
                  <div className="cx-link mt-6 text-[11px]">View Project <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </CxSection>

      {/* ===== ABOUT ===== */}
      <CxSection alt grid>
        <div className="cx-reveal grid gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <Eyebrow>About Charismak</Eyebrow>
            <h2 className="cx-title max-w-xl text-4xl md:text-5xl">Construction experience with cost and project management built in.</h2>
            <p className="cx-lead mt-7 max-w-xl text-base">{overview}</p>
            <Link href="/about" className="cx-btn cx-btn-ghost mt-9">About Charismak <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="grid gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-2">
            {strengths.map(({ title, text, icon: Icon }) => (
              <article key={title} className="bg-[var(--cx-deep)] p-8 transition hover:bg-[var(--cx-panel)]">
                <Icon className="h-6 w-6 text-[var(--cx-gold)]" />
                <h3 className="mt-8 text-base font-semibold text-white">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-white/55">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </CxSection>

      {/* ===== SERVICES ===== */}
      <CxSection>
        <div className="cx-reveal">
          <div className="mb-14 grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-end">
            <div>
              <Eyebrow>What We Do</Eyebrow>
              <h2 className="cx-title text-4xl md:text-6xl">Construction services from planning to handover.</h2>
            </div>
            <div>
              <p className="cx-lead text-base">Construction, renovation, engineering, project management and finishing services organised around the needs of each project.</p>
              <Link href="/services" className="cx-btn cx-btn-primary mt-7">Explore Our Services <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </div>
          <div className="grid gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
            {managedServices.slice(0, 8).map((service, index) => {
              const Icon = serviceIconMap[service.iconKey as keyof typeof serviceIconMap] || Building2;
              return (
                <article key={service.id} className="group relative bg-[var(--cx-void)] p-7 transition hover:bg-[var(--cx-panel)]">
                  <span className="absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-[var(--cx-gold)] transition duration-500 group-hover:scale-x-100" />
                  <div className="flex items-center justify-between">
                    <Icon className="h-6 w-6 text-[var(--cx-gold)]" />
                    <span className="cx-mono text-[11px] text-white/30">{String(index + 1).padStart(2, "0")}</span>
                  </div>
                  <h3 className="mt-8 text-base font-semibold text-white">{service.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/55">{service.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </CxSection>

      {/* ===== PROCESS ===== */}
      <CxSection alt>
        <div className="cx-reveal">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-end">
            <div>
              <Eyebrow>Project Delivery</Eyebrow>
              <h2 className="cx-title text-4xl md:text-6xl">From the first brief to final handover.</h2>
            </div>
            <p className="cx-lead text-base">
              Every project is different, but the basics stay the same: understand the work, coordinate it properly, supervise construction and close it out well.
            </p>
          </div>
          <div className="relative mt-16 grid gap-10 sm:grid-cols-2 xl:grid-cols-4">
            <div className="cx-hairline absolute left-0 right-0 top-[22px] hidden xl:block" />
            {processSteps.map(({ number, title, text, icon: Icon }) => (
              <article key={title} className="relative">
                <div className="flex items-center gap-4">
                  <span className="cx-mono grid h-11 w-11 place-items-center border border-[var(--cx-gold)]/50 bg-[var(--cx-deep)] text-sm text-[var(--cx-gold)]">{number}</span>
                  <Icon className="h-5 w-5 text-white/40" />
                </div>
                <h3 className="mt-7 text-xl font-semibold text-white">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-white/55">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </CxSection>

      {/* ===== PLAN BEFORE YOU BUILD ===== */}
      <CxSection>
        <div className="cx-reveal grid overflow-hidden border border-white/10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative min-h-[360px] bg-[var(--cx-panel)]">
            <Image
              src={featuredProjects[1]?.heroImages?.[0] || featuredProjects[1]?.cover || heroImage}
              alt="Charismak construction and digital tools"
              fill
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--cx-void)]/40 to-[var(--cx-void)]/90" />
            <div className="cx-grid-bg absolute inset-0" />
          </div>
          <div className="flex flex-col justify-center bg-[var(--cx-deep)] p-8 md:p-14">
            <Eyebrow>Plan Before You Build</Eyebrow>
            <h2 className="cx-title text-3xl md:text-5xl">Check your budget and current prices before you start.</h2>
            <p className="cx-lead mt-6 text-base">
              Use the estimator for an early cost range, then check the price catalogue for current material and supplier references.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/estimator" className="cx-btn cx-btn-primary"><Calculator className="h-4 w-4" /> Estimator</Link>
              <Link href="/prices" className="cx-btn cx-btn-ghost">Market Prices <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </div>
        </div>
      </CxSection>

      {/* ===== CEO APP (small banner) ===== */}
      <section id="ceo-app" className="bg-[var(--cx-void)] px-5 pb-20 md:px-8">
        <div className="cx-card cx-reveal mx-auto grid max-w-5xl items-center gap-8 p-6 md:grid-cols-[1fr_220px] md:p-8">
          <div>
            <p className="cx-eyebrow">Also from Charismak · Free app</p>
            <h3 className="mt-3 text-xl font-semibold leading-snug text-white md:text-2xl">CEO – Shop Manager for traders</h3>
            <p className="mt-2 text-sm leading-6 text-white/60">
              Record sales, stock, expenses and debts on your phone and see your real profit every day. At close of day CEO shows any
              missing cash or stock. Works offline, in English, Pidgin, Yorùbá, Hausa and Igbo.
            </p>
            <ul className="mt-3 grid gap-1 text-xs text-white/55 sm:grid-cols-2">
              <li>✔ Snap invoices and old records</li>
              <li>✔ Barcode scanning</li>
              <li>✔ WhatsApp debt reminders</li>
              <li>✔ Stock summary and Excel reports</li>
            </ul>
            <div className="mt-5 flex flex-wrap gap-2">
              <a href="https://ceo.charismakproject.com/download" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-[#197447] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#1f8a55]">
                <FileDown className="h-4 w-4" />
                Download (Android)
              </a>
              <a href="https://ceo.charismakproject.com" target="_blank" rel="noreferrer" className="inline-flex items-center border border-white/20 px-4 py-2.5 text-xs font-bold text-white hover:bg-white hover:text-[var(--cx-void)]">
                Learn more
              </a>
            </div>
          </div>
          <a href="https://ceo.charismakproject.com" target="_blank" rel="noreferrer" aria-label="CEO – Shop Manager app" className="mx-auto block w-[200px]">
            <div className="rounded-[28px] border border-white/15 bg-[#111] p-2 shadow-xl">
              <div className="rounded-[22px] bg-white p-3 text-[#1C1917]">
                <div className="mb-2 text-[11px] font-extrabold">Good evening, Boss 👋</div>
                <div className="rounded-xl bg-gradient-to-br from-[#0F7A3D] to-[#084A25] p-3 text-white">
                  <div className="text-[9px] opacity-80">Today&apos;s sales</div>
                  <div className="text-xl font-black">₦48,500</div>
                  <div className="text-[9px] opacity-80">Profit ₦12,300</div>
                </div>
                <div className="my-2 grid grid-cols-4 gap-1 text-center text-sm">
                  {["🧾", "📒", "💸", "📊"].map((i) => (
                    <div key={i} className="rounded-lg bg-[#F3F6F4] py-1">{i}</div>
                  ))}
                </div>
                {[
                  ["💵 3 Star, 1 Malt", "+₦3,700"],
                  ["📲 2 Indomie", "+₦21,000"],
                ].map(([x, y]) => (
                  <div key={x} className="mt-1 flex justify-between rounded-md bg-[#F3F6F4] px-2 py-1 text-[9px]">
                    <span>{x}</span>
                    <b className="text-[#15803D]">{y}</b>
                  </div>
                ))}
              </div>
            </div>
          </a>
        </div>
      </section>
    </main>
  );
}
