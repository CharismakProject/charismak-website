import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  ClipboardCheck,
  HardHat,
  ShieldCheck,
} from "lucide-react";

export const metadata = {
  title: "HSE & Quality",
  description:
    "Charismak Project Nigeria Limited's approach to health, safety, environmental responsibility, and quality assurance on construction sites.",
};

const hseItems = [
  {
    title: "Health & Safety",
    icon: HardHat,
    text: "We promote safe construction behaviour, risk awareness, supervision and responsible work practices across active project locations.",
  },
  {
    title: "Quality Assurance",
    icon: ShieldCheck,
    text: "Workmanship checks, material reviews, finishing inspections and technical supervision support consistent project quality.",
  },
  {
    title: "Environmental Responsibility",
    icon: ClipboardCheck,
    text: "Clean site operations, waste control and responsible material handling form part of our approach to project delivery.",
  },
  {
    title: "Controlled Delivery",
    icon: BadgeCheck,
    text: "Planning, documentation, cost awareness, supervision and communication keep responsibilities visible and work controlled.",
  },
];

export default function HsePage() {
  return (
    <main className="overflow-hidden bg-white pt-20">
      <section className="relative overflow-hidden bg-[#071E33] px-5 py-24 text-white md:px-8 lg:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_15%,rgba(200,164,93,0.15),transparent_28rem)]" />
        <div className="relative mx-auto max-w-7xl">
          <p className="mb-5 text-xs font-bold uppercase tracking-[0.32em] text-[#F2B544]">HSE & Quality</p>
          <h1 className="max-w-5xl text-5xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
            Build safely.
            <span className="mt-2 block text-[#E8C77F]">Deliver responsibly.</span>
          </h1>
          <p className="mt-7 max-w-3xl text-base leading-8 text-white/72 md:text-lg">
            Safety, workmanship, environmental responsibility and disciplined site control are treated as part of delivery—not as separate paperwork.
          </p>
        </div>
      </section>

      <section className="bg-[#F7F8FA] px-5 py-20 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.55fr_1.45fr] lg:items-end">
            <div>
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-[#C8A45D]">Our Standards</p>
              <h2 className="text-3xl font-semibold leading-tight tracking-[-0.03em] text-[#071E33] md:text-5xl">
                Four principles behind better site delivery.
              </h2>
            </div>
            <p className="max-w-2xl text-base leading-8 text-[#3A4653] lg:justify-self-end">
              We connect safety, quality, environment and project control because each one affects the final outcome.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {hseItems.map(({ title, text, icon: Icon }, index) => (
              <article key={title} className="group bg-white p-8 shadow-[0_10px_35px_rgba(7,30,51,0.06)] transition hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(7,30,51,0.11)]">
                <div className="flex items-center justify-between">
                  <div className="grid h-14 w-14 place-items-center bg-[#0D3B66] text-white">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-bold tracking-[0.2em] text-[#C8A45D]">0{index + 1}</span>
                </div>
                <h2 className="mt-8 text-2xl font-semibold tracking-[-0.02em] text-[#071E33]">{title}</h2>
                <div className="mt-4 h-px w-12 bg-[#C8A45D]" />
                <p className="mt-5 leading-8 text-[#3A4653]">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-[#C8A45D]">Quality Philosophy</p>
            <h2 className="text-3xl font-semibold leading-tight tracking-[-0.03em] text-[#071E33] md:text-5xl">
              Quality is the result of many controlled decisions.
            </h2>
          </div>
          <div>
            <p className="text-lg leading-8 text-[#3A4653]">
              Construction quality depends on technical planning, procurement decisions, workmanship, safety, site supervision and proper inspection working together. We focus on keeping those parts aligned throughout delivery.
            </p>
            <div className="mt-8 grid gap-px overflow-hidden border border-[#0D3B66]/10 bg-[#0D3B66]/10 sm:grid-cols-2">
              {["Material awareness", "Workmanship control", "Site supervision", "Transparent reporting"].map((item) => (
                <div key={item} className="bg-[#F7F8FA] p-6">
                  <p className="font-semibold text-[#071E33]">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#071E33] px-5 py-16 text-white md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 lg:flex-row lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#F2B544]">Our Commitment</p>
            <h2 className="mt-4 max-w-4xl text-3xl font-semibold tracking-[-0.03em] md:text-5xl">
              Plan carefully. Supervise properly. Hand over responsibly.
            </h2>
          </div>
          <Link href="/quote" className="inline-flex shrink-0 items-center gap-3 bg-[#C8A45D] px-7 py-4 text-sm font-bold text-[#071E33] transition hover:bg-white">
            Discuss a Project <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </main>
  );
}
