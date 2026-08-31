import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  ClipboardCheck,
  DraftingCompass,
  Factory,
  Hammer,
  HardHat,
  Home,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { loadPublishedServices } from "@/lib/content/website-cms";

export const metadata = {
  title: "Our Services",
  description:
    "Building construction, civil engineering, renovation, steel fabrication, project management, and architectural finishing services in Abuja, Nigeria.",
};

const deliveryProcess = [
  {
    title: "Understand the project",
    text: "We review the brief, site conditions, priorities, budget and what the client needs the finished work to achieve.",
    icon: ClipboardCheck,
  },
  {
    title: "Plan the work",
    text: "We define the scope, responsibilities, sequence, procurement needs and programme before execution.",
    icon: Building2,
  },
  {
    title: "Build and supervise",
    text: "The work is coordinated on site with regular checks on materials, workmanship, safety and progress.",
    icon: HardHat,
  },
  {
    title: "Inspect and hand over",
    text: "Completed work is checked, outstanding items are closed and the project is prepared for handover.",
    icon: ShieldCheck,
  },
];

const iconMap = {
  building: Building2,
  hardhat: HardHat,
  hammer: Hammer,
  clipboard: ClipboardCheck,
  factory: Factory,
  wrench: Wrench,
  drafting: DraftingCompass,
  home: Home,
};

export default async function ServicesPage() {
  const services = await loadPublishedServices();

  return (
    <main className="overflow-hidden bg-white pt-20">
      <section className="relative overflow-hidden bg-[#071E33] px-5 py-24 text-white md:px-8 lg:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_20%,rgba(200,164,93,0.15),transparent_30rem)]" />
        <div className="relative mx-auto max-w-7xl">
          <p className="mb-5 text-xs font-bold uppercase tracking-[0.32em] text-[#F2B544]">What We Do</p>
          <h1 className="max-w-5xl text-5xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
            Construction services built around
            <span className="mt-2 block text-[#E8C77F]">the needs of the project.</span>
          </h1>
          <p className="mt-7 max-w-3xl text-base leading-8 text-white/72 md:text-lg">
            New construction, renovation, project management, fabrication and technical support — handled as part of one coordinated project team where required.
          </p>
          <div className="mt-9 flex flex-wrap gap-4">
            <Link
              href="/quote"
              className="inline-flex items-center gap-3 bg-[#0D3B66] px-7 py-4 text-sm font-bold text-white transition hover:bg-[#C8A45D] hover:text-[#071E33]"
            >
              Discuss a Project <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/projects"
              className="inline-flex items-center gap-3 border border-white/30 bg-white/5 px-7 py-4 text-sm font-bold text-white transition hover:bg-white hover:text-[#071E33]"
            >
              View Our Work <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-[#0D3B66]/10 bg-white px-5 py-12 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [`${services.length}`, "Core Service Areas"],
            ["Planning", "Before Site Work"],
            ["Supervision", "During Construction"],
            ["Handover", "Project Close-out"],
          ].map(([value, label]) => (
            <div key={label} className="border-l border-[#C8A45D] pl-5">
              <p className="text-2xl font-semibold tracking-[-0.03em] text-[#071E33] md:text-3xl">{value}</p>
              <p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-[#3A4653]/65">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#F7F8FA] px-5 py-20 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.58fr_1.42fr] lg:items-end">
            <div>
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-[#C8A45D]">Our Services</p>
              <h2 className="text-3xl font-semibold leading-tight tracking-[-0.03em] text-[#071E33] md:text-5xl">
                Support for different stages of a construction project.
              </h2>
            </div>
            <p className="max-w-2xl text-base leading-8 text-[#3A4653] lg:justify-self-end">
              Services can be provided individually or combined where a project needs one team to coordinate more of the work.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {services.map((service, index) => {
              const Icon = iconMap[service.iconKey as keyof typeof iconMap] || Building2;
              return (
                <article
                  key={service.id}
                  className="group flex min-h-[340px] flex-col bg-white p-7 shadow-[0_10px_35px_rgba(7,30,51,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(7,30,51,0.12)]"
                >
                  <div className="flex items-center justify-between">
                    <div className="grid h-13 w-13 place-items-center rounded-full bg-[#F7F8FA] text-[#0D3B66]">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="text-xs font-bold tracking-[0.2em] text-[#C8A45D]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="mt-7 text-xl font-semibold leading-tight text-[#071E33]">{service.title}</h3>
                  <div className="mt-4 h-px w-12 bg-[#C8A45D]" />
                  <p className="mt-5 flex-1 text-sm leading-7 text-[#3A4653]">{service.description}</p>
                  <Link
                    href="/quote"
                    className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[#0D3B66] transition group-hover:text-[#C8A45D]"
                  >
                    Discuss This Service <ArrowRight className="h-4 w-4" />
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
          <div className="bg-[#071E33] p-8 text-white md:p-12">
            <HardHat className="h-8 w-8 text-[#F2B544]" />
            <p className="mt-8 text-xs font-bold uppercase tracking-[0.28em] text-[#F2B544]">Before Site Work</p>
            <h2 className="mt-5 text-3xl font-semibold leading-tight tracking-[-0.03em] md:text-5xl">
              Good construction starts with a clear scope and a workable plan.
            </h2>
            <p className="mt-6 text-base leading-8 text-white/68">
              Early decisions about scope, drawings, procurement and sequence reduce avoidable changes once work is underway.
            </p>
          </div>

          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-[#C8A45D]">How We Work</p>
            <h2 className="text-3xl font-semibold leading-tight tracking-[-0.03em] text-[#071E33] md:text-5xl">
              A straightforward route from brief to handover.
            </h2>
            <div className="mt-9 grid gap-5 sm:grid-cols-2">
              {deliveryProcess.map((item, index) => {
                const Icon = item.icon;
                return (
                  <article key={item.title} className="border-t border-[#0D3B66]/15 pt-6">
                    <div className="flex items-center justify-between">
                      <Icon className="h-5 w-5 text-[#0D3B66]" />
                      <span className="text-xs font-bold tracking-[0.2em] text-[#C8A45D]">0{index + 1}</span>
                    </div>
                    <h3 className="mt-5 text-lg font-semibold text-[#071E33]">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-[#3A4653]">{item.text}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#071E33] px-5 py-16 text-white md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 lg:flex-row lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#F2B544]">Have A Project In Mind?</p>
            <h2 className="mt-4 max-w-4xl text-3xl font-semibold tracking-[-0.03em] md:text-5xl">
              Tell us what you are planning and where the project stands.
            </h2>
          </div>
          <Link
            href="/quote"
            className="inline-flex shrink-0 items-center gap-3 bg-[#C8A45D] px-7 py-4 text-sm font-bold text-[#071E33] transition hover:bg-white"
          >
            Request a Quote <BadgeCheck className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </main>
  );
}
