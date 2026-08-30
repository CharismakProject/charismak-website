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
  Quote,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import {
  company,
  people,
  projects,
  services,
  testimonials,
} from "./site-data";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-[#C8A45D]">
      {children}
    </p>
  );
}

export default function HomePage() {
  const directProjects = projects.filter(
    (project) =>
      project.publicCategory === "Charismak Project" &&
      project.showOnProjectsPage !== false
  );

  const featuredProjects = [
    ...directProjects.filter((project) => project.featured),
    ...directProjects.filter((project) => !project.featured),
  ].slice(0, 4);

  const heroProject = featuredProjects[0] || directProjects[0] || projects[0];
  const heroImage =
    heroProject?.heroImages?.[0] ||
    heroProject?.cover ||
    "/Images/Projects/coco/hero.jpg";

  const processSteps = [
    {
      number: "01",
      title: "Discover & Define",
      text: "We understand the brief, site conditions, priorities and the result you want to achieve.",
      icon: Users,
    },
    {
      number: "02",
      title: "Design & Cost",
      text: "We develop the technical direction, scope and commercial plan before execution begins.",
      icon: ClipboardCheck,
    },
    {
      number: "03",
      title: "Build & Control",
      text: "We coordinate people, materials, quality, cost awareness and progress through structured site delivery.",
      icon: Hammer,
    },
    {
      number: "04",
      title: "Handover & Support",
      text: "We close out the work carefully, communicate clearly and support a disciplined handover.",
      icon: BadgeCheck,
    },
  ];

  const strengths = [
    {
      title: "We plan smart",
      text: "Clear scope, cost awareness and structured preparation before work starts.",
      icon: ClipboardCheck,
    },
    {
      title: "We build strong",
      text: "Quality supervision, practical engineering judgement and attention to workmanship.",
      icon: Building2,
    },
    {
      title: "We deliver value",
      text: "Commercial awareness, transparent communication and responsible project control.",
      icon: ShieldCheck,
    },
    {
      title: "We build responsibly",
      text: "Safety, durability and better long-term outcomes remain part of every project decision.",
      icon: Leaf,
    },
  ];

  return (
    <main className="overflow-hidden bg-white pt-20">
      <section className="relative min-h-[690px] overflow-hidden bg-[#071E33] text-white lg:min-h-[760px]">
        <Image
          src={heroImage}
          alt={heroProject?.title || "Charismak construction project"}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#071E33]/96 via-[#071E33]/76 to-[#071E33]/18" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#071E33]/65 via-transparent to-transparent" />

        <div className="relative mx-auto grid min-h-[690px] max-w-7xl items-center gap-12 px-5 py-20 md:px-8 lg:min-h-[760px] lg:grid-cols-[1.05fr_0.55fr]">
          <div className="max-w-4xl">
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.32em] text-[#F2B544]">
              Design · Cost · Build
            </p>

            <h1 className="max-w-4xl text-5xl font-semibold leading-[0.98] tracking-[-0.04em] sm:text-6xl lg:text-7xl xl:text-[5.35rem]">
              Building exceptional spaces.
              <span className="mt-2 block text-[#E8C77F]">Delivering lasting value.</span>
            </h1>

            <p className="mt-7 max-w-2xl text-base leading-8 text-white/76 md:text-lg">
              Charismak Project Nigeria Limited delivers construction, renovation,
              engineering and project management solutions with disciplined
              supervision, commercial awareness and transparent communication.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                href="/quote"
                className="inline-flex items-center gap-3 bg-[#0D3B66] px-7 py-4 text-sm font-bold text-white shadow-xl transition hover:bg-[#C8A45D] hover:text-[#071E33]"
              >
                Start Your Project <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/projects"
                className="inline-flex items-center gap-3 border border-white/55 bg-white/5 px-7 py-4 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white hover:text-[#071E33]"
              >
                View Our Projects <ArrowRight className="h-5 w-5" />
              </Link>
            </div>

            {heroProject && (
              <Link
                href={`/projects/${heroProject.slug}`}
                className="mt-10 inline-flex items-center gap-3 border-l-2 border-[#C8A45D] pl-4 text-sm text-white/70 transition hover:text-white"
              >
                <span>
                  Featured: <strong className="text-white">{heroProject.title}</strong>
                  <span className="mx-2 text-white/35">·</span>
                  {heroProject.location}
                </span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>

          <div className="hidden justify-self-end lg:block">
            <div className="w-[330px] overflow-hidden border border-white/15 bg-[#071E33]/72 shadow-2xl backdrop-blur-xl">
              {[
                {
                  icon: ShieldCheck,
                  title: "Quality craftsmanship",
                  text: "Structured supervision and attention to detail throughout delivery.",
                },
                {
                  icon: ClipboardCheck,
                  title: "Clear project control",
                  text: "Scope, communication and execution managed with discipline.",
                },
                {
                  icon: Sparkles,
                  title: "Built for long-term value",
                  text: "Practical solutions focused on durability, use and lasting performance.",
                },
              ].map(({ icon: Icon, title, text }, index) => (
                <div
                  key={title}
                  className={`grid grid-cols-[44px_1fr] gap-4 p-6 ${
                    index > 0 ? "border-t border-white/10" : ""
                  }`}
                >
                  <div className="grid h-11 w-11 place-items-center border border-[#C8A45D]/35 bg-[#C8A45D]/10">
                    <Icon className="h-5 w-5 text-[#F2B544]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">{title}</h3>
                    <p className="mt-2 text-xs leading-5 text-white/62">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#0D3B66]/10 bg-white px-5 py-16 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.62fr_1.38fr] lg:items-center">
          <div>
            <SectionLabel>Our Process</SectionLabel>
            <h2 className="text-3xl font-semibold leading-tight tracking-[-0.03em] text-[#071E33] md:text-4xl">
              A simple, transparent process built around your project.
            </h2>
            <p className="mt-5 max-w-xl text-sm leading-7 text-[#3A4653]">
              From the first conversation to handover, every stage is designed to
              keep the work understandable, controlled and professionally managed.
            </p>
            <Link
              href="/services"
              className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[#0D3B66]"
            >
              See How We Work <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {processSteps.map(({ number, title, text, icon: Icon }) => (
              <article key={title} className="relative border-t border-[#0D3B66]/12 pt-7">
                <div className="flex items-center justify-between">
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-[#F5F7FA] text-[#0D3B66] shadow-sm">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold tracking-[0.2em] text-[#C8A45D]">
                    {number}
                  </span>
                </div>
                <h3 className="mt-6 text-lg font-bold text-[#071E33]">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#3A4653]">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#F7F8FA] px-5 py-20 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.55fr_1.45fr] lg:items-end">
            <div>
              <SectionLabel>Featured Projects</SectionLabel>
              <h2 className="text-3xl font-semibold leading-tight tracking-[-0.03em] text-[#071E33] md:text-5xl">
                Spaces we&apos;ve built. Relationships we value.
              </h2>
              <Link
                href="/projects"
                className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[#0D3B66]"
              >
                View All Projects <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {featuredProjects.map((project) => (
                <Link
                  key={project.slug}
                  href={`/projects/${project.slug}`}
                  className="group overflow-hidden bg-white shadow-[0_10px_35px_rgba(7,30,51,0.07)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(7,30,51,0.14)]"
                >
                  <div className="relative h-56 overflow-hidden bg-[#071E33]">
                    <Image
                      src={project.cover || project.heroImages?.[0] || project.images[0]}
                      alt={project.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                      className="object-cover transition duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#071E33]/55 via-transparent to-transparent" />
                    <span className="absolute left-4 top-4 bg-[#071E33]/85 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white backdrop-blur">
                      {project.status}
                    </span>
                  </div>
                  <div className="p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#C8A45D]">
                      {project.role}
                    </p>
                    <h3 className="mt-3 text-lg font-bold leading-snug text-[#071E33]">
                      {project.title}
                    </h3>
                    <p className="mt-2 text-xs text-[#3A4653]">{project.location}</p>
                    <div className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#0D3B66]">
                      View Project <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-20 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
            <div>
              <SectionLabel>About Charismak</SectionLabel>
              <h2 className="max-w-xl text-4xl font-semibold leading-[1.05] tracking-[-0.04em] text-[#071E33] md:text-5xl">
                Young. Ambitious. Built on experience.
              </h2>
              <p className="mt-6 max-w-xl text-base leading-8 text-[#3A4653]">
                {company.overview}
              </p>
              <Link
                href="/about"
                className="mt-7 inline-flex items-center gap-2 bg-[#0D3B66] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#071E33]"
              >
                More About Us <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div>
              <div className="grid gap-px overflow-hidden border border-[#0D3B66]/10 bg-[#0D3B66]/10 sm:grid-cols-2 lg:grid-cols-4">
                {strengths.map(({ title, text, icon: Icon }) => (
                  <article key={title} className="bg-white p-6">
                    <Icon className="h-7 w-7 text-[#0D3B66]" />
                    <h3 className="mt-6 text-base font-bold text-[#071E33]">{title}</h3>
                    <p className="mt-3 text-sm leading-6 text-[#3A4653]">{text}</p>
                  </article>
                ))}
              </div>

              <div className="mt-px grid gap-px bg-[#0D3B66]/10 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  [`${directProjects.length}`, "Charismak Project References"],
                  [`${services.length}`, "Service Areas"],
                  [`${people.length}`, "Team & Support Network"],
                  [`${projects.length}`, "Total Project References"],
                ].map(([value, label]) => (
                  <div key={label} className="bg-[#F7F8FA] px-6 py-7 text-center">
                    <p className="text-3xl font-black text-[#0D3B66]">{value}</p>
                    <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[#3A4653]">
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#071E33] px-5 py-20 text-white md:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <SectionLabel>What We Do</SectionLabel>
            <h2 className="text-4xl font-semibold leading-tight tracking-[-0.03em] md:text-5xl">
              Construction capability without the corporate clutter.
            </h2>
            <p className="mt-6 max-w-xl text-base leading-8 text-white/68">
              One team connecting planning, construction, renovation, engineering,
              project management and finishing around the needs of the project.
            </p>
            <Link
              href="/services"
              className="mt-8 inline-flex items-center gap-2 bg-[#C8A45D] px-6 py-3.5 text-sm font-bold text-[#071E33] transition hover:bg-[#F2B544]"
            >
              Explore Our Services <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <article
                  key={service.title}
                  className="group bg-[#0A2A49] p-6 transition hover:bg-white hover:text-[#071E33]"
                >
                  <Icon className="h-7 w-7 text-[#F2B544] transition group-hover:text-[#0D3B66]" />
                  <h3 className="mt-6 text-base font-bold">{service.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/62 transition group-hover:text-[#3A4653]">
                    {service.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {testimonials.length > 0 && (
        <section className="bg-[#0D3B66] px-5 py-16 text-white md:px-8">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.42fr_1.58fr] lg:items-center">
            <div>
              <SectionLabel>What Our Clients Say</SectionLabel>
              <h2 className="text-3xl font-semibold leading-tight tracking-[-0.03em] md:text-4xl">
                Trusted through the work we deliver.
              </h2>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {testimonials.slice(0, 3).map((testimonial) => (
                <article key={testimonial.name} className="bg-white p-6 text-[#071E33]">
                  <Quote className="h-6 w-6 text-[#C8A45D]" />
                  <p className="mt-5 text-sm leading-7 text-[#3A4653]">
                    {testimonial.quote}
                  </p>
                  <div className="mt-6 border-t border-[#0D3B66]/10 pt-4">
                    <p className="text-sm font-bold">{testimonial.name}</p>
                    <p className="mt-1 text-xs text-[#3A4653]">{testimonial.role}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="bg-white px-5 py-20 md:px-8">
        <div className="mx-auto grid max-w-7xl overflow-hidden border border-[#0D3B66]/10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative min-h-[430px] bg-[#071E33]">
            <Image
              src={featuredProjects[1]?.heroImages?.[0] || heroImage}
              alt="Charismak construction and digital tools"
              fill
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="object-cover opacity-65"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#071E33]/92 via-[#071E33]/70 to-[#071E33]/25" />
            <div className="relative flex min-h-[430px] flex-col justify-end p-8 text-white md:p-12">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#F2B544]">
                Smarter Construction
              </p>
              <h2 className="mt-4 max-w-xl text-4xl font-semibold leading-tight tracking-[-0.03em] md:text-5xl">
                Practical construction, supported by better tools.
              </h2>
              <p className="mt-5 max-w-lg text-sm leading-7 text-white/72">
                Charismak is building digital tools around estimating, pricing and
                procurement while keeping the construction company at the centre.
              </p>
            </div>
          </div>

          <div className="grid content-center gap-4 bg-[#F7F8FA] p-8 md:p-12">
            {[
              {
                title: "Construction Estimator",
                text: "Measure, price and prepare professional construction estimates and bills.",
                href: "/estimator",
                icon: Calculator,
              },
              {
                title: "Market Prices",
                text: "Access construction pricing tools designed around real project decisions.",
                href: "/prices",
                icon: ClipboardCheck,
              },
              {
                title: "Marketplace",
                text: "Connect project requirements with construction suppliers and service providers.",
                href: "/marketplace",
                icon: Building2,
              },
            ].map(({ title, text, href, icon: Icon }) => (
              <Link
                key={title}
                href={href}
                className="group grid grid-cols-[48px_1fr_auto] items-center gap-4 border border-[#0D3B66]/10 bg-white p-5 transition hover:border-[#0D3B66]/30 hover:shadow-lg"
              >
                <div className="grid h-12 w-12 place-items-center bg-[#0D3B66] text-white">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-[#071E33]">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-[#3A4653]">{text}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-[#C8A45D] transition group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#071E33] px-5 py-20 text-white md:px-8">
        <Image
          src={featuredProjects[2]?.cover || heroImage}
          alt="Charismak project"
          fill
          sizes="100vw"
          className="object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#071E33] via-[#071E33]/94 to-[#071E33]/60" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#F2B544]">
              Ready To Build?
            </p>
            <h2 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight tracking-[-0.03em] md:text-6xl">
              Bring us the idea. We&apos;ll help turn it into a controlled project.
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-8 text-white/68">
              Talk to Charismak about your building, renovation, engineering or
              project management requirement.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/quote"
              className="inline-flex items-center gap-3 bg-[#C8A45D] px-7 py-4 text-sm font-bold text-[#071E33] transition hover:bg-[#F2B544]"
            >
              Get a Quote <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-3 border border-white/30 px-7 py-4 text-sm font-bold text-white transition hover:bg-white hover:text-[#071E33]"
            >
              Contact Us <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
