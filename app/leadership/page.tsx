import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Users } from "lucide-react";

import { people } from "../site-data";

export const metadata = {
  title: "Leadership Team",
  description:
    "Meet the active leadership team and supporting team behind Charismak Project Nigeria Limited.",
};

type Person = (typeof people)[number];

export default function LeadershipPage() {
  const activeTeam = people.filter((person) => person.group === "Active Team");
  const supportingTeam = people.filter(
    (person) => person.group === "Supporting Team"
  );
  const managingDirector = activeTeam.find((person) =>
    person.name.toLowerCase().includes("abiodun christopher akinola")
  );

  return (
    <main className="overflow-hidden bg-white pt-20">
      <section className="relative overflow-hidden bg-[#071E33] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(200,164,93,0.16),transparent_28rem)]" />
        <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.8)_1px,transparent_1px)] [background-size:48px_48px]" />

        <div className="relative mx-auto grid min-h-[640px] max-w-7xl items-center gap-12 px-5 py-20 md:px-8 lg:grid-cols-[0.9fr_0.7fr]">
          <div className="max-w-4xl">
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.32em] text-[#F2B544]">
              The People Behind The Work
            </p>

            <h1 className="max-w-4xl text-5xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
              Leadership grounded in
              <span className="mt-2 block text-[#E8C77F]">practical project delivery.</span>
            </h1>

            <p className="mt-7 max-w-2xl text-base leading-8 text-white/72 md:text-lg">
              Charismak combines hands-on leadership, technical supervision and a
              flexible professional team to keep projects controlled from planning
              through handover.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                href="/projects"
                className="inline-flex items-center gap-3 bg-[#0D3B66] px-7 py-4 text-sm font-bold text-white transition hover:bg-[#C8A45D] hover:text-[#071E33]"
              >
                See Our Work <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-3 border border-white/30 bg-white/5 px-7 py-4 text-sm font-bold text-white backdrop-blur transition hover:bg-white hover:text-[#071E33]"
              >
                Work With Us <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {managingDirector && (
            <div className="relative hidden justify-self-end lg:block">
              <div className="relative h-[500px] w-[390px] overflow-hidden border border-white/10 bg-white/5 shadow-2xl">
                <Image
                  src={managingDirector.image}
                  alt={managingDirector.name}
                  fill
                  priority
                  sizes="390px"
                  className="object-cover object-top"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#071E33] via-transparent to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-7">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#F2B544]">
                    Managing Director
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold text-white">
                    {managingDirector.name}
                  </h2>
                  <Link
                    href="/md-profile"
                    className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-white/80 transition hover:text-[#F2B544]"
                  >
                    View Profile <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="border-b border-[#0D3B66]/10 bg-white px-5 py-12 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 sm:grid-cols-3">
          <TeamStat value={`${activeTeam.length}`} label="Active Team" />
          <TeamStat value={`${supportingTeam.length}`} label="Supporting Professionals" />
          <TeamStat value="Project-led" label="Team Structure" />
        </div>
      </section>

      <section className="bg-[#F7F8FA] px-5 py-20 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.55fr_1.45fr] lg:items-end">
            <div>
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-[#C8A45D]">
                Day-to-Day Leadership
              </p>
              <h2 className="text-3xl font-semibold leading-tight tracking-[-0.03em] text-[#071E33] md:text-5xl">
                Active team.
              </h2>
            </div>
            <p className="max-w-2xl text-base leading-8 text-[#3A4653] lg:justify-self-end">
              The people directly responsible for company operations, project
              coordination, technical decisions and site delivery.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {activeTeam.map((person) => (
              <ActiveTeamCard key={person.name} person={person} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-20 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-end">
            <div>
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-[#C8A45D]">
                Additional Capacity
              </p>
              <h2 className="text-3xl font-semibold leading-tight tracking-[-0.03em] text-[#071E33] md:text-5xl">
                Supporting team.
              </h2>
            </div>
            <p className="max-w-2xl text-base leading-8 text-[#3A4653] lg:justify-self-end">
              A wider network of technical and operational professionals engaged
              as project workload, specialist requirements and site conditions demand.
            </p>
          </div>

          <div className="mt-12 grid gap-px overflow-hidden border border-[#0D3B66]/10 bg-[#0D3B66]/10 sm:grid-cols-2 lg:grid-cols-3">
            {supportingTeam.map((person) => (
              <SupportingTeamCard key={person.name} person={person} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#071E33] px-5 py-16 text-white md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 lg:flex-row lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#F2B544]">
              Built Around The Project
            </p>
            <h2 className="mt-4 max-w-3xl text-3xl font-semibold tracking-[-0.03em] md:text-5xl">
              The right people, organised around the work that needs to be done.
            </h2>
          </div>
          <Link
            href="/quote"
            className="inline-flex shrink-0 items-center gap-3 bg-[#C8A45D] px-7 py-4 text-sm font-bold text-[#071E33] transition hover:bg-white"
          >
            Start a Project <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </main>
  );
}

function TeamStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="border-l border-[#C8A45D] pl-5">
      <p className="text-2xl font-semibold tracking-[-0.03em] text-[#071E33] md:text-3xl">
        {value}
      </p>
      <p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-[#3A4653]/70">
        {label}
      </p>
    </div>
  );
}

function ActiveTeamCard({ person }: { person: Person }) {
  const isManagingDirector = person.name
    .toLowerCase()
    .includes("abiodun christopher akinola");
  const usePlaceholder =
    !person.image || person.image.toLowerCase().includes("placeholder");
  const initials = getInitials(person.name);

  return (
    <article className="group overflow-hidden bg-white shadow-[0_10px_35px_rgba(7,30,51,0.07)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_55px_rgba(7,30,51,0.13)]">
      <div className="relative h-[380px] overflow-hidden bg-[#E9EEF3]">
        {usePlaceholder ? (
          <Placeholder initials={initials} />
        ) : (
          <Image
            src={person.image}
            alt={person.name}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover object-top transition duration-700 group-hover:scale-[1.025]"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#071E33]/78 via-transparent to-transparent" />
        <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4">
          <span className="inline-flex items-center gap-2 border border-white/20 bg-[#071E33]/65 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white backdrop-blur">
            <BriefcaseBusiness className="h-3.5 w-3.5 text-[#F2B544]" />
            {person.category}
          </span>
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-xl font-semibold tracking-[-0.02em] text-[#071E33]">
          {person.name}
        </h3>
        <p className="mt-2 text-sm font-bold text-[#0D3B66]">{person.role}</p>
        <div className="mt-5 h-px w-12 bg-[#C8A45D]" />
        <p className="mt-5 text-sm leading-7 text-[#3A4653]">{person.bio}</p>

        {isManagingDirector && (
          <Link
            href="/md-profile"
            className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#0D3B66] transition hover:text-[#C8A45D]"
          >
            View MD Profile <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </article>
  );
}

function SupportingTeamCard({ person }: { person: Person }) {
  const usePlaceholder =
    !person.image || person.image.toLowerCase().includes("placeholder");
  const initials = getInitials(person.name);

  return (
    <article className="grid grid-cols-[76px_1fr] gap-5 bg-white p-6 transition hover:bg-[#F7F8FA]">
      <div className="relative h-[76px] w-[76px] overflow-hidden bg-[#E9EEF3]">
        {usePlaceholder ? (
          <Placeholder initials={initials} small />
        ) : (
          <Image
            src={person.image}
            alt={person.name}
            fill
            sizes="76px"
            className="object-cover object-top"
          />
        )}
      </div>
      <div className="min-w-0">
        <p className="font-semibold leading-6 text-[#071E33]">{person.name}</p>
        <p className="mt-1 text-sm font-semibold text-[#0D3B66]">{person.role}</p>
        <p className="mt-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#3A4653]/55">
          <Users className="h-3.5 w-3.5 text-[#C8A45D]" />
          {person.category}
        </p>
      </div>
    </article>
  );
}

function Placeholder({ initials, small = false }: { initials: string; small?: boolean }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#0D3B66] to-[#071E33] text-white">
      <span className={small ? "text-lg font-semibold" : "text-4xl font-semibold"}>
        {initials}
      </span>
    </div>
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}
