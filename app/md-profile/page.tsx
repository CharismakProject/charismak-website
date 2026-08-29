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
    <main className="overflow-hidden bg-white pt-20">
      <section className="relative overflow-hidden bg-[#071E33] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_16%,rgba(200,164,93,0.14),transparent_30rem)]" />
        <div className="relative mx-auto grid min-h-[660px] max-w-7xl items-center gap-14 px-5 py-20 md:px-8 lg:grid-cols-[0.72fr_1.28fr]">
          <div className="relative min-h-[520px] overflow-hidden border border-white/10 bg-white/5 shadow-2xl">
            <Image
              src={mdProfile.image}
              alt={mdProfile.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#071E33]/35 to-transparent" />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.32em] text-[#F2B544]">
              Managing Director Profile
            </p>
            <h1 className="mt-5 text-5xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
              {mdProfile.name}
            </h1>
            <p className="mt-6 text-xl font-semibold text-[#E8C77F]">{mdProfile.position}</p>
            <p className="mt-2 text-base text-white/60">{mdProfile.subtitle}</p>
            <p className="mt-8 max-w-3xl text-base leading-8 text-white/72">{mdProfile.summary}</p>

            <div className="mt-9 flex flex-wrap gap-4">
              <Link href={mdProfile.resume} target="_blank" className="inline-flex items-center gap-3 bg-[#0D3B66] px-7 py-4 text-sm font-bold text-white transition hover:bg-[#C8A45D] hover:text-[#071E33]">
                Download Resume <Download className="h-5 w-5" />
              </Link>
              <Link href={`mailto:${mdProfile.email}`} className="inline-flex items-center gap-3 border border-white/30 bg-white/5 px-7 py-4 text-sm font-bold text-white transition hover:bg-white hover:text-[#071E33]">
                Contact MD <Mail className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#F7F8FA] px-5 py-20 md:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-[#C8A45D]">Professional Highlights</p>
          <div className="grid gap-8 lg:grid-cols-[0.62fr_1.38fr] lg:items-end">
            <h2 className="text-3xl font-semibold leading-tight tracking-[-0.03em] text-[#071E33] md:text-5xl">
              Construction leadership backed by cost and project delivery experience.
            </h2>
            <p className="max-w-2xl text-base leading-8 text-[#3A4653] lg:justify-self-end">
              Professional capability spans quantity surveying, commercial management, construction delivery and multidisciplinary project coordination.
            </p>
          </div>

          <div className="mt-12 grid gap-px overflow-hidden border border-[#0D3B66]/10 bg-[#0D3B66]/10 md:grid-cols-2">
            {mdProfile.highlights.map((item, index) => (
              <div key={item} className="flex gap-4 bg-white p-6">
                <span className="text-xs font-bold tracking-[0.18em] text-[#C8A45D]">0{index + 1}</span>
                <p className="font-semibold leading-7 text-[#071E33]">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.55fr_1.45fr]">
          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-[#C8A45D]">Expertise</p>
            <h2 className="text-3xl font-semibold leading-tight tracking-[-0.03em] text-[#071E33] md:text-5xl">Core professional capability.</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mdProfile.expertise.map((item) => (
              <div key={item} className="border-t border-[#0D3B66]/15 pt-5 text-sm font-semibold leading-6 text-[#071E33]">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="professional-projects" className="scroll-mt-24 bg-[#071E33] px-5 py-20 text-white md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.65fr_1.35fr] lg:items-end">
            <div>
              <div className="grid h-12 w-12 place-items-center border border-[#C8A45D]/35 bg-[#C8A45D]/10">
                <BriefcaseBusiness className="h-5 w-5 text-[#F2B544]" />
              </div>
              <p className="mt-6 text-xs font-bold uppercase tracking-[0.28em] text-[#F2B544]">Professional Project Experience</p>
              <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.03em] md:text-5xl">Selected career project references.</h2>
            </div>
            <p className="max-w-2xl text-base leading-8 text-white/68 lg:justify-self-end">
              These references show the Managing Director’s individual professional experience while engaged by other organisations and are not presented as Charismak contracts.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {professionalProjects.map((project) => <MDProjectCard key={project.slug} project={project} />)}
          </div>
        </div>
      </section>

      <section className="bg-[#F7F8FA] px-5 py-20 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2">
          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-[#C8A45D]">Education</p>
            <div className="space-y-4">
              {mdProfile.education.map((item) => (
                <div key={item.degree} className="bg-white p-7 shadow-[0_8px_28px_rgba(7,30,51,0.05)]">
                  <GraduationCap className="h-6 w-6 text-[#0D3B66]" />
                  <h3 className="mt-5 text-xl font-semibold text-[#071E33]">{item.degree}</h3>
                  <p className="mt-2 text-sm font-semibold text-[#0D3B66]">{item.institution}</p>
                  <p className="mt-2 text-sm text-[#3A4653]">{item.year}</p>
                  <p className="mt-3 text-sm leading-7 text-[#3A4653]">{item.note}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-[#C8A45D]">Professional Standing</p>
            <div className="grid gap-px overflow-hidden border border-[#0D3B66]/10 bg-[#0D3B66]/10 sm:grid-cols-2">
              {mdProfile.certifications.map((item) => (
                <div key={item} className="flex gap-3 bg-white p-5 text-sm font-semibold leading-6 text-[#071E33]">
                  <Award className="h-5 w-5 shrink-0 text-[#C8A45D]" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-16 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 border-t border-[#0D3B66]/10 pt-10 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#C8A45D]">Charismak Project Portfolio</p>
            <h2 className="mt-3 text-2xl font-semibold text-[#071E33] md:text-3xl">Explore the work behind the experience.</h2>
          </div>
          <Link href="/projects" className="inline-flex items-center justify-center gap-3 bg-[#0D3B66] px-7 py-4 text-sm font-bold text-white transition hover:bg-[#C8A45D] hover:text-[#071E33]">
            View Projects <Building2 className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </main>
  );
}

function MDProjectCard({ project }: { project: Project }) {
  return (
    <Link href={`/projects/${project.slug}`} className="group overflow-hidden border border-white/12 bg-white/5 transition duration-300 hover:-translate-y-1 hover:bg-white/10">
      <div className="relative h-[270px] overflow-hidden bg-[#0D3B66]">
        <Image src={project.cover} alt={project.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#071E33]/90 via-transparent to-transparent" />
        <div className="absolute bottom-5 left-5 flex items-center gap-2 text-sm text-white">
          <MapPin className="h-4 w-4 text-[#F2B544]" />
          {project.location}
        </div>
      </div>
      <div className="p-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#F2B544]">{project.organisation}</p>
        <h3 className="mt-3 text-xl font-semibold">{project.title}</h3>
        <p className="mt-2 text-sm font-semibold text-white/72">{project.role}</p>
        <p className="mt-4 line-clamp-3 text-sm leading-7 text-white/62">{project.summary}</p>
        <div className="mt-5 flex items-center gap-2 text-xs text-white/55"><CheckCircle2 className="h-4 w-4 text-[#F2B544]" />{project.status}</div>
        <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#F2B544]">View Reference <ArrowRight className="h-4 w-4" /></span>
      </div>
    </Link>
  );
}
