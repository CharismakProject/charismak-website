import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Quote,
  ShieldCheck,
} from "lucide-react";

import HeroSlideshow, {
  type HeroSlide,
} from "./components/HeroSlideshow";

import {
  company,
  projects,
  services,
  testimonials,
  trustItems,
} from "./site-data";

function SectionLabel({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-[#C8A45D]">
      {children}
    </p>
  );
}

export default function HomePage() {
  const directWork = projects.filter(
    (p) => p.featured && p.publicCategory === "Charismak Project"
  );
  const mdWork = projects.filter(
    (p) => p.featured && p.publicCategory === "MD Professional Experience"
  );
  const featuredProjects = [...directWork, ...mdWork].slice(0, 4);

  const heroProjects = [...directWork, ...mdWork].slice(0, 5);

  const heroSlides: HeroSlide[] = heroProjects.map((project) => ({
    title: project.heroTitle || project.title,
    subtitle: project.role,
    description: project.summary,
    image:
      project.heroImages?.[0] ||
      project.cover ||
      project.images[0],
    location: project.location,
    href: `/projects/${project.slug}`,
  }));

  return (
    <main className="overflow-hidden bg-white pt-20">
      <HeroSlideshow slides={heroSlides} />

      <section className="border-b border-[#0D3B66]/10 bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 py-8 sm:grid-cols-2 md:px-8 lg:grid-cols-4">
          {[
            [`${projects.length}+`, "Project References"],
            [`${services.length}`, "Service Areas"],
            ["100%", "Quality Commitment"],
            ["Nigeria", "Operating Nationwide"],
          ].map(([value, label]) => (
            <div
              key={label}
              className="border-l-2 border-[#C8A45D] pl-5"
            >
              <p className="text-3xl font-black text-[#0D3B66]">
                {value}
              </p>

              <p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-[#3A4653]">
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white px-5 py-20 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <SectionLabel>Who We Are</SectionLabel>

            <h2 className="text-3xl font-semibold leading-tight text-[#0D3B66] md:text-5xl">
              A trusted Nigerian construction company focused on disciplined
              delivery.
            </h2>
          </div>

          <div>
            <p className="text-base leading-8 text-[#3A4653]">
              {company.overview}
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {company.values.map((value) => (
                <div
                  key={value}
                  className="flex items-center gap-3 border border-[#0D3B66]/10 bg-[#F7F8FA] p-4 font-bold text-[#0D3B66]"
                >
                  <BadgeCheck className="h-5 w-5 shrink-0 text-[#A82B05]" />
                  {value}
                </div>
              ))}
            </div>

            <Link
              href="/about"
              className="mt-8 inline-flex items-center gap-2 font-bold text-[#A82B05]"
            >
              Learn More About Charismak
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-[#F5F7FA] px-5 py-20 md:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionLabel>What We Do</SectionLabel>

          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <h2 className="max-w-3xl text-3xl font-semibold leading-tight text-[#0D3B66] md:text-5xl">
              Integrated construction and engineering solutions.
            </h2>

            <Link
              href="/services"
              className="inline-flex items-center gap-2 font-bold text-[#A82B05]"
            >
              View All Services
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>

          <div className="mt-10 grid gap-px overflow-hidden border border-[#0D3B66]/10 bg-[#0D3B66]/10 sm:grid-cols-2 lg:grid-cols-4">
            {services.slice(0, 8).map((service) => {
              const Icon = service.icon;

              return (
                <article
                  key={service.title}
                  className="group bg-white p-7 transition hover:bg-[#0D3B66] hover:text-white"
                >
                  <Icon className="h-8 w-8 text-[#A82B05] transition group-hover:text-[#F2B544]" />

                  <h3 className="mt-7 text-xl font-bold text-[#0D3B66] transition group-hover:text-white">
                    {service.title}
                  </h3>

                  <p className="mt-4 text-sm leading-7 text-[#3A4653] transition group-hover:text-white/70">
                    {service.description}
                  </p>

                  <Link
                    href="/services"
                    className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#A82B05] transition group-hover:text-[#F2B544]"
                  >
                    Learn More
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-20 md:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionLabel>Featured Projects</SectionLabel>

          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <h2 className="max-w-3xl text-3xl font-semibold leading-tight text-[#0D3B66] md:text-5xl">
              Selected project references.
            </h2>

            <Link
              href="/projects"
              className="inline-flex items-center gap-2 font-bold text-[#A82B05]"
            >
              View All Projects
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {featuredProjects.map((project) => (
              <Link
                key={project.slug}
                href={`/projects/${project.slug}`}
                className="group overflow-hidden border border-[#0D3B66]/10 bg-white transition hover:-translate-y-1 hover:shadow-[0_25px_60px_rgba(7,30,51,0.14)]"
              >
                <div className="relative h-[250px] overflow-hidden bg-[#071E33]">
                  <Image
                    src={
                      project.cover ||
                      project.heroImages?.[0] ||
                      project.images[0]
                    }
                    alt={project.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 25vw"
                    className="object-cover transition duration-700 group-hover:scale-105"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-[#071E33]/65 via-transparent to-transparent" />

                  <div className="absolute left-4 top-4 bg-[#A82B05] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white">
                    {project.role}
                  </div>
                </div>

                <div className="p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C8A45D]">
                    {project.publicCategory}
                  </p>

                  <h3 className="mt-3 text-xl font-bold text-[#0D3B66]">
                    {project.title}
                  </h3>

                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#3A4653]">
                    {project.summary}
                  </p>

                  <div className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#A82B05]">
                    View Project
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {testimonials.length > 0 && (
        <section className="bg-[#F5F7FA] px-5 py-20 md:px-8">
          <div className="mx-auto max-w-7xl">
            <SectionLabel>Client Feedback</SectionLabel>

            <h2 className="max-w-3xl text-3xl font-semibold leading-tight text-[#0D3B66] md:text-5xl">
              What our clients say.
            </h2>

            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {testimonials.map((t, index) => (
                <article
                  key={index}
                  className="border border-[#0D3B66]/10 bg-white p-8"
                >
                  <Quote className="h-8 w-8 text-[#C8A45D]" />

                  <p className="mt-6 text-base leading-8 text-[#3A4653]">
                    {t.quote}
                  </p>

                  <div className="mt-6">
                    <p className="font-bold text-[#0D3B66]">{t.name}</p>
                    <p className="text-sm text-[#3A4653]">{t.role}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="bg-[#071E33] px-5 py-20 text-white md:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <SectionLabel>Why Charismak</SectionLabel>

            <h2 className="text-3xl font-semibold leading-tight md:text-5xl">
              Safety, quality and controlled project delivery.
            </h2>

            <p className="mt-6 max-w-xl text-base leading-8 text-white/68">
              Our projects are supported through planning, supervision,
              communication and responsible quality control.
            </p>

            <Link
              href="/hse"
              className="mt-8 inline-flex items-center gap-3 bg-[#A82B05] px-7 py-4 text-sm font-bold text-white transition hover:bg-[#C8A45D]"
            >
              HSE & Quality
              <ShieldCheck className="h-5 w-5" />
            </Link>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            {trustItems.map((item) => {
              const Icon = item.icon;

              return (
                <article
                  key={item.title}
                  className="border border-white/12 bg-white/5 p-6 backdrop-blur"
                >
                  <Icon className="h-8 w-8 text-[#F2B544]" />

                  <h3 className="mt-6 text-lg font-bold">
                    {item.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-white/65">
                    {item.text}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}