import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  ClipboardCheck,
  HardHat,
  ShieldCheck,
} from "lucide-react";

import { services } from "../site-data";

export const metadata = {
  title: "Our Services",
  description:
    "Building construction, civil engineering, renovation, steel fabrication, project management, and architectural finishing services in Abuja, Nigeria.",
};

const deliveryProcess = [
  {
    title: "Project Consultation",
    text:
      "We review the project brief, site conditions, design intent, budget expectations and required delivery approach.",
  },
  {
    title: "Scope & Planning",
    text:
      "We define responsibilities, procurement requirements, project sequence, reporting structure and execution priorities.",
  },
  {
    title: "Controlled Execution",
    text:
      "Works are coordinated through technical supervision, workforce management, material control and quality inspections.",
  },
  {
    title: "Review & Handover",
    text:
      "Completed works are inspected, documented and prepared for professional handover in line with agreed requirements.",
  },
];

const serviceHighlights = [
  "Clear project scope and responsibilities",
  "Professional site supervision",
  "Cost-conscious procurement coordination",
  "Quality control and progress monitoring",
  "Transparent reporting and communication",
  "Structured project handover",
];

export default function ServicesPage() {
  return (
    <main className="overflow-hidden bg-white pt-20">
      {/* Hero section */}
      <section className="relative min-h-[70vh] overflow-hidden bg-[#071E33] text-white">
        {/* Decorative background without project photographs */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#071E33] via-[#0D3B66] to-[#071E33]" />

          <div className="absolute -right-24 top-10 h-[420px] w-[420px] rounded-full border border-white/10" />
          <div className="absolute -right-10 top-24 h-[300px] w-[300px] rounded-full border border-[#F2B544]/20" />
          <div className="absolute right-20 top-40 h-[170px] w-[170px] rounded-full bg-[#A82B05]/15 blur-2xl" />

          <div className="absolute -bottom-40 -left-28 h-[420px] w-[420px] rounded-full bg-[#0D3B66]/60 blur-3xl" />

          <div
            className="absolute inset-0 opacity-[0.045]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />

          <div className="absolute inset-0 bg-gradient-to-r from-[#071E33] via-transparent to-transparent" />
        </div>

        <div className="relative mx-auto flex min-h-[70vh] max-w-7xl items-center px-5 py-24 md:px-8">
          <div className="max-w-4xl">
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.3em] text-[#F2B544]">
              Our Services
            </p>

            <h1 className="text-4xl font-black leading-tight tracking-tight md:text-7xl">
              Comprehensive construction solutions built around your project.
            </h1>

            <p className="mt-7 max-w-3xl text-base leading-8 text-white/75 md:text-lg">
              Charismak Project Nigeria Limited provides construction,
              engineering, renovation, fabrication, consultancy and project
              management services supported by professional planning,
              supervision and quality control.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center gap-3 bg-[#A82B05] px-7 py-4 text-sm font-bold text-white transition hover:bg-[#C8A45D]"
              >
                Discuss a Project
                <ArrowRight className="h-5 w-5" />
              </Link>

              <Link
                href="/projects"
                className="inline-flex items-center gap-3 border border-white/30 bg-white/5 px-7 py-4 text-sm font-bold text-white backdrop-blur transition hover:border-[#F2B544]"
              >
                View Project Experience
                <Building2 className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Service statistics */}
      <section className="border-b border-[#0D3B66]/10 bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 py-9 sm:grid-cols-2 md:px-8 lg:grid-cols-4">
          {[
            [`${services.length}`, "Core Service Areas"],
            ["Integrated", "Project Delivery"],
            ["Technical", "Site Supervision"],
            ["Client-Focused", "Project Support"],
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

      {/* Services */}
      <section className="bg-[#F5F7FA] px-5 py-20 md:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-[#C8A45D]">
            What We Do
          </p>

          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <h2 className="max-w-4xl text-3xl font-semibold leading-tight text-[#0D3B66] md:text-5xl">
              Professional services across construction, engineering and the
              built environment.
            </h2>

            <p className="max-w-md text-sm leading-7 text-[#3A4653]">
              Each service is supported through coordinated planning,
              supervision, documentation and quality control.
            </p>
          </div>

          <div className="mt-12 grid gap-7 md:grid-cols-2 xl:grid-cols-4">
            {services.map((service, index) => {
              const Icon = service.icon;

              return (
                <article
                  key={service.title}
                  className="group relative flex min-h-[370px] flex-col overflow-hidden border border-[#0D3B66]/10 bg-white p-7 transition duration-300 hover:-translate-y-1 hover:border-[#C8A45D]/50 hover:shadow-[0_25px_60px_rgba(7,30,51,0.14)]"
                >
                  {/* Decorative card number */}
                  <span className="absolute right-5 top-3 text-6xl font-black text-[#0D3B66]/[0.035]">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <div className="relative z-10 grid h-14 w-14 place-items-center bg-[#A82B05] text-white transition duration-300 group-hover:bg-[#0D3B66]">
                    <Icon className="h-7 w-7" />
                  </div>

                  <div className="relative z-10 mt-7 flex flex-1 flex-col">
                    <h3 className="text-xl font-bold leading-tight text-[#0D3B66]">
                      {service.title}
                    </h3>

                    <div className="mt-4 h-[2px] w-12 bg-[#C8A45D] transition-all duration-300 group-hover:w-20" />

                    <p className="mt-5 flex-1 text-sm leading-7 text-[#3A4653]">
                      {service.description}
                    </p>

                    <Link
                      href="/contact"
                      className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[#A82B05] transition hover:text-[#0D3B66]"
                    >
                      Discuss This Service
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Delivery approach */}
      <section className="bg-white px-5 py-20 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="relative flex min-h-[560px] overflow-hidden bg-[#071E33] p-8 text-white md:p-12">
            <div className="absolute inset-0 bg-gradient-to-br from-[#071E33] via-[#0D3B66] to-[#071E33]" />

            <div
              className="absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
                backgroundSize: "42px 42px",
              }}
            />

            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-white/10" />
            <div className="absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-[#A82B05]/15 blur-3xl" />

            <div className="relative z-10 flex w-full flex-col justify-between">
              <div>
                <div className="grid h-16 w-16 place-items-center border border-[#F2B544]/50 bg-white/5 backdrop-blur">
                  <HardHat className="h-8 w-8 text-[#F2B544]" />
                </div>

                <p className="mt-8 text-xs font-bold uppercase tracking-[0.22em] text-[#F2B544]">
                  Delivery Approach
                </p>

                <h3 className="mt-5 max-w-xl text-3xl font-bold leading-tight md:text-4xl">
                  Construction supported by planning, supervision and clear
                  accountability.
                </h3>

                <p className="mt-6 max-w-lg text-sm leading-7 text-white/65">
                  Our project delivery structure brings together planning,
                  procurement coordination, technical supervision, quality
                  inspections and progress reporting.
                </p>
              </div>

              <div className="mt-12 grid grid-cols-2 gap-4">
                <div className="border border-white/10 bg-white/5 p-5">
                  <p className="text-2xl font-black text-[#F2B544]">01</p>
                  <p className="mt-2 text-sm font-semibold text-white">
                    Plan Clearly
                  </p>
                </div>

                <div className="border border-white/10 bg-white/5 p-5">
                  <p className="text-2xl font-black text-[#F2B544]">02</p>
                  <p className="mt-2 text-sm font-semibold text-white">
                    Execute Properly
                  </p>
                </div>

                <div className="border border-white/10 bg-white/5 p-5">
                  <p className="text-2xl font-black text-[#F2B544]">03</p>
                  <p className="mt-2 text-sm font-semibold text-white">
                    Monitor Quality
                  </p>
                </div>

                <div className="border border-white/10 bg-white/5 p-5">
                  <p className="text-2xl font-black text-[#F2B544]">04</p>
                  <p className="mt-2 text-sm font-semibold text-white">
                    Deliver Value
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-[#C8A45D]">
              Why Our Approach Works
            </p>

            <h2 className="text-3xl font-semibold leading-tight text-[#0D3B66] md:text-5xl">
              Better project control from first discussion to completion.
            </h2>

            <p className="mt-6 text-base leading-8 text-[#3A4653]">
              We focus on defining the project scope clearly, coordinating
              resources efficiently and maintaining proper supervision
              throughout construction.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {serviceHighlights.map((item) => (
                <div
                  key={item}
                  className="flex gap-3 border border-[#0D3B66]/10 bg-[#F5F7FA] p-4"
                >
                  <BadgeCheck className="h-5 w-5 shrink-0 text-[#A82B05]" />

                  <span className="text-sm font-semibold leading-6 text-[#0D3B66]">
                    {item}
                  </span>
                </div>
              ))}
            </div>

            <Link
              href="/about"
              className="mt-8 inline-flex items-center gap-2 font-bold text-[#A82B05]"
            >
              Learn About Our Company
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Work process */}
      <section className="bg-[#071E33] px-5 py-20 text-white md:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-[#F2B544]">
            How We Work
          </p>

          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <h2 className="max-w-4xl text-3xl font-semibold leading-tight md:text-5xl">
              A clear process supporting reliable project delivery.
            </h2>

            <p className="max-w-md text-sm leading-7 text-white/65">
              Our process is adapted to the specific requirements of each
              project while maintaining consistent quality and communication.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {deliveryProcess.map((item, index) => (
              <article
                key={item.title}
                className="border border-white/10 bg-white/5 p-7 backdrop-blur transition hover:border-[#F2B544]/40 hover:bg-white/10"
              >
                <div className="flex items-center justify-between">
                  <p className="text-4xl font-black text-[#F2B544]">
                    {String(index + 1).padStart(2, "0")}
                  </p>

                  {index === 0 && (
                    <ClipboardCheck className="h-7 w-7 text-white/60" />
                  )}

                  {index === 1 && (
                    <Building2 className="h-7 w-7 text-white/60" />
                  )}

                  {index === 2 && (
                    <HardHat className="h-7 w-7 text-white/60" />
                  )}

                  {index === 3 && (
                    <ShieldCheck className="h-7 w-7 text-white/60" />
                  )}
                </div>

                <h3 className="mt-7 text-xl font-bold">{item.title}</h3>

                <p className="mt-4 text-sm leading-7 text-white/65">
                  {item.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Project link */}
      <section className="bg-[#F5F7FA] px-5 py-20 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[1fr_0.5fr] md:items-center">
          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-[#C8A45D]">
              Project Experience
            </p>

            <h2 className="max-w-4xl text-3xl font-semibold leading-tight text-[#0D3B66] md:text-5xl">
              See how our capabilities are reflected across selected project
              references.
            </h2>

            <p className="mt-5 max-w-2xl text-base leading-8 text-[#3A4653]">
              Explore construction, renovation, consultancy, steel fabrication
              and professional project leadership references.
            </p>
          </div>

          <Link
            href="/projects"
            className="inline-flex items-center justify-center gap-3 bg-[#0D3B66] px-8 py-4 text-sm font-bold text-white transition hover:bg-[#A82B05]"
          >
            Explore Projects
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </main>
  );
}
