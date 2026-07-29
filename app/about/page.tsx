import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Eye,
  Flag,
  ShieldCheck,
  Target,
} from "lucide-react";

import { company, projects, services } from "../site-data";

export const metadata = {
  title: "About Us",
  description:
    "Learn about Charismak Project Nigeria Limited — a registered Abuja-based construction company delivering building construction, renovation, and project management services.",
};

const principles = [
  {
    title: "Clear Project Control",
    text:
      "Defined responsibilities, coordinated reporting and disciplined supervision support every stage of delivery.",
    icon: Target,
  },
  {
    title: "Quality-Focused Execution",
    text:
      "Materials, workmanship and completed activities are reviewed against agreed requirements and project standards.",
    icon: ShieldCheck,
  },
  {
    title: "Professional Communication",
    text:
      "Clients receive clear updates, practical recommendations and transparent project information.",
    icon: BadgeCheck,
  },
];

export default function AboutPage() {
  const projectCount = projects.length;
  const serviceCount = services.length;

  return (
    <main className="overflow-hidden bg-white pt-20">
      <section className="relative min-h-[70vh] overflow-hidden bg-[#071E33] text-white">
        <div className="absolute inset-0">
          <Image
            src="/Images/Projects/Djibouti/cover.jpg"
            alt="Charismak construction project"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-[#071E33]/98 via-[#0D3B66]/88 to-[#071E33]/35" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#071E33]/65 via-transparent to-[#071E33]/15" />
        </div>

        <div className="relative mx-auto flex min-h-[70vh] max-w-7xl items-center px-5 py-24 md:px-8">
          <div className="max-w-4xl">
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.3em] text-[#F2B544]">
              About Charismak
            </p>

            <h1 className="text-4xl font-black leading-tight tracking-tight md:text-7xl">
              Building confidence through professional construction delivery.
            </h1>

            <p className="mt-7 max-w-3xl text-base leading-8 text-white/80 md:text-lg">
              {company.about}
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                href="/projects"
                className="inline-flex items-center gap-3 bg-[#A82B05] px-7 py-4 text-sm font-bold text-white transition hover:bg-[#C8A45D]"
              >
                Explore Our Projects
                <ArrowRight className="h-5 w-5" />
              </Link>

              <Link
                href={company.profilePdf}
                target="_blank"
                className="inline-flex items-center gap-3 border border-white/30 bg-white/5 px-7 py-4 text-sm font-bold text-white backdrop-blur transition hover:border-[#F2B544]"
              >
                Company Profile
                <Building2 className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#0D3B66]/10 bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 py-9 sm:grid-cols-2 md:px-8 lg:grid-cols-4">
          {[
            [company.rcNumber.replace("RC No: ", ""), "Registration Number"],
            [`${projectCount}+`, "Project References"],
            [`${serviceCount}`, "Core Service Areas"],
            ["Nigeria & East Africa", "Project Experience"],
          ].map(([value, label]) => (
            <div key={label} className="border-l-2 border-[#C8A45D] pl-5">
              <p className="text-2xl font-black text-[#0D3B66] md:text-3xl">
                {value}
              </p>

              <p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-[#3A4653]">
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-5 py-20 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-[#C8A45D]">
              Who We Are
            </p>

            <h2 className="text-3xl font-semibold leading-tight text-[#0D3B66] md:text-5xl">
              A Nigerian construction company built around value, quality and
              accountability.
            </h2>

            <p className="mt-6 text-base leading-8 text-[#3A4653]">
              {company.overview}
            </p>

            <p className="mt-5 text-base leading-8 text-[#3A4653]">
              Our approach combines construction management, quantity
              surveying, technical supervision, procurement coordination and
              quality control to support reliable project outcomes.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {company.values.map((value) => (
                <div
                  key={value}
                  className="flex items-center gap-3 border border-[#0D3B66]/10 bg-[#F5F7FA] p-4 font-bold text-[#0D3B66]"
                >
                  <BadgeCheck className="h-5 w-5 shrink-0 text-[#A82B05]" />
                  {value}
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="relative min-h-[520px] overflow-hidden sm:row-span-2">
              <Image
                src="/Images/Projects/Djibouti/cover.jpg"
                alt="Djibouti residential estate project"
                fill
                sizes="(max-width: 1024px) 100vw, 30vw"
                className="object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-[#071E33]/70 via-transparent to-transparent" />

              <div className="absolute bottom-0 p-6 text-white">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F2B544]">
                  Construction Delivery
                </p>

                <h3 className="mt-3 text-2xl font-bold">
                  Quality supported by controlled site execution.
                </h3>
              </div>
            </div>

            <div className="relative min-h-[250px] overflow-hidden">
              <Image
                src="/Images/Projects/Flawless/cover.jpg"
                alt="Charismak renovation and finishing"
                fill
                sizes="(max-width: 640px) 100vw, 25vw"
                className="object-cover"
              />
            </div>

            <div className="relative min-h-[250px] overflow-hidden bg-[#0D3B66] p-7 text-white">
              <Building2 className="h-9 w-9 text-[#F2B544]" />

              <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-[#F2B544]">
                Our Capability
              </p>

              <p className="mt-4 text-xl font-bold leading-8">
                Construction, consultancy, renovation, project management and
                specialist technical delivery.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#F5F7FA] px-5 py-20 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-px overflow-hidden border border-[#0D3B66]/10 bg-[#0D3B66]/10 lg:grid-cols-2">
            <article className="bg-white p-8 md:p-12">
              <div className="flex items-center gap-3">
                <Eye className="h-7 w-7 text-[#A82B05]" />

                <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#C8A45D]">
                  Our Vision
                </p>
              </div>

              <h2 className="mt-7 text-3xl font-semibold leading-tight text-[#0D3B66] md:text-5xl">
                Building a respected construction brand.
              </h2>

              <p className="mt-6 text-base leading-8 text-[#3A4653]">
                {company.vision}
              </p>

              <Link
                href="/vision"
                className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[#A82B05]"
              >
                View Vision & Mission
                <ArrowRight className="h-4 w-4" />
              </Link>
            </article>

            <article className="bg-[#0D3B66] p-8 text-white md:p-12">
              <div className="flex items-center gap-3">
                <Flag className="h-7 w-7 text-[#F2B544]" />

                <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#F2B544]">
                  Our Mission
                </p>
              </div>

              <h2 className="mt-7 text-3xl font-semibold leading-tight md:text-5xl">
                Delivering reliable solutions through professional control.
              </h2>

              <p className="mt-6 text-base leading-8 text-white/75">
                {company.mission}
              </p>

              <Link
                href="/vision"
                className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[#F2B544]"
              >
                Read More
                <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          </div>
        </div>
      </section>

      <section className="px-5 py-20 md:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-[#C8A45D]">
            How We Operate
          </p>

          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <h2 className="max-w-4xl text-3xl font-semibold leading-tight text-[#0D3B66] md:text-5xl">
              Practical principles supporting better project outcomes.
            </h2>

            <p className="max-w-md text-sm leading-7 text-[#3A4653]">
              Our internal approach is structured to improve accountability,
              coordination and project visibility.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {principles.map((principle) => {
              const Icon = principle.icon;

              return (
                <article
                  key={principle.title}
                  className="border border-[#0D3B66]/10 bg-[#F5F7FA] p-7 transition hover:-translate-y-1 hover:bg-white hover:shadow-[0_22px_55px_rgba(7,30,51,0.12)]"
                >
                  <Icon className="h-8 w-8 text-[#A82B05]" />

                  <h3 className="mt-7 text-xl font-bold text-[#0D3B66]">
                    {principle.title}
                  </h3>

                  <p className="mt-4 text-sm leading-7 text-[#3A4653]">
                    {principle.text}
                  </p>
                </article>
              );
            })}
          </div>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/services"
              className="inline-flex items-center gap-3 bg-[#0D3B66] px-7 py-4 text-sm font-bold text-white transition hover:bg-[#A82B05]"
            >
              Explore Our Services
              <ArrowRight className="h-5 w-5" />
            </Link>

            <Link
              href="/leadership"
              className="inline-flex items-center gap-3 border border-[#0D3B66]/20 px-7 py-4 text-sm font-bold text-[#0D3B66] transition hover:border-[#A82B05] hover:text-[#A82B05]"
            >
              Meet Our Team
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}