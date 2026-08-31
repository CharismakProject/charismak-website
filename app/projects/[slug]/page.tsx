import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Building2, CheckCircle2, MapPin } from "lucide-react";

import ProjectMediaGallery from "../../components/ProjectMediaGallery";
import { publicProjectBySlug, publicProjects } from "@/lib/content/public-projects";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return publicProjects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const project = publicProjectBySlug(slug);
  if (!project) return { title: "Project Not Found" };
  return { title: project.title, description: project.summary };
}

export default async function ProjectDetailsPage({ params }: Props) {
  const { slug } = await params;
  const project = publicProjectBySlug(slug);
  if (!project) notFound();

  const relatedProjects = publicProjects
    .filter((item) => item.slug !== project.slug && item.engagementTag === project.engagementTag)
    .slice(0, 3);

  return (
    <main className="overflow-hidden bg-white pt-20">
      <section className="relative min-h-[78vh] overflow-hidden bg-[#071E33] text-white">
        <Image src={project.heroImages[0] || project.cover} alt={project.title} fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#071E33]/97 via-[#071E33]/76 to-[#071E33]/22" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#071E33]/82 via-transparent to-transparent" />

        <div className="relative mx-auto flex min-h-[78vh] max-w-7xl items-end px-5 pb-16 md:px-8">
          <div className="max-w-5xl">
            <Link href="/projects" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-white/72 transition hover:text-[#F2B544]">
              <ArrowLeft className="h-4 w-4" /> Back to Projects
            </Link>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-[#F2B544]">{project.engagementTag}</p>
            <h1 className="max-w-5xl text-5xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-6xl lg:text-7xl">{project.title}</h1>
            {project.heroTitle && <p className="mt-6 max-w-3xl text-base leading-8 text-white/72 md:text-lg">{project.heroTitle}</p>}
            <div className="mt-8 flex flex-wrap gap-3">
              <span className="bg-[#0D3B66] px-5 py-3 text-sm font-bold text-white">{project.role}</span>
              <span className="border border-white/25 bg-white/5 px-5 py-3 text-sm font-bold backdrop-blur">{project.status}</span>
              <span className="flex items-center gap-2 border border-white/25 bg-white/5 px-5 py-3 text-sm font-bold backdrop-blur"><MapPin className="h-4 w-4 text-[#F2B544]" />{project.location}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#0D3B66]/10 bg-white px-5 py-12 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <ProjectFact label="Engagement" value={project.engagementTag} />
          <ProjectFact label="Role" value={project.role} />
          <ProjectFact label="Organisation" value={project.organisation} />
          <ProjectFact label="Location" value={project.location} />
          <ProjectFact label="Status" value={project.status} />
        </div>
      </section>

      <section className="px-5 py-20 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.72fr_1.28fr]">
          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-[#C8A45D]">Project Overview</p>
            <h2 className="text-3xl font-semibold leading-tight tracking-[-0.03em] text-[#071E33] md:text-5xl">Scope and delivery.</h2>
          </div>
          <div>
            <p className="text-lg leading-9 text-[#3A4653]">{project.summary}</p>
            <div className="mt-10 grid gap-px overflow-hidden border border-[#0D3B66]/10 bg-[#0D3B66]/10 sm:grid-cols-2">
              {project.services.map((service) => (
                <div key={service} className="flex items-center gap-3 bg-white p-5">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-[#C8A45D]" />
                  <span className="font-semibold text-[#071E33]">{service}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#F7F8FA] px-5 py-20 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-[#C8A45D]">Project Gallery</p>
              <h2 className="text-3xl font-semibold leading-tight tracking-[-0.03em] text-[#071E33] md:text-5xl">Selected project images.</h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-[#3A4653]">A visual record of the project, including works in progress and completed areas where available.</p>
          </div>
          <ProjectMediaGallery title={project.title} images={project.images} videos={project.videos} />
        </div>
      </section>

      {relatedProjects.length > 0 && (
        <section className="bg-white px-5 py-20 md:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div>
                <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-[#C8A45D]">Related Projects</p>
                <h2 className="text-3xl font-semibold leading-tight tracking-[-0.03em] text-[#071E33] md:text-5xl">More project experience.</h2>
              </div>
              <Link href="/projects" className="inline-flex items-center gap-2 text-sm font-bold text-[#0D3B66] transition hover:text-[#C8A45D]">All Projects <ArrowRight className="h-4 w-4" /></Link>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              {relatedProjects.map((item) => (
                <Link key={item.slug} href={`/projects/${item.slug}`} className="group overflow-hidden bg-white shadow-[0_10px_35px_rgba(7,30,51,0.06)] transition hover:-translate-y-1 hover:shadow-[0_22px_55px_rgba(7,30,51,0.12)]">
                  <div className="relative h-64 overflow-hidden bg-[#071E33]">
                    <Image src={item.cover} alt={item.title} fill sizes="(max-width: 1024px) 100vw, 33vw" className="object-cover transition duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#071E33]/80 via-transparent to-transparent" />
                    <div className="absolute left-4 top-4 border border-white/15 bg-[#071E33]/65 px-3 py-2 text-[9px] font-bold uppercase tracking-[0.12em] text-white backdrop-blur">{item.engagementTag}</div>
                  </div>
                  <div className="p-6">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#C8A45D]">{item.organisation}</p>
                    <h3 className="mt-3 text-xl font-semibold text-[#071E33]">{item.title}</h3>
                    <p className="mt-2 text-sm font-semibold text-[#0D3B66]">{item.role}</p>
                    <p className="mt-3 flex items-center gap-2 text-sm text-[#3A4653]"><MapPin className="h-4 w-4 text-[#C8A45D]" />{item.location}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="bg-[#071E33] px-5 py-16 text-white md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#F2B544]">Our Portfolio</p>
            <h2 className="mt-3 text-2xl font-semibold md:text-3xl">Explore more Charismak projects and professional experience.</h2>
          </div>
          <Link href="/projects" className="inline-flex items-center justify-center gap-3 bg-[#C8A45D] px-7 py-4 text-sm font-bold text-[#071E33] transition hover:bg-white">Browse Projects <Building2 className="h-5 w-5" /></Link>
        </div>
      </section>
    </main>
  );
}

function ProjectFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-l border-[#C8A45D] pl-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#3A4653]/60">{label}</p>
      <p className="mt-3 text-sm font-semibold leading-6 text-[#071E33]">{value}</p>
    </div>
  );
}
