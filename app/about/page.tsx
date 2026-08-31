import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Building2, ShieldCheck, Target } from "lucide-react";

import { company } from "../site-data";
import {
  loadPublishedProjects,
  loadPublishedServices,
  loadWebsiteContent,
} from "@/lib/content/website-cms";

export const metadata = {
  title: "About Us",
  description:
    "Charismak Project Nigeria Limited is an Abuja-based construction company delivering building construction, renovation, project management, engineering and specialist works.",
};

export const revalidate = 300;

const textValue = (value: unknown, fallback: string) => {
  if (typeof value === "string") return value || fallback;
  if (value && typeof value === "object" && "text" in value) {
    const text = String((value as { text?: unknown }).text ?? "").trim();
    return text || fallback;
  }
  return fallback;
};

const principles = [
  {
    title: "Clear responsibilities",
    text: "Everyone involved should know what is required, who is responsible and what comes next.",
    icon: Target,
  },
  {
    title: "Quality on site",
    text: "Materials, workmanship and completed activities are checked throughout construction, not only at handover.",
    icon: ShieldCheck,
  },
  {
    title: "Straightforward communication",
    text: "Clients receive useful updates, clear options and practical recommendations as the work progresses.",
    icon: BadgeCheck,
  },
];

export default async function AboutPage() {
  const [projects, records, managedServices] = await Promise.all([
    loadPublishedProjects(),
    loadWebsiteContent("company"),
    loadPublishedServices(),
  ]);

  const byKey = new Map(records.map((record) => [record.contentKey, record.value]));
  const about = textValue(byKey.get("company.about"), company.about);
  const overview = textValue(byKey.get("company.overview"), company.overview);
  const projectCount = projects.length;
  const serviceCount = managedServices.length;
  const heroImage =
    projects.find((project) => project.heroImages?.length)?.heroImages?.[0] ||
    projects[0]?.cover ||
    "/Images/Projects/Djibouti/cover.jpg";
  const secondaryImage =
    projects.find((project) => project.cover && project.cover !== heroImage)?.cover ||
    "/Images/Projects/Flawless/cover.jpg";

  return (
    <main className="overflow-hidden bg-white pt-20">
      <section className="relative min-h-[660px] overflow-hidden bg-[#071E33] text-white">
        <Image
          src={heroImage}
          alt="Charismak construction project experience"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#071E33]/97 via-[#071E33]/80 to-[#071E33]/28" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#071E33]/65 via-transparent to-transparent" />
        <div className="relative mx-auto flex min-h-[660px] max-w-7xl items-center px-5 py-20 md:px-8">
          <div className="max-w-4xl">
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.32em] text-[#F2B544]">About Charismak</p>
            <h1 className="max-w-5xl text-5xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
              Construction experience.
              <span className="mt-2 block text-[#E8C77F]">Practical project delivery.</span>
            </h1>
            <p className="mt-7 max-w-3xl text-base leading-8 text-white/74 md:text-lg">{about}</p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                href="/projects"
                className="inline-flex items-center gap-3 bg-[#0D3B66] px-7 py-4 text-sm font-bold text-white transition hover:bg-[#C8A45D] hover:text-[#071E33]"
              >
                Explore Our Projects <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href={company.profilePdf}
                target="_blank"
                className="inline-flex items-center gap-3 border border-white/30 bg-white/5 px-7 py-4 text-sm font-bold text-white backdrop-blur transition hover:bg-white hover:text-[#071E33]"
              >
                Company Profile <Building2 className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#0D3B66]/10 bg-white px-5 py-12 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [company.rcNumber.replace("RC No: ", ""), "Registration Number"],
            [`${projectCount}+`, "Selected Project References"],
            [`${serviceCount}`, "Core Service Areas"],
            ["Nigeria & East Africa", "Project Experience"],
          ].map(([value, label]) => (
            <div key={label} className="border-l border-[#C8A45D] pl-5">
              <p className="text-2xl font-semibold tracking-[-0.03em] text-[#071E33] md:text-3xl">{value}</p>
              <p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-[#3A4653]/65">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-5 py-20 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[0.86fr_1.14fr] lg:items-center">
          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-[#C8A45D]">Who We Are</p>
            <h2 className="text-3xl font-semibold leading-tight tracking-[-0.03em] text-[#071E33] md:text-5xl">
              A construction company with cost and project management experience behind the work.
            </h2>
            <p className="mt-6 text-base leading-8 text-[#3A4653]">{overview}</p>
            <p className="mt-5 text-base leading-8 text-[#3A4653]">
              We combine construction management, quantity surveying, site supervision, procurement coordination and quality control so the project is looked at as a whole rather than as separate tasks.
            </p>
            <div className="mt-9 grid gap-px overflow-hidden border border-[#0D3B66]/10 bg-[#0D3B66]/10 sm:grid-cols-2">
              {company.values.map((value) => (
                <div key={value} className="flex items-center gap-3 bg-[#F7F8FA] p-5 font-semibold text-[#071E33]">
                  <BadgeCheck className="h-5 w-5 shrink-0 text-[#C8A45D]" />
                  {value}
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="relative min-h-[540px] overflow-hidden sm:row-span-2">
              <Image
                src={heroImage}
                alt="Construction project experience"
                fill
                sizes="(max-width: 1024px) 100vw, 34vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#071E33]/75 via-transparent to-transparent" />
              <div className="absolute bottom-0 p-7 text-white">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F2B544]">Project Experience</p>
                <h3 className="mt-3 max-w-sm text-2xl font-semibold leading-tight">
                  Experience built through construction, cost management and project delivery assignments.
                </h3>
              </div>
            </div>
            <div className="relative min-h-[260px] overflow-hidden">
              <Image
                src={secondaryImage}
                alt="Renovation and construction works"
                fill
                sizes="(max-width: 640px) 100vw, 25vw"
                className="object-cover"
              />
            </div>
            <div className="flex min-h-[260px] flex-col justify-between bg-[#0D3B66] p-7 text-white">
              <Building2 className="h-8 w-8 text-[#F2B544]" />
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F2B544]">Our Capability</p>
                <p className="mt-4 text-xl font-semibold leading-8">
                  Construction, renovation, engineering, consultancy, project management and specialist works.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#F7F8FA] px-5 py-20 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.58fr_1.42fr] lg:items-end">
            <div>
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-[#C8A45D]">How We Work</p>
              <h2 className="text-3xl font-semibold leading-tight tracking-[-0.03em] text-[#071E33] md:text-5xl">
                Clear responsibilities. Good supervision. Straightforward communication.
              </h2>
            </div>
            <p className="max-w-2xl text-base leading-8 text-[#3A4653] lg:justify-self-end">
              We organise the work around the agreed scope, practical site decisions and regular communication from mobilisation to handover.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {principles.map((principle, index) => {
              const Icon = principle.icon;
              return (
                <article key={principle.title} className="bg-white p-7 shadow-[0_10px_35px_rgba(7,30,51,0.06)]">
                  <div className="flex items-center justify-between">
                    <div className="grid h-12 w-12 place-items-center rounded-full bg-[#F7F8FA] text-[#0D3B66]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-bold tracking-[0.2em] text-[#C8A45D]">0{index + 1}</span>
                  </div>
                  <h3 className="mt-7 text-xl font-semibold text-[#071E33]">{principle.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-[#3A4653]">{principle.text}</p>
                </article>
              );
            })}
          </div>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/services"
              className="inline-flex items-center gap-3 bg-[#0D3B66] px-7 py-4 text-sm font-bold text-white transition hover:bg-[#C8A45D] hover:text-[#071E33]"
            >
              Explore Our Services <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/leadership"
              className="inline-flex items-center gap-3 border border-[#0D3B66]/20 bg-white px-7 py-4 text-sm font-bold text-[#071E33] transition hover:border-[#C8A45D] hover:text-[#0D3B66]"
            >
              Meet Our Team <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
