import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Download,
  GraduationCap,
  Mail,
  MapPin,
} from "lucide-react";

import { mdProfile, projects, type Project } from "../site-data";

export const metadata = {
  title: "Managing Director Profile",
  description:
    "Abiodun Christopher Akinola, MNIQS — Managing Director of Charismak Project Nigeria Limited. Quantity Surveyor and Construction Project Manager with international experience.",
};

export default function MDProfilePage() {
  const professionalProjects = projects.filter(
    (project) => project.publicCategory === "MD Professional Experience"
  );

  return (
    <main className="bg-white pt-20">
      <section className="bg-[#071E33] text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-24 md:px-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative min-h-[520px] overflow-hidden bg-white/10 shadow-2xl">
            <Image
              src={mdProfile.image}
              alt={mdProfile.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="object-cover object-top"
            />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#F2B544]">
              Managing Director Profile
            </p>

            <h1 className="mt-4 text-4xl font-black leading-tight md:text-7xl">
              {mdProfile.name}
            </h1>

            <p className="mt-5 text-xl font-bold text-[#F2B544]">
              {mdProfile.position}
            </p>

            <p className="mt-2 text-lg text-white/70">{mdProfile.subtitle}</p>

            <p className="mt-8 max-w-3xl text-base leading-8 text-white/75">
              {mdProfile.summary}
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                href={mdProfile.resume}
                target="_blank"
                className="inline-flex items-center gap-3 bg-[#A82B05] px-7 py-4 text-sm font-bold text-white transition hover:bg-[#C8A45D]"
              >
                Download Resume
                <Download className="h-5 w-5" />
              </Link>

              <Link
                href={`mailto:${mdProfile.email}`}
                className="inline-flex items-center gap-3 border border-white/25 px-7 py-4 text-sm font-bold text-white transition hover:border-[#F2B544]"
              >
                Contact MD
                <Mail className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#F5F7FA] px-5 py-20 md:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-[#C8A45D]">
            Professional Highlights
          </p>

          <h2 className="max-w-4xl text-3xl font-semibold leading-tight text-[#0D3B66] md:text-5xl">
            Construction leadership supported by cost, contract and project
            delivery experience.
          </h2>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {mdProfile.highlights.map((item) => (
              <div
                key={item}
                className="flex gap-4 border border-[#0D3B66]/10 bg-white p-6"
              >
                <Award className="h-6 w-6 shrink-0 text-[#A82B05]" />

                <p className="font-semibold leading-7 text-[#0D3B66]">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 md:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-[#C8A45D]">
            Expertise
          </p>

          <h2 className="max-w-3xl text-3xl font-semibold leading-tight text-[#0D3B66] md:text-5xl">
            Core areas of professional capability.
          </h2>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {mdProfile.expertise.map((item) => (
              <div
                key={item}
                className="border border-[#0D3B66]/10 bg-[#F5F7FA] p-5 text-sm font-bold text-[#0D3B66]"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="professional-projects"
        className="scroll-mt-24 bg-[#071E33] px-5 py-20 text-white md:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
            <div>
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center bg-[#A82B05]">
                  <BriefcaseBusiness className="h-5 w-5" />
                </div>

                <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#F2B544]">
                  Professional Project Experience
                </p>
              </div>

              <h2 className="mt-6 max-w-4xl text-3xl font-semibold leading-tight md:text-5xl">
                Selected quantity surveying, cost management and project
                delivery references.
              </h2>
            </div>

            <p className="max-w-2xl text-base leading-8 text-white/70 lg:justify-self-end">
              These references demonstrate the Managing Director&rsquo;s
              professional involvement while working with other organisations
              across residential, commercial, institutional, fabrication and
              international projects.
            </p>
          </div>

          <div className="mt-8 border-l-4 border-[#F2B544] bg-white/5 p-6">
            <p className="text-sm leading-7 text-white/75">
              Projects in this section represent individual career experience
              and are not presented as contracts awarded to Charismak Project
              Nigeria Limited.
            </p>
          </div>

          <div className="mt-12 grid gap-7 md:grid-cols-2 xl:grid-cols-3">
            {professionalProjects.map((project) => (
              <MDProjectCard key={project.slug} project={project} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#F5F7FA] px-5 py-20 md:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-[#C8A45D]">
            Education
          </p>

          <div className="grid gap-6 md:grid-cols-2">
            {mdProfile.education.map((item) => (
              <div
                key={item.degree}
                className="border border-[#0D3B66]/10 bg-white p-7"
              >
                <GraduationCap className="h-7 w-7 text-[#A82B05]" />

                <h3 className="mt-5 text-xl font-bold text-[#0D3B66]">
                  {item.degree}
                </h3>

                <p className="mt-2 text-sm font-bold text-[#A82B05]">
                  {item.institution}
                </p>

                <p className="mt-2 text-sm text-[#3A4653]">{item.year}</p>

                <p className="mt-2 text-sm leading-7 text-[#3A4653]">
                  {item.note}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-[#C8A45D]">
              Certifications
            </p>

            <h2 className="text-3xl font-semibold leading-tight text-[#0D3B66] md:text-5xl">
              Professional memberships and certifications.
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {mdProfile.certifications.map((item) => (
              <div
                key={item}
                className="flex gap-3 border border-[#0D3B66]/10 bg-white p-5 text-sm font-semibold text-[#0D3B66] shadow-sm"
              >
                <Award className="h-5 w-5 shrink-0 text-[#A82B05]" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#F5F7FA] px-5 py-16 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#C8A45D]">
              Charismak Project Portfolio
            </p>

            <h2 className="mt-3 text-2xl font-bold text-[#0D3B66] md:text-3xl">
              Explore selected company and professional project references.
            </h2>
          </div>

          <Link
            href="/projects"
            className="inline-flex items-center justify-center gap-3 bg-[#0D3B66] px-7 py-4 text-sm font-bold text-white transition hover:bg-[#A82B05]"
          >
            View Projects
            <Building2 className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </main>
  );
}

function MDProjectCard({ project }: { project: Project }) {
  return (
    <Link
      href={`/projects/${project.slug}`}
      className="group overflow-hidden border border-white/15 bg-white/5 transition duration-300 hover:-translate-y-1 hover:bg-white/10"
    >
      <div className="relative h-[270px] overflow-hidden bg-[#0D3B66]">
        <Image
          src={project.cover}
          alt={project.title}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition duration-700 group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-[#071E33]/90 via-transparent to-transparent" />

        <div className="absolute left-5 top-5 bg-[#A82B05] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
          {project.engagementTag}
        </div>

        <div className="absolute bottom-5 left-5 flex items-center gap-2 text-sm text-white">
          <MapPin className="h-4 w-4 text-[#F2B544]" />
          {project.location}
        </div>
      </div>

      <div className="p-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#F2B544]">
          {project.organisation}
        </p>

        <h3 className="mt-3 text-xl font-bold">{project.title}</h3>

        <p className="mt-2 text-sm font-semibold text-white/75">
          {project.role}
        </p>

        <p className="mt-4 line-clamp-3 text-sm leading-7 text-white/65">
          {project.summary}
        </p>

        <div className="mt-5 flex items-center gap-2 text-xs text-white/60">
          <CheckCircle2 className="h-4 w-4 text-[#F2B544]" />
          {project.status}
        </div>

        <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#F2B544]">
          View Project Reference
          <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}