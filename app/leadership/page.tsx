import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Users } from "lucide-react";

import { loadPublishedPeople } from "@/lib/content/website-cms";
import type { Person } from "../site-data";

export const metadata = {
  title: "Leadership Team",
  description: "Meet the leadership and project delivery team behind Charismak Project Nigeria Limited.",
};

export const revalidate = 60;

export default async function LeadershipPage() {
  const people = await loadPublishedPeople();
  const activeTeam = people.filter((person) => person.group === "Active Team");
  const supportingTeam = people.filter((person) => person.group === "Supporting Team");
  const managingDirector = activeTeam.find((person) => person.name.toLowerCase().includes("abiodun christopher akinola"));

  return (
    <main className="overflow-hidden bg-white pt-20">
      <section className="relative overflow-hidden bg-[#071E33] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(200,164,93,0.16),transparent_28rem)]" />
        <div className="relative mx-auto grid min-h-[640px] max-w-7xl items-center gap-12 px-5 py-20 md:px-8 lg:grid-cols-[0.9fr_0.7fr]">
          <div className="max-w-4xl">
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.32em] text-[#F2B544]">The People Behind The Work</p>
            <h1 className="max-w-4xl text-5xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-6xl lg:text-7xl">Leadership grounded in<span className="mt-2 block text-[#E8C77F]">practical project delivery.</span></h1>
            <p className="mt-7 max-w-2xl text-base leading-8 text-white/72 md:text-lg">Charismak combines executive leadership, technical supervision and project-specific professional capacity to manage construction from planning through handover.</p>
            <div className="mt-9 flex flex-wrap gap-4"><Link href="/projects" className="inline-flex items-center gap-3 bg-[#0D3B66] px-7 py-4 text-sm font-bold text-white">See Our Work <ArrowRight className="h-5 w-5" /></Link><Link href="/contact" className="inline-flex items-center gap-3 border border-white/30 bg-white/5 px-7 py-4 text-sm font-bold text-white">Work With Us <ArrowRight className="h-5 w-5" /></Link></div>
          </div>
          {managingDirector ? <div className="relative hidden justify-self-end lg:block"><div className="relative h-[500px] w-[390px] overflow-hidden border border-white/10 bg-white/5 shadow-2xl"><TeamImage person={managingDirector} sizes="390px" /><div className="absolute inset-0 bg-gradient-to-t from-[#071E33] via-transparent to-transparent" /><div className="absolute inset-x-0 bottom-0 p-7"><p className="text-xs font-bold uppercase tracking-[0.22em] text-[#F2B544]">Managing Director</p><h2 className="mt-3 text-2xl font-semibold text-white">{managingDirector.name}</h2><Link href="/md-profile" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-white/80">View Profile <ArrowRight className="h-4 w-4" /></Link></div></div></div> : null}
        </div>
      </section>

      <section className="border-b border-[#0D3B66]/10 bg-white px-5 py-12 md:px-8"><div className="mx-auto grid max-w-7xl gap-8 sm:grid-cols-3"><TeamStat value={`${activeTeam.length}`} label="Active Team" /><TeamStat value={`${supportingTeam.length}`} label="Supporting Professionals" /><TeamStat value="Project-led" label="Team Structure" /></div></section>

      <section className="bg-[#F7F8FA] px-5 py-20 md:px-8"><div className="mx-auto max-w-7xl"><div className="grid gap-8 lg:grid-cols-[0.55fr_1.45fr] lg:items-end"><div><p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-[#C8A45D]">Day-to-Day Leadership</p><h2 className="text-3xl font-semibold text-[#071E33] md:text-5xl">Active team.</h2></div><p className="max-w-2xl text-base leading-8 text-[#3A4653] lg:justify-self-end">The people directly responsible for company operations, project coordination, technical decisions and site delivery.</p></div><div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">{activeTeam.map((person) => <ActiveTeamCard key={person.name} person={person} />)}</div></div></section>

      <section className="bg-white px-5 py-20 md:px-8"><div className="mx-auto max-w-7xl"><div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-end"><div><p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-[#C8A45D]">Additional Capacity</p><h2 className="text-3xl font-semibold text-[#071E33] md:text-5xl">Supporting team.</h2></div><p className="max-w-2xl text-base leading-8 text-[#3A4653] lg:justify-self-end">Technical and operational professionals engaged as project workload, specialist requirements and site conditions demand.</p></div><div className="mt-12 grid gap-px overflow-hidden border border-[#0D3B66]/10 bg-[#0D3B66]/10 sm:grid-cols-2 lg:grid-cols-3">{supportingTeam.map((person) => <SupportingTeamCard key={person.name} person={person} />)}</div></div></section>

      <section className="bg-[#071E33] px-5 py-16 text-white md:px-8"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 lg:flex-row lg:items-center"><div><p className="text-xs font-bold uppercase tracking-[0.28em] text-[#F2B544]">Built Around The Project</p><h2 className="mt-4 max-w-3xl text-3xl font-semibold md:text-5xl">The right people, organised around the work that needs to be done.</h2></div><Link href="/quote" className="inline-flex shrink-0 items-center gap-3 bg-[#C8A45D] px-7 py-4 text-sm font-bold text-[#071E33]">Start a Project <ArrowRight className="h-5 w-5" /></Link></div></section>
    </main>
  );
}

function TeamStat({ value, label }: { value: string; label: string }) { return <div className="border-l border-[#C8A45D] pl-5"><p className="text-2xl font-semibold text-[#071E33] md:text-3xl">{value}</p><p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-[#3A4653]/70">{label}</p></div>; }

function TeamImage({ person, sizes }: { person: Person; sizes: string }) {
  if (!person.image) return <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-[#0D3B66] to-[#071E33] text-4xl font-semibold text-white">{getInitials(person.name)}</div>;
  return <Image src={person.image} alt={person.name} fill sizes={sizes} className="object-cover object-top" />;
}

function ActiveTeamCard({ person }: { person: Person }) {
  const isManagingDirector = person.name.toLowerCase().includes("abiodun christopher akinola");
  return <article className="group overflow-hidden bg-white shadow-[0_10px_35px_rgba(7,30,51,0.07)]"><div className="relative h-[380px] overflow-hidden bg-[#E9EEF3]"><TeamImage person={person} sizes="(max-width: 768px) 100vw, 33vw" /><div className="absolute inset-0 bg-gradient-to-t from-[#071E33]/78 via-transparent to-transparent" /><div className="absolute bottom-5 left-5"><span className="inline-flex items-center gap-2 border border-white/20 bg-[#071E33]/65 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white"><BriefcaseBusiness className="h-3.5 w-3.5 text-[#F2B544]" />{person.category}</span></div></div><div className="p-6"><h3 className="text-xl font-semibold text-[#071E33]">{person.name}</h3><p className="mt-2 text-sm font-bold text-[#0D3B66]">{person.role}</p><div className="mt-5 h-px w-12 bg-[#C8A45D]" /><p className="mt-5 text-sm leading-7 text-[#3A4653]">{person.bio}</p>{isManagingDirector ? <Link href="/md-profile" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#0D3B66]">View MD Profile <ArrowRight className="h-4 w-4" /></Link> : null}</div></article>;
}

function SupportingTeamCard({ person }: { person: Person }) { return <article className="grid grid-cols-[76px_1fr] gap-5 bg-white p-6"><div className="relative h-[76px] w-[76px] overflow-hidden bg-[#E9EEF3]"><TeamImage person={person} sizes="76px" /></div><div className="min-w-0"><p className="font-semibold leading-6 text-[#071E33]">{person.name}</p><p className="mt-1 text-sm font-semibold text-[#0D3B66]">{person.role}</p><p className="mt-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#3A4653]/55"><Users className="h-3.5 w-3.5 text-[#C8A45D]" />{person.category}</p></div></article>; }
function getInitials(name: string) { return name.split(" ").filter(Boolean).slice(0,2).map((part)=>part[0]?.toUpperCase()).join(""); }
