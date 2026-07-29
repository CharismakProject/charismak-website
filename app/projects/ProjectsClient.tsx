"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Filter,
  MapPin,
} from "lucide-react";
import { useMemo, useState } from "react";

import { projects, type EngagementTag, type Project } from "../site-data";

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

export default function ProjectsClient() {
  const [activeFilter, setActiveFilter] =
    useState<FilterValue>("All Projects");

  const visibleProjects = useMemo(
    () => projects.filter((project) => project.showOnProjectsPage !== false),
    []
  );

  const filteredProjects = useMemo(() => {
    if (activeFilter === "All Projects") {
      return visibleProjects;
    }

    return visibleProjects.filter(
      (project) => project.engagementTag === activeFilter
    );
  }, [activeFilter, visibleProjects]);

  const companyProjectCount = projects.filter(
    (project) => project.publicCategory === "Charismak Project"
  ).length;

  const professionalProjectCount = projects.filter(
    (project) => project.publicCategory === "MD Professional Experience"
  ).length;

  return (
    <main className="min-h-screen bg-white pt-20">
      <section className="relative overflow-hidden bg-[#071E33] px-5 py-24 text-white md:px-8">
        <div className="absolute inset-0 bg-gradient-to-r from-[#071E33] via-[#0D3B66] to-[#071E33]" />

        <div className="relative mx-auto max-w-7xl">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-[#F2B544]">
            Selected Project Portfolio
          </p>

          <h1 className="max-w-5xl text-4xl font-black leading-tight md:text-7xl">
            Construction experience across delivery, consultancy and cost
            management.
          </h1>

          <p className="mt-6 max-w-3xl text-base leading-8 text-white/75 md:text-lg">
            Explore selected construction, renovation, consultancy,
            subcontract and professional project references across Nigeria
            and East Africa.
          </p>
        </div>
      </section>

      <section className="border-b border-[#0D3B66]/10 bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 py-9 sm:grid-cols-2 md:px-8 lg:grid-cols-3">
          <ProjectStat
            value={companyProjectCount}
            label="Charismak Project References"
            icon={Building2}
          />

          <ProjectStat
            value={professionalProjectCount}
            label="MD Professional References"
            icon={BriefcaseBusiness}
          />

          <ProjectStat
            value={visibleProjects.length}
            label="Projects Displayed"
            icon={CheckCircle2}
          />
        </div>
      </section>

      <section className="bg-[#F5F7FA] px-5 py-20 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-7 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-[#C8A45D]">
                Our Projects
              </p>

              <h2 className="text-3xl font-semibold leading-tight text-[#0D3B66] md:text-5xl">
                Selected company and professional project references.
              </h2>
            </div>

            <p className="max-w-2xl text-base leading-8 text-[#3A4653] lg:justify-self-end">
              Use the filters to explore projects by engagement type. Every
              project page includes the relevant role, organisation and
              professional attribution.
            </p>
          </div>

          <div className="mt-10 border border-[#0D3B66]/10 bg-white p-4">
            <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#0D3B66]">
              <Filter className="h-4 w-4 text-[#A82B05]" />
              Filter Projects
            </div>

            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => {
                const active = activeFilter === filter;

                return (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setActiveFilter(filter)}
                    className={`px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] transition ${
                      active
                        ? "bg-[#0D3B66] text-white"
                        : "border border-[#0D3B66]/15 bg-white text-[#0D3B66] hover:border-[#A82B05] hover:text-[#A82B05]"
                    }`}
                  >
                    {filter}
                  </button>
                );
              })}
            </div>
          </div>

          {filteredProjects.length > 0 ? (
            <div className="mt-10 grid gap-7 md:grid-cols-2 xl:grid-cols-3">
              {filteredProjects.map((project) => (
                <ProjectCard key={project.slug} project={project} />
              ))}
            </div>
          ) : (
            <div className="mt-10 border border-[#0D3B66]/10 bg-white p-10 text-center">
              <h3 className="text-xl font-bold text-[#0D3B66]">
                No project currently matches this filter.
              </h3>

              <button
                type="button"
                onClick={() => setActiveFilter("All Projects")}
                className="mt-5 bg-[#A82B05] px-6 py-3 text-sm font-bold text-white"
              >
                View All Projects
              </button>
            </div>
          )}

          <div className="mt-10 flex flex-col justify-between gap-6 border-l-4 border-[#C8A45D] bg-white p-6 md:flex-row md:items-center">
            <div className="flex gap-4">
              <BriefcaseBusiness className="mt-1 h-6 w-6 shrink-0 text-[#A82B05]" />

              <div>
                <h3 className="font-bold text-[#0D3B66]">
                  Managing Director&rsquo;s Professional Portfolio
                </h3>

                <p className="mt-2 max-w-4xl text-sm leading-7 text-[#3A4653]">
                  Selected references include projects in which the Managing
                  Director participated while professionally engaged by other
                  organisations. The full professional portfolio is available
                  on the MD profile page.
                </p>
              </div>
            </div>

            <Link
              href="/md-profile#professional-projects"
              className="inline-flex shrink-0 items-center gap-2 font-bold text-[#A82B05]"
            >
              View Full MD Portfolio
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function ProjectStat({
  value,
  label,
  icon: Icon,
}: {
  value: number;
  label: string;
  icon: typeof Building2;
}) {
  return (
    <div className="flex gap-4 border-l-2 border-[#C8A45D] pl-5">
      <Icon className="h-8 w-8 shrink-0 text-[#A82B05]" />

      <div>
        <p className="text-2xl font-black text-[#0D3B66]">{value}</p>

        <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-[#3A4653]">
          {label}
        </p>
      </div>
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const isProfessionalReference =
    project.publicCategory === "MD Professional Experience";

  return (
    <Link
      href={`/projects/${project.slug}`}
      className="group overflow-hidden border border-[#0D3B66]/10 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_25px_60px_rgba(7,30,51,0.14)]"
    >
      <div className="relative h-[300px] overflow-hidden bg-[#071E33]">
        <Image
          src={project.cover}
          alt={project.title}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition duration-700 group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-[#071E33]/90 via-[#071E33]/10 to-transparent" />

        <div className="absolute left-5 top-5 bg-[#A82B05] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
          {project.engagementTag}
        </div>

        {isProfessionalReference && (
          <div className="absolute right-5 top-5 border border-white/25 bg-[#071E33]/75 px-3 py-2 text-[9px] font-bold uppercase tracking-[0.12em] text-white backdrop-blur">
            Professional Experience
          </div>
        )}

        <div className="absolute bottom-5 left-5 flex items-center gap-2 text-sm font-semibold text-white">
          <MapPin className="h-4 w-4 text-[#F2B544]" />
          {project.location}
        </div>
      </div>

      <div className="p-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C8A45D]">
          {project.organisation}
        </p>

        <h3 className="mt-3 text-2xl font-bold leading-tight text-[#0D3B66]">
          {project.title}
        </h3>

        <p className="mt-2 text-sm font-semibold text-[#A82B05]">
          {project.role}
        </p>

        <p className="mt-4 line-clamp-3 text-sm leading-7 text-[#3A4653]">
          {project.summary}
        </p>

        <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-[#3A4653]">
          <CheckCircle2 className="h-4 w-4 text-[#C8A45D]" />
          {project.status}
        </div>

        <div className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#0D3B66] transition group-hover:text-[#A82B05]">
          View Project
          <ArrowRight className="h-4 w-4" />
        </div>
      </div>
    </Link>
  );
}