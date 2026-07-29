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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-[#C8A45D]">
      {children}
    </p>
  );
}

const hseItems = [
  {
    title: "Health & Safety",
    icon: HardHat,
    text:
      "We promote safe construction behaviour, risk awareness, site supervision, and responsible work practices across all active project locations.",
  },
  {
    title: "Quality Assurance",
    icon: ShieldCheck,
    text:
      "We apply workmanship checks, material reviews, finishing inspections, and technical supervision to maintain project quality.",
  },
  {
    title: "Environmental Responsibility",
    icon: ClipboardCheck,
    text:
      "We encourage clean site operations, waste control, responsible material handling, and practical measures that reduce construction impact.",
  },
  {
    title: "Controlled Delivery",
    icon: BadgeCheck,
    text:
      "We manage execution through planning, documentation, cost awareness, supervision, communication, and clear project accountability.",
  },
];

export default function HsePage() {
  return (
    <main className="min-h-screen bg-[#F5F7FA] pt-24 text-[#151B22]">
      <section className="bg-white px-5 py-24 md:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionLabel>HSE & Quality</SectionLabel>

          <h1 className="max-w-5xl text-5xl font-semibold leading-tight tracking-tight text-[#0D3B66] md:text-7xl">
            Building safely, responsibly, and with controlled quality.
          </h1>

          <p className="mt-8 max-w-3xl text-lg leading-8 text-[#3A4653]">
            Charismak Project Nigeria Limited approaches construction delivery
            with attention to health, safety, environmental responsibility,
            workmanship quality, cost control, and transparent project
            supervision.
          </p>
        </div>
      </section>

      <section className="px-5 py-20 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-2">
          {hseItems.map(({ title, text, icon: Icon }) => (
            <article key={title} className="bg-white p-8 shadow-sm">
              <Icon className="h-10 w-10 text-[#8B1E00]" />

              <h2 className="mt-8 text-3xl font-semibold text-[#0D3B66]">
                {title}
              </h2>

              <p className="mt-5 leading-8 text-[#3A4653]">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white px-5 py-24 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <SectionLabel>Quality Philosophy</SectionLabel>

            <h2 className="text-4xl font-semibold leading-tight tracking-tight text-[#0D3B66] md:text-6xl">
              Quality construction depends on planning, people, supervision, and
              consistent site control.
            </h2>
          </div>

          <div>
            <p className="text-lg leading-8 text-[#3A4653]">
              We believe construction quality is achieved when technical
              planning, procurement decisions, workmanship, safety, and site
              supervision are aligned. Every project requires clear coordination,
              proper communication, responsible material handling, and careful
              inspection before handover.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                "Material awareness",
                "Workmanship control",
                "Site supervision",
                "Transparent reporting",
              ].map((item) => (
                <div key={item} className="bg-[#F5F7FA] p-5">
                  <p className="font-semibold text-[#0D3B66]">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-24 md:px-8">
        <div className="mx-auto max-w-7xl bg-[#0D3B66] p-8 text-white md:p-12">
          <SectionLabel>Our Commitment</SectionLabel>

          <h2 className="max-w-4xl text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
            Every project must be planned, supervised, documented, and delivered
            with responsibility.
          </h2>

          <p className="mt-8 max-w-3xl text-lg leading-8 text-white/70">
            We continue to strengthen our project systems around safety,
            quality, cost control, site coordination, communication, and client
            satisfaction.
          </p>

          <Link
            href="/contact"
            className="mt-10 inline-flex items-center gap-3 bg-[#8B1E00] px-7 py-4 font-bold text-white transition hover:bg-[#C8A45D]"
          >
            Discuss a Project <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </main>
  );
}