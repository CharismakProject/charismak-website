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
    title: "Understand",
    text: "We clarify the brief, priorities, constraints, site conditions and the result the client wants to achieve.",
    icon: SearchCheck,
  },
  {
    title: "Plan",
    text: "Scope, sequence, responsibilities, procurement needs and reporting expectations are defined before execution.",
    icon: ClipboardCheck,
  },
  {
    title: "Deliver",
    text: "Construction is coordinated through practical supervision, quality checks and disciplined project control.",
    icon: HardHat,
  },
  {
    title: "Handover",
    text: "Completed work is reviewed, documented and prepared for an organised, professional handover.",
    icon: ShieldCheck,
  },
];

export default function VisionPage() {
  return (
    <main className="overflow-hidden bg-white pt-20">
      <section className="relative overflow-hidden bg-[#071E33] px-5 py-24 text-white md:px-8 lg:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_20%,rgba(200,164,93,0.15),transparent_28rem)]" />
        <div className="relative mx-auto max-w-7xl">
          <p className="mb-5 text-xs font-bold uppercase tracking-[0.32em] text-[#F2B544]">
            What Guides Us
          </p>
          <h1 className="max-w-5xl text-5xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
            Building a company known for
            <span className="mt-2 block text-[#E8C77F]">trust, control and lasting value.</span>
          </h1>
          <p className="mt-7 max-w-3xl text-base leading-8 text-white/72 md:text-lg">
            Our vision, mission and values shape how we work with clients, manage
            projects and make decisions on site.
          </p>
        </div>
      </section>

      <section className="px-5 py-20 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-px overflow-hidden border border-[#0D3B66]/10 bg-[#0D3B66]/10 lg:grid-cols-2">
          <article className="bg-white p-8 md:p-12">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#C8A45D]">Our Vision</p>
            <h2 className="mt-5 text-3xl font-semibold leading-tight tracking-[-0.03em] text-[#071E33] md:text-5xl">
              The standard we are building towards.
            </h2>
            <p className="mt-7 text-base leading-8 text-[#3A4653] md:text-lg">{company.vision}</p>
          </article>
          <article className="bg-[#0D3B66] p-8 text-white md:p-12">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#F2B544]">Our Mission</p>
            <h2 className="mt-5 text-3xl font-semibold leading-tight tracking-[-0.03em] md:text-5xl">
              How we intend to get there.
            </h2>
            <p className="mt-7 text-base leading-8 text-white/72 md:text-lg">{company.mission}</p>
          </article>
        </div>
      </section>

      <section className="bg-[#F7F8FA] px-5 py-20 md:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-[#C8A45D]">Core Values</p>
          <div className="grid gap-8 lg:grid-cols-[0.55fr_1.45fr] lg:items-end">
            <h2 className="text-3xl font-semibold leading-tight tracking-[-0.03em] text-[#071E33] md:text-5xl">
              The principles behind the work.
            </h2>
            <p className="max-w-2xl text-base leading-8 text-[#3A4653] lg:justify-self-end">
              These values guide our relationships, technical decisions, communication and responsibility on every project.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {company.values.map((value, index) => (
              <article key={value} className="bg-white p-6 shadow-[0_8px_28px_rgba(7,30,51,0.06)]">
                <div className="flex items-center justify-between">
                  <CheckCircle2 className="h-6 w-6 text-[#0D3B66]" />
                  <span className="text-xs font-bold tracking-[0.18em] text-[#C8A45D]">0{index + 1}</span>
                </div>
                <h3 className="mt-8 text-lg font-semibold text-[#071E33]">{value}</h3>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 md:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-[#C8A45D]">How It Shows Up</p>
          <h2 className="max-w-4xl text-3xl font-semibold leading-tight tracking-[-0.03em] text-[#071E33] md:text-5xl">
            A clear process from first conversation to handover.
          </h2>

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {deliveryProcess.map((item, index) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="border-t border-[#0D3B66]/15 pt-7">
                  <div className="flex items-center justify-between">
                    <div className="grid h-12 w-12 place-items-center rounded-full bg-[#F7F8FA] text-[#0D3B66]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-bold tracking-[0.2em] text-[#C8A45D]">0{index + 1}</span>
                  </div>
                  <h3 className="mt-6 text-xl font-semibold text-[#071E33]">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[#3A4653]">{item.text}</p>
                </article>
              );
            })}
          </div>

          <Link href="/quote" className="mt-12 inline-flex items-center gap-3 bg-[#0D3B66] px-7 py-4 text-sm font-bold text-white transition hover:bg-[#C8A45D] hover:text-[#071E33]">
            Start a Project <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </main>
  );
}
