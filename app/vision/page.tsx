import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  HardHat,
  SearchCheck,
  ShieldCheck,
} from "lucide-react";

import { company } from "../site-data";

export const metadata = {
  title: "Vision & Mission",
  description:
    "The vision, mission, and core values guiding Charismak Project Nigeria Limited's construction delivery across Nigeria.",
};

const deliveryProcess = [
  {
    title: "Project Consultation",
    text:
      "We review the client's objectives, site conditions, design requirements, budget expectations and intended project outcomes.",
    icon: SearchCheck,
  },
  {
    title: "Planning & Coordination",
    text:
      "The project scope, procurement needs, construction sequence, responsibilities and reporting structure are properly defined.",
    icon: ClipboardCheck,
  },
  {
    title: "Controlled Execution",
    text:
      "Site activities are managed through disciplined supervision, workforce coordination, material control and quality inspections.",
    icon: HardHat,
  },
  {
    title: "Review & Handover",
    text:
      "Completed works are inspected, documented, corrected where necessary and prepared for professional project handover.",
    icon: ShieldCheck,
  },
];

export default function VisionPage() {
  return (
    <main className="min-h-screen bg-white pt-20">
      <section className="relative overflow-hidden bg-[#071E33] px-5 py-24 text-white md:px-8">
        <div className="absolute inset-0 bg-gradient-to-r from-[#071E33] via-[#0D3B66] to-[#071E33]" />

        <div className="relative mx-auto max-w-7xl">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-[#C8A45D]">
            Vision & Mission
          </p>

          <h1 className="max-w-5xl text-4xl font-black leading-tight md:text-7xl">
            Building a legacy of trust, technical excellence and disciplined
            delivery.
          </h1>

          <p className="mt-6 max-w-3xl text-base leading-8 text-white/75 md:text-lg">
            Charismak Project Nigeria Limited is guided by clear corporate
            values, practical construction discipline and a commitment to
            delivering projects that reflect quality, accountability and
            professionalism.
          </p>
        </div>
      </section>

      <section className="px-5 py-20 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-7 lg:grid-cols-2">
          <article className="border border-[#0D3B66]/10 bg-[#F7F8FA] p-8 md:p-10">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-[#C8A45D]">
              Vision Statement
            </p>

            <h2 className="text-3xl font-semibold text-[#0D3B66] md:text-5xl">
              Our Vision
            </h2>

            <p className="mt-6 text-base leading-8 text-[#3A4653] md:text-lg">
              {company.vision}
            </p>
          </article>

          <article className="border border-[#0D3B66]/10 bg-[#0D3B66] p-8 text-white md:p-10">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-[#C8A45D]">
              Mission Statement
            </p>

            <h2 className="text-3xl font-semibold md:text-5xl">
              Our Mission
            </h2>

            <p className="mt-6 text-base leading-8 text-white/75 md:text-lg">
              {company.mission}
            </p>
          </article>
        </div>
      </section>

      <section className="bg-[#F7F8FA] px-5 py-20 md:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-[#C8A45D]">
            Core Values
          </p>

          <h2 className="max-w-4xl text-3xl font-semibold leading-tight text-[#0D3B66] md:text-5xl">
            Principles that guide our decisions, relationships and project
            delivery.
          </h2>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {company.values.map((value) => (
              <article
                key={value}
                className="border border-[#0D3B66]/10 bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg"
              >
                <CheckCircle2 className="h-7 w-7 text-[#8B1E00]" />

                <h3 className="mt-6 text-lg font-bold text-[#0D3B66]">
                  {value}
                </h3>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 md:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-[#C8A45D]">
            Delivery Philosophy
          </p>

          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <h2 className="max-w-4xl text-3xl font-semibold leading-tight text-[#0D3B66] md:text-5xl">
              Every stage is planned, supervised and reviewed.
            </h2>

            <p className="max-w-md text-sm leading-7 text-[#3A4653]">
              Our delivery process keeps responsibilities clear, improves
              communication and supports better project control from inception
              to handover.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {deliveryProcess.map((item, index) => {
              const Icon = item.icon;

              return (
                <article
                  key={item.title}
                  className="border border-[#0D3B66]/10 bg-[#F7F8FA] p-7 transition hover:bg-white hover:shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <Icon className="h-7 w-7 text-[#8B1E00]" />

                    <p className="text-3xl font-black text-[#C8A45D]">
                      0{index + 1}
                    </p>
                  </div>

                  <h3 className="mt-7 text-xl font-bold text-[#0D3B66]">
                    {item.title}
                  </h3>

                  <p className="mt-4 text-sm leading-7 text-[#3A4653]">
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