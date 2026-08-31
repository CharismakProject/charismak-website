import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Calculator,
  ClipboardCheck,
  Hammer,
  Leaf,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { company, services } from "./site-data";
import { publicProjects } from "@/lib/content/public-projects";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-[#C8A45D]">
      {children}
    </p>
  );
}

const processSteps = [
  {
    number: "01",
    title: "Plan",
    text: "We establish the brief, scope, site conditions, delivery priorities and commercial direction.",
    icon: ClipboardCheck,
  },
  {
    number: "02",
    title: "Coordinate",
    text: "Design information, procurement, people and programme are aligned before and during execution.",
    icon: Building2,
  },
  {
    number: "03",
    title: "Build",
    text: "Construction is managed through site supervision, quality control and practical technical decision-making.",
    icon: Hammer,
  },
  {
    number: "04",
    title: "Complete",
    text: "Works are inspected, closed out and prepared for an organised handover and operational use.",
    icon: BadgeCheck,
  },
];

const strengths = [
  {
    title: "Technical control",
    text: "Construction decisions supported by practical engineering and site experience.",
    icon: Building2,
  },
  {
    title: "Commercial awareness",
    text: "Scope, procurement and cost implications considered alongside physical delivery.",
    icon: ClipboardCheck,
  },
  {
    title: "Quality supervision",
    text: "Materials and workmanship monitored through the key stages of construction.",
    icon: ShieldCheck,
  },
  {
    title: "Long-term value",
    text: "Solutions considered for durability, use, maintenance and overall project performance.",
    icon: Leaf,
  },
];

export default function HomePage() {
  const directProjects = publicProjects.filter(
    (project) =>
      project.publicCategory === "Charismak Project" &&
      project.showOnProjectsPage !== false,
  );

  const featuredProjects = [
    ...directProjects.filter((project) => project.featured),
    ...directProjects.filter((project) => !project.featured),
  ].slice(0, 4);

  const heroProject = featuredProjects[0] || directProjects[0] || publicProjects[0];
  const heroImage = heroProject?.heroImages?.[0] || heroProject?.cover || "/Images/Projects/coco/hero.jpg";

  return (
    <main className="overflow-hidden bg-white pt-20">
      <section className="relative min-h-[690px] overflow-hidden bg-[#071E33] text-white lg:min-h-[760px]">
        <Image src={heroImage} alt={heroProject?.title || "Charismak construction project"} fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#071E33]/96 via-[#071E33]/76 to-[#071E33]/18" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#071E33]/65 via-transparent to-transparent" />

        <div className="relative mx-auto grid min-h-[690px] max-w-7xl items-center gap-12 px-5 py-20 md:px-8 lg:min-h-[760px] lg:grid-cols-[1.05fr_0.55fr]">
          <div className="max-w-4xl">
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.32em] text-[#F2B544]">Design · Cost · Build</p>
            <h1 className="max-w-4xl text-5xl font-semibold leading-[0.98] tracking-[-0.04em] sm:text-6xl lg:text-7xl xl:text-[5.35rem]">
              Building exceptional spaces.
              <span className="mt-2 block text-[#E8C77F]">Delivering lasting value.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-8 text-white/76 md:text-lg">
              Charismak Project Nigeria Limited delivers construction, renovation, engineering and project management solutions with technical control, commercial awareness and disciplined site execution.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link href="/quote" className="inline-flex items-center gap-3 bg-[#0D3B66] px-7 py-4 text-sm font-bold text-white shadow-xl transition hover:bg-[#C8A45D] hover:text-[#071E33]">
                Start Your Project <ArrowRight className="h-5 w-5" />
              </Link>
              <Link href="/projects" className="inline-flex items-center gap-3 border border-white/55 bg-white/5 px-7 py-4 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white hover:text-[#071E33]">
                View Our Projects <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
            {heroProject ? (
              <Link href={`/projects/${heroProject.slug}`} className="mt-10 inline-flex items-center gap-3 border-l-2 border-[#C8A45D] pl-4 text-sm text-white/70 transition hover:text-white">
                <span>Featured: <strong className="text-white">{heroProject.title}</strong><span className="mx-2 text-white/35">·</span>{heroProject.location}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : null}
          </div>

          <div className="hidden justify-self-end lg:block">
            <div className="w-[330px] overflow-hidden border border-white/15 bg-[#071E33]/72 shadow-2xl backdrop-blur-xl">
              {[
                [ShieldCheck, "Quality supervision", "Workmanship and critical details monitored throughout delivery."],
                [ClipboardCheck, "Project control", "Scope, procurement, programme and communication managed with discipline."],
                [Sparkles, "Built for performance", "Practical solutions focused on use, durability and lasting value."],
              ].map(([Icon, title, text], index) => {
                const ItemIcon = Icon as typeof ShieldCheck;
                return (
                  <div key={String(title)} className={`grid grid-cols-[44px_1fr] gap-4 p-6 ${index > 0 ? "border-t border-white/10" : ""}`}>
                    <div className="grid h-11 w-11 place-items-center border border-[#C8A45D]/35 bg-[#C8A45D]/10"><ItemIcon className="h-5 w-5 text-[#F2B544]" /></div>
                    <div><h3 className="text-sm font-bold">{String(title)}</h3><p className="mt-2 text-xs leading-5 text-white/62">{String(text)}</p></div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#F7F8FA] px-5 py-20 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.55fr_1.45fr] lg:items-end">
            <div>
              <SectionLabel>Selected Projects</SectionLabel>
              <h2 className="text-3xl font-semibold leading-tight tracking-[-0.03em] text-[#071E33] md:text-5xl">Construction and specialist delivery in real project environments.</h2>
              <Link href="/projects" className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[#0D3B66]">View Project Portfolio <ArrowRight className="h-4 w-4" /></Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {featuredProjects.map((project) => (
                <Link key={project.slug} href={`/projects/${project.slug}`} className="group overflow-hidden bg-white shadow-[0_10px_35px_rgba(7,30,51,0.07)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(7,30,51,0.14)]">
                  <div className="relative h-56 overflow-hidden bg-[#071E33]">
                    <Image src={project.cover || project.heroImages?.[0] || project.images[0]} alt={project.title} fill sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw" className="object-cover transition duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#071E33]/55 via-transparent to-transparent" />
                    <span className="absolute left-4 top-4 bg-[#071E33]/85 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white backdrop-blur">{project.engagementTag}</span>
                  </div>
                  <div className="p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#C8A45D]">{project.role}</p>
                    <h3 className="mt-3 text-lg font-bold leading-snug text-[#071E33]">{project.title}</h3>
                    <p className="mt-2 text-xs text-[#3A4653]">{project.location}</p>
                    <div className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#0D3B66]">View Project <ArrowRight className="h-4 w-4" /></div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-20 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
          <div>
            <SectionLabel>About Charismak</SectionLabel>
            <h2 className="max-w-xl text-4xl font-semibold leading-[1.05] tracking-[-0.04em] text-[#071E33] md:text-5xl">Construction capability backed by cost and project delivery experience.</h2>
            <p className="mt-6 max-w-xl text-base leading-8 text-[#3A4653]">{company.overview}</p>
            <Link href="/about" className="mt-7 inline-flex items-center gap-2 bg-[#0D3B66] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#071E33]">About Charismak <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="grid gap-px overflow-hidden border border-[#0D3B66]/10 bg-[#0D3B66]/10 sm:grid-cols-2 lg:grid-cols-4">
            {strengths.map(({ title, text, icon: Icon }) => (
              <article key={title} className="bg-white p-6">
                <Icon className="h-7 w-7 text-[#0D3B66]" />
                <h3 className="mt-6 text-base font-bold text-[#071E33]">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#3A4653]">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#071E33] px-5 py-20 text-white md:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <SectionLabel>What We Do</SectionLabel>
            <h2 className="text-4xl font-semibold leading-tight tracking-[-0.03em] md:text-5xl">Integrated capability from planning through completion.</h2>
            <p className="mt-6 max-w-xl text-base leading-8 text-white/68">Construction, renovation, engineering, project management and finishing coordinated around the technical and commercial needs of each project.</p>
            <Link href="/services" className="mt-8 inline-flex items-center gap-2 bg-[#C8A45D] px-6 py-3.5 text-sm font-bold text-[#071E33] transition hover:bg-[#F2B544]">Explore Our Services <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="grid gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <article key={service.title} className="group bg-[#0A2A49] p-6 transition hover:bg-white hover:text-[#071E33]">
                  <Icon className="h-7 w-7 text-[#F2B544] transition group-hover:text-[#0D3B66]" />
                  <h3 className="mt-6 text-base font-bold">{service.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/62 transition group-hover:text-[#3A4653]">{service.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-[#0D3B66]/10 bg-white px-5 py-20 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.55fr_1.45fr] lg:items-end">
            <div>
              <SectionLabel>Project Delivery</SectionLabel>
              <h2 className="text-3xl font-semibold leading-tight tracking-[-0.03em] text-[#071E33] md:text-5xl">A disciplined route from brief to handover.</h2>
            </div>
            <p className="max-w-2xl text-base leading-8 text-[#3A4653] lg:justify-self-end">The level of detail changes from project to project, but the principles remain the same: understand the work, coordinate the inputs, control execution and close out properly.</p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {processSteps.map(({ number, title, text, icon: Icon }) => (
              <article key={title} className="border-t border-[#0D3B66]/15 pt-7">
                <div className="flex items-center justify-between"><Icon className="h-6 w-6 text-[#0D3B66]" /><span className="text-xs font-bold tracking-[0.2em] text-[#C8A45D]">{number}</span></div>
                <h3 className="mt-6 text-lg font-bold text-[#071E33]">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#3A4653]">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#F7F8FA] px-5 py-20 md:px-8">
        <div className="mx-auto grid max-w-7xl overflow-hidden border border-[#0D3B66]/10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative min-h-[430px] bg-[#071E33]">
            <Image src={featuredProjects[1]?.heroImages?.[0] || heroImage} alt="Charismak construction and digital tools" fill sizes="(max-width: 1024px) 100vw, 45vw" className="object-cover opacity-65" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#071E33]/92 via-[#071E33]/70 to-[#071E33]/25" />
            <div className="relative flex min-h-[430px] flex-col justify-end p-8 text-white md:p-12">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#F2B544]">Construction Intelligence</p>
              <h2 className="mt-4 max-w-xl text-4xl font-semibold leading-tight tracking-[-0.03em] md:text-5xl">Practical tools for better project decisions.</h2>
              <p className="mt-5 max-w-lg text-sm leading-7 text-white/72">Estimate project costs, check current market references and access construction knowledge from the same Charismak platform.</p>
            </div>
          </div>
          <div className="grid content-center gap-4 bg-white p-8 md:p-12">
            {[
              ["Construction Estimator", "Quick, detailed and material quantity estimating for early project planning.", "/estimator", Calculator],
              ["Market Prices & Suppliers", "Construction market references with current supplier prices where available.", "/prices", ClipboardCheck],
              ["News & Learning", "Construction news, cost insight and practical technical guides.", "/blog", Building2],
            ].map(([title, text, href, Icon]) => {
              const ToolIcon = Icon as typeof Calculator;
              return (
                <Link key={String(title)} href={String(href)} className="group grid grid-cols-[48px_1fr_auto] items-center gap-4 border border-[#0D3B66]/10 bg-[#F7F8FA] p-5 transition hover:border-[#0D3B66]/30 hover:shadow-lg">
                  <div className="grid h-12 w-12 place-items-center bg-[#0D3B66] text-white"><ToolIcon className="h-5 w-5" /></div>
                  <div><h3 className="font-bold text-[#071E33]">{String(title)}</h3><p className="mt-1 text-sm leading-6 text-[#3A4653]">{String(text)}</p></div>
                  <ArrowRight className="h-5 w-5 text-[#C8A45D] transition group-hover:translate-x-1" />
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#071E33] px-5 py-20 text-white md:px-8">
        <Image src={featuredProjects[2]?.cover || heroImage} alt="Charismak project" fill sizes="100vw" className="object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#071E33] via-[#071E33]/94 to-[#071E33]/60" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#F2B544]">Start a Project</p>
            <h2 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight tracking-[-0.03em] md:text-6xl">Planning a new build, renovation or specialist construction package?</h2>
            <p className="mt-6 max-w-2xl text-base leading-8 text-white/68">Talk to Charismak about the scope, site conditions, programme and delivery requirements.</p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link href="/quote" className="inline-flex items-center gap-3 bg-[#C8A45D] px-7 py-4 text-sm font-bold text-[#071E33] transition hover:bg-[#F2B544]">Get a Quote <ArrowRight className="h-5 w-5" /></Link>
            <Link href="/contact" className="inline-flex items-center gap-3 border border-white/30 px-7 py-4 text-sm font-bold text-white transition hover:bg-white hover:text-[#071E33]">Contact Us <ArrowRight className="h-5 w-5" /></Link>
          </div>
        </div>
      </section>
    </main>
  );
}
