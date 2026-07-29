import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  MapPin,
} from "lucide-react";

import ProjectMediaGallery from "../../components/ProjectMediaGallery";
import { projects } from "../../site-data";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return projects.map((project) => ({
    slug: project.slug,
  }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const project = projects.find((item) => item.slug === slug);

  if (!project) {
    return { title: "Project Not Found" };
  }

  return {
    title: project.title,
    description: project.summary,
  };
}

export default async function ProjectDetailsPage({ params }: Props) {
  const { slug } = await params;

  const project = projects.find((item) => item.slug === slug);

  if (!project) {
    notFound();
  }

  const isProfessionalReference =
    project.publicCategory === "MD Professional Experience";

  const relatedProjects = projects
    .filter(
      (item) =>
        item.slug !== project.slug &&
        item.engagementTag === project.engagementTag
    )
    .slice(0, 3);

  return (
    <main className="min-h-screen bg-[#F5F7FA] pt-20">
      <section className="relative min-h-[78vh] overflow-hidden bg-[#071E33] text-white">
        <div className="absolute inset-0">
          <Image
            src={project.heroImages[0] || project.cover}
            alt={project.title}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-[#071E33]/98 via-[#0D3B66]/82 to-[#071E33]/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#071E33]/85 via-transparent to-[#071E33]/20" />
        </div>

        <div className="relative mx-auto flex min-h-[78vh] max-w-7xl items-end px-5 pb-16 md:px-8">
          <div className="max-w-5xl">
            <Link
              href="/projects"
              className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-white/75 transition hover:text-[#F2B544]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Projects
            </Link>

            <p className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-[#F2B544]">
              {project.engagementTag}
            </p>

            <h1 className="text-4xl font-black leading-tight md:text-7xl">
              {project.title}
            </h1>

            {project.heroTitle && (
              <p className="mt-5 max-w-3xl text-base leading-8 text-white/75">
                {project.heroTitle}
              </p>
            )}

            <div className="mt-7 flex flex-wrap gap-3">
              <span className="bg-[#A82B05] px-5 py-3 text-sm font-bold">
                {project.role}
              </span>

              <span className="border border-white/25 bg-white/5 px-5 py-3 text-sm font-bold backdrop-blur">
                {project.status}
              </span>

              <span className="flex items-center gap-2 border border-white/25 bg-white/5 px-5 py-3 text-sm font-bold backdrop-blur">
                <MapPin className="h-4 w-4 text-[#F2B544]" />
                {project.location}
              </span>
            </div>
          </div>
        </div>
      </section>

      {isProfessionalReference && (
        <section className="bg-[#0D3B66] px-5 py-6 text-white md:px-8">
          <div className="mx-auto flex max-w-7xl gap-4">
            <BriefcaseBusiness className="mt-1 h-6 w-6 shrink-0 text-[#F2B544]" />

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F2B544]">
                Professional Experience Reference
              </p>

              <p className="mt-2 max-w-5xl text-sm leading-7 text-white/75">
                {project.attribution}
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="px-5 py-14 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-5 sm:grid-cols-2 lg:grid-cols-5">
          <ProjectFact label="Engagement" value={project.engagementTag} />

          <ProjectFact label="Role" value={project.role} />

          <ProjectFact label="Organisation" value={project.organisation} />

          <ProjectFact label="Location" value={project.location} />

          <ProjectFact label="Status" value={project.status} />
        </div>
      </section>

      <section className="bg-white px-5 py-20 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-[#C8A45D]">
              Project Overview
            </p>

            <h2 className="text-3xl font-semibold leading-tight text-[#0D3B66] md:text-5xl">
              Technical delivery supported by coordination, quality and
              commercial awareness.
            </h2>
          </div>

          <div>
            <p className="text-base leading-8 text-[#3A4653]">
              {project.summary}
            </p>

            <div className="mt-8 border-l-4 border-[#C8A45D] bg-[#F5F7FA] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#A82B05]">
                Project Attribution
              </p>

              <p className="mt-3 text-sm leading-7 text-[#3A4653]">
                {project.attribution}
              </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {project.services.map((service) => (
                <div
                  key={service}
                  className="flex items-center gap-3 border border-[#0D3B66]/10 bg-white p-5 shadow-sm"
                >
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-[#A82B05]" />

                  <span className="font-semibold text-[#0D3B66]">
                    {service}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#F5F7FA] px-5 py-20 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-[#C8A45D]">
                Project Media
              </p>

              <h2 className="max-w-4xl text-3xl font-semibold leading-tight text-[#0D3B66] md:text-5xl">
                Selected project images and visual documentation.
              </h2>
            </div>

            <p className="max-w-md text-sm leading-7 text-[#3A4653]">
              Main images present the strongest project views, while the
              supporting gallery provides additional context.
            </p>
          </div>

          <ProjectMediaGallery
            title={project.title}
            images={project.images}
            videos={project.videos}
          />
        </div>
      </section>

      {relatedProjects.length > 0 && (
        <section className="bg-white px-5 py-20 md:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div>
                <p className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-[#C8A45D]">
                  Related Projects
                </p>

                <h2 className="max-w-4xl text-3xl font-semibold leading-tight text-[#0D3B66] md:text-5xl">
                  More project references.
                </h2>
              </div>

              <Link
                href="/projects"
                className="inline-flex items-center gap-2 font-bold text-[#A82B05]"
              >
                All Projects
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              {relatedProjects.map((item) => (
                <Link
                  key={item.slug}
                  href={`/projects/${item.slug}`}
                  className="group overflow-hidden border border-[#0D3B66]/10 bg-white transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative h-64 overflow-hidden bg-[#071E33]">
                    <Image
                      src={item.cover}
                      alt={item.title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 33vw"
                      className="object-cover transition duration-700 group-hover:scale-105"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-[#071E33]/80 via-transparent to-transparent" />

                    <div className="absolute left-4 top-4 bg-[#A82B05] px-3 py-2 text-[9px] font-bold uppercase tracking-[0.12em] text-white">
                      {item.engagementTag}
                    </div>
                  </div>

                  <div className="p-6">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#C8A45D]">
                      {item.organisation}
                    </p>

                    <h3 className="mt-3 text-xl font-bold text-[#0D3B66]">
                      {item.title}
                    </h3>

                    <p className="mt-2 text-sm font-semibold text-[#A82B05]">
                      {item.role}
                    </p>

                    <p className="mt-3 flex items-center gap-2 text-sm text-[#3A4653]">
                      <MapPin className="h-4 w-4 text-[#C8A45D]" />
                      {item.location}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="bg-[#F5F7FA] px-5 py-16 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#C8A45D]">
              Explore More
            </p>

            <h2 className="mt-3 text-2xl font-bold text-[#0D3B66] md:text-3xl">
              View the complete project portfolio.
            </h2>
          </div>

          <Link
            href="/projects"
            className="inline-flex items-center justify-center gap-3 bg-[#0D3B66] px-7 py-4 text-sm font-bold text-white transition hover:bg-[#A82B05]"
          >
            Browse All Projects
            <Building2 className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </main>
  );
}

function ProjectFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[#0D3B66]/10 bg-white p-6">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#C8A45D]">
        {label}
      </p>

      <p className="mt-3 text-sm font-bold leading-6 text-[#0D3B66]">
        {value}
      </p>
    </div>
  );
}