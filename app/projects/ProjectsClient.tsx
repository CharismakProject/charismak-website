"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, CheckCircle2, Filter, MapPin } from "lucide-react";
import { useMemo, useState } from "react";

import type { EngagementTag, Project } from "../site-data";

type FilterValue = "All Projects" | EngagementTag;

const filters: FilterValue[] = [
  "All Projects",
  "Direct Contract",
  "Subcontract",
  "Consultancy",
  "Supervision",
  "Quantity Surveying",
  "Expatriate Experience",
];

export default function ProjectsClient({ initialProjects }: { initialProjects: Project[] }) {
  const [activeFilter, setActiveFilter] = useState<FilterValue>("All Projects");

  const visibleProjects = useMemo(
    () => initialProjects.filter((project) => project.showOnProjectsPage !== false),
    [initialProjects],
  );

  const filteredProjects = useMemo(() => {
    if (activeFilter === "All Projects") return visibleProjects;
    return visibleProjects.filter((project) => project.engagementTag === activeFilter);
  }, [activeFilter, visibleProjects]);

  const companyProjectCount = visibleProjects.filter(
    (project) => project.publicCategory === "Charismak Project",
  ).length;
  const professionalProjectCount = visibleProjects.filter(
    (project) => project.publicCategory === "MD Professional Experience",
  ).length;

  return (
    <main className="overflow-hidden bg-white pt-20">
      <section className="relative overflow-hidden bg-[#071E33] px-5 py-24 text-white md:px-8 lg:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(200,164,93,0.15),transparent_30rem)]" />
        <div className="relative mx-auto max-w-7xl">
          <p className="mb-5 text-xs font-bold uppercase tracking-[0.32em] text-[#F2B544]">Selected Projects</p>
          <h1 className="max-w-5xl text-5xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
            Construction experience
            <span className="mt-2 block text-[#E8C77F]">across different project environments.</span>
          </h1>
          <p className="mt-7 max-w-3xl text-base leading-8 text-white/72 md:text-lg">
            A selection of Charismak contracts and professional project experience across construction, renovation, specialist works, quantity surveying and project delivery.
          </p>
        </div>
      </section>

      <section className="border-b border-[#0D3B66]/10 bg-white px-5 py-12 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 sm:grid-cols-3">
          <ProjectStat value={companyProjectCount} label="Charismak Projects" />
          <ProjectStat value={professionalProjectCount} label="Professional Experience" />
          <ProjectStat value={visibleProjects.length} label="Selected References" />
        </div>
      </section>

      <section className="bg-[#F7F8FA] px-5 py-20 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-end">
            <div>
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-[#C8A45D]">Portfolio</p>
              <h2 className="text-3xl font-semibold leading-tight tracking-[-0.03em] text-[#071E33] md:text-5xl">Selected work and project experience.</h2>
            </div>
            <p className="max-w-2xl text-base leading-8 text-[#3A4653] lg:justify-self-end">
              From direct construction and specialist delivery to quantity surveying and construction management assignments, each reference reflects a defined role on a real project.
            </p>
          </div>

          <div className="mt-10 border-y border-[#0D3B66]/10 py-5">
            <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#3A4653]/70">
              <Filter className="h-4 w-4 text-[#C8A45D]" /> Project Type
            </div>
            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => {
                const active = activeFilter === filter;
                return (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setActiveFilter(filter)}
                    className={`px-4 py-2.5 text-xs font-bold transition ${active ? "bg-[#0D3B66] text-white" : "border border-[#0D3B66]/12 bg-white text-[#071E33] hover:border-[#C8A45D]"}`}
                  >
                    {filter}
                  </button>
                );
              })}
            </div>
          </div>

          {filteredProjects.length > 0 ? (
            <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredProjects.map((project) => <ProjectCard key={project.slug} project={project} />)}
            </div>
          ) : (
            <div className="mt-10 bg-white p-10 text-center shadow-[0_10px_35px_rgba(7,30,51,0.05)]">
              <h3 className="text-xl font-semibold text-[#071E33]">No project currently matches this selection.</h3>
              <button type="button" onClick={() => setActiveFilter("All Projects")} className="mt-5 bg-[#0D3B66] px-6 py-3 text-sm font-bold text-white">View All Projects</button>
            </div>
          )}

          <div className="mt-12 flex flex-col justify-between gap-6 border-t border-[#0D3B66]/12 pt-8 md:flex-row md:items-center">
            <div className="flex gap-4">
              <BriefcaseBusiness className="mt-1 h-6 w-6 shrink-0 text-[#C8A45D]" />
              <div>
                <h3 className="font-semibold text-[#071E33]">Professional project experience</h3>
                <p className="mt-2 max-w-4xl text-sm leading-7 text-[#3A4653]">
                  The portfolio also includes selected assignments delivered by the Managing Director while working with established construction organisations in Nigeria and internationally.
                </p>
              </div>
            </div>
            <Link href="/md-profile#professional-projects" className="inline-flex shrink-0 items-center gap-2 text-sm font-bold text-[#0D3B66] transition hover:text-[#C8A45D]">View Professional Profile <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function ProjectStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="border-l border-[#C8A45D] pl-5">
      <p className="text-2xl font-semibold tracking-[-0.03em] text-[#071E33] md:text-3xl">{value}</p>
      <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-[#3A4653]/65">{label}</p>
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const isProfessionalReference = project.publicCategory === "MD Professional Experience";
  const image = project.cover || project.heroImages[0] || project.images[0] || "/Images/Projects/coco/hero.jpg";

  return (
    <Link href={`/projects/${project.slug}`} className="group overflow-hidden bg-white shadow-[0_10px_35px_rgba(7,30,51,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_55px_rgba(7,30,51,0.13)]">
      <div className="relative h-[310px] overflow-hidden bg-[#071E33]">
        <Image src={image} alt={project.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#071E33]/88 via-[#071E33]/5 to-transparent" />
        <div className="absolute left-5 top-5 border border-white/15 bg-[#071E33]/65 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white backdrop-blur">{project.engagementTag}</div>
        {isProfessionalReference && <div className="absolute right-5 top-5 bg-[#C8A45D] px-3 py-2 text-[9px] font-bold uppercase tracking-[0.12em] text-[#071E33]">Professional Experience</div>}
        <div className="absolute bottom-5 left-5 flex items-center gap-2 text-sm font-medium text-white"><MapPin className="h-4 w-4 text-[#F2B544]" />{project.location}</div>
      </div>

      <div className="p-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C8A45D]">{project.organisation}</p>
        <h3 className="mt-3 text-2xl font-semibold leading-tight tracking-[-0.02em] text-[#071E33]">{project.title}</h3>
        <p className="mt-2 text-sm font-semibold text-[#0D3B66]">{project.role}</p>
        <p className="mt-4 line-clamp-3 text-sm leading-7 text-[#3A4653]">{project.summary}</p>
        <div className="mt-5 flex items-center gap-2 text-xs text-[#3A4653]/70"><CheckCircle2 className="h-4 w-4 text-[#C8A45D]" />{project.status}</div>
        <div className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#0D3B66] transition group-hover:text-[#C8A45D]">View Project <ArrowRight className="h-4 w-4" /></div>
      </div>
    </Link>
  );
}
