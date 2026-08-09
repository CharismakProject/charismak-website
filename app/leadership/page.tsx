import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness } from "lucide-react";

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

  return (
    <main className="min-h-screen bg-[#F5F7FA] pt-20">
      <section className="relative overflow-hidden bg-[#071E33] px-5 py-24 text-white md:px-8">
        <div className="absolute inset-0 bg-gradient-to-r from-[#071E33] via-[#0D3B66] to-[#071E33]" />

        <div className="relative mx-auto max-w-7xl">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-[#C8A45D]">
            Our Leadership
          </p>

          <h1 className="max-w-5xl text-4xl font-black leading-tight md:text-7xl">
            Experienced. Dedicated. Professional.
          </h1>

          <p className="mt-6 max-w-3xl text-base leading-8 text-white/75 md:text-lg">
            The Charismak team combines active leadership with a wider
            supporting team engaged as project demand requires.
          </p>
        </div>
      </section>

      {/* ACTIVE TEAM */}

      <section className="bg-white px-5 py-20 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-[#C8A45D]">
                Day-to-Day Leadership
              </p>

              <h2 className="text-3xl font-semibold leading-tight text-[#0D3B66] md:text-5xl">
                Active Team
              </h2>
            </div>

            <p className="max-w-2xl text-base leading-8 text-[#3A4653] lg:justify-self-end">
              The individuals who directly lead, coordinate and supervise
              Charismak&apos;s day-to-day operations and active projects.
            </p>
          </div>

          <div className="grid gap-7 md:grid-cols-2 xl:grid-cols-3">
            {activeTeam.map((person) => (
              <ActiveTeamCard key={person.name} person={person} />
            ))}
          </div>
        </div>
      </section>

      {/* SUPPORTING TEAM */}

      <section className="bg-[#F5F7FA] px-5 py-20 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-[#C8A45D]">
                Additional Capacity
              </p>

              <h2 className="text-3xl font-semibold leading-tight text-[#0D3B66] md:text-5xl">
                Supporting Team
              </h2>
            </div>

            <p className="max-w-2xl text-base leading-8 text-[#3A4653] lg:justify-self-end">
              A wider bench of technical and operational professionals who
              support the company during peak periods, when active projects
              are numerous and require more capacity than the active team
              alone can provide.
            </p>
          </div>

          <div className="divide-y divide-[#0D3B66]/10 border border-[#0D3B66]/10 bg-white">
            {supportingTeam.map((person) => (
              <SupportingTeamRow key={person.name} person={person} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function ActiveTeamCard({ person }: { person: Person }) {
  const isManagingDirector = person.name
    .toLowerCase()
    .includes("abiodun christopher akinola");

  const usePlaceholder =
    !person.image || person.image.toLowerCase().includes("placeholder");

  const initials = person.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((name) => name.charAt(0).toUpperCase())
    .join("");

  return (
    <article className="group overflow-hidden border border-[#0D3B66]/10 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_25px_60px_rgba(7,30,51,0.14)]">
      <div className="relative h-[360px] overflow-hidden bg-[#E9EEF3]">
        {usePlaceholder ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#0D3B66] to-[#071E33] text-white">
            <div className="grid h-24 w-24 place-items-center rounded-full border border-white/25 bg-white/10 text-3xl font-black">
              {initials}
            </div>

            <p className="mt-5 text-xs font-bold uppercase tracking-[0.24em] text-[#C8A45D]">
              Profile Image
            </p>
          </div>
        ) : (
          <Image
            src={person.image}
            alt={person.name}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover object-top transition duration-700 group-hover:scale-[1.03]"
          />
        )}

        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#071E33]/80 to-transparent" />

        <div className="absolute bottom-5 left-5">
          <span className="inline-flex items-center gap-2 bg-[#A82B05] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white">
            <BriefcaseBusiness className="h-3.5 w-3.5" />
            {person.category}
          </span>
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-xl font-bold text-[#0D3B66]">{person.name}</h3>

        <p className="mt-2 text-sm font-bold leading-6 text-[#A82B05]">
          {person.role}
        </p>

        <p className="mt-4 text-sm leading-7 text-[#3A4653]">{person.bio}</p>

        {isManagingDirector && (
          <Link
            href="/md-profile"
            className="mt-6 inline-flex items-center gap-2 bg-[#0D3B66] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#A82B05]"
          >
            View MD Profile
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </article>
  );
}

function SupportingTeamRow({ person }: { person: Person }) {
  const usePlaceholder =
    !person.image || person.image.toLowerCase().includes("placeholder");

  const initials = person.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((name) => name.charAt(0).toUpperCase())
    .join("");

  return (
    <div className="flex items-center gap-5 px-6 py-5">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-[#E9EEF3]">
        {usePlaceholder ? (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#0D3B66] to-[#071E33] text-sm font-black text-white">
            {initials}
          </div>
        ) : (
          <Image
            src={person.image}
            alt={person.name}
            fill
            sizes="64px"
            className="object-cover object-top"
          />
        )}
      </div>

      <div className="min-w-0">
        <p className="truncate font-bold text-[#0D3B66]">{person.name}</p>
        <p className="text-sm font-semibold text-[#A82B05]">{person.role}</p>
      </div>

      <span className="ml-auto hidden shrink-0 text-xs font-bold uppercase tracking-[0.14em] text-[#3A4653]/60 sm:block">
        {person.category}
      </span>
    </div>
  );
}
