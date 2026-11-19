import Link from "next/link";
import { ArrowRight, Camera, ClipboardList, Globe2, HelpCircle, ShieldCheck } from "lucide-react";

import JsonLd from "@/components/seo/json-ld";
import { getGuidePages } from "@/lib/build-guide";
import { breadcrumbJsonLd, createSeoMetadata } from "@/lib/seo";

export const metadata = createSeoMetadata({
  title: "Building Guide: build or renovate in Nigeria from abroad",
  description:
    "A plain-English guide for Nigerians in the diaspora building or renovating a house back home: every construction stage, the tricks to watch for, the questions to ask your contractor and the photos to request as proof.",
  path: "/build-guide",
  keywords: ["build a house in Nigeria from abroad", "diaspora building Nigeria", "construction stages Nigeria", "how to supervise building project from abroad", "Abuja house construction guide"],
});

const promises = [
  { icon: ClipboardList, title: "Understand each stage", text: "What happens, in what order and how long it usually takes — in plain English." },
  { icon: HelpCircle, title: "Ask the right questions", text: "Questions that show your contractor you know what good work looks like." },
  { icon: Camera, title: "Demand the right proof", text: "Exactly which photos and videos to ask for before work is covered up or money is sent." },
];

export default function BuildGuidePage() {
  const pages = getGuidePages();
  const stages = pages.filter((page) => page.kind === "stage");
  const guides = pages.filter((page) => page.kind === "guide");

  return (
    <main className="cx-skin overflow-hidden bg-white pt-20">
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Building Guide", path: "/build-guide" }])} />
      <section className="relative overflow-hidden bg-[#071E33] px-5 py-24 text-white md:px-8 lg:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_15%,rgba(200,164,93,0.15),transparent_28rem)]" />
        <div className="relative mx-auto max-w-7xl">
          <p className="mb-5 text-xs font-bold uppercase tracking-[0.32em] text-[#F2B544]">Building Guide · for Nigerians abroad</p>
          <h1 className="max-w-5xl text-5xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
            Building at home,
            <span className="mt-2 block text-[#E8C77F]">from far away.</span>
          </h1>
          <p className="mt-7 max-w-3xl text-base leading-8 text-white/72 md:text-lg">
            If you are building or renovating a house in Nigeria while living abroad, this guide explains each stage of construction in plain English — so you can understand what your contractor is doing, question it, and check it before you send the next payment.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link href={`/build-guide/${stages[0]?.slug ?? ""}`} className="inline-flex items-center gap-3 bg-[#C8A45D] px-7 py-4 text-sm font-bold text-[#071E33] transition hover:bg-white">
              Start with stage 1 <ArrowRight className="h-5 w-5" />
            </Link>
            {guides[0] ? (
              <Link href={`/build-guide/${guides[0].slug}`} className="inline-flex items-center gap-3 border border-white/25 px-7 py-4 text-sm font-bold text-white transition hover:border-white">
                <Globe2 className="h-5 w-5" /> {guides[0].title}
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <section className="bg-[#F7F8FA] px-5 py-20 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.55fr_1.45fr] lg:items-end">
            <div>
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-[#C8A45D]">Who it’s for</p>
              <h2 className="text-3xl font-semibold leading-tight tracking-[-0.03em] text-[#071E33] md:text-5xl">You, your money and your build.</h2>
            </div>
            <p className="max-w-2xl text-base leading-8 text-[#3A4653] lg:justify-self-end">
              For Nigerians in the UK, US, Canada, Europe and elsewhere who are building a family home, a rental property or renovating a parent’s house — usually through a relative, an agent or a contractor they cannot visit every week.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {promises.map(({ icon: Icon, title, text }) => (
              <article key={title} className="bg-white p-8 shadow-[0_10px_35px_rgba(7,30,51,0.06)]">
                <div className="grid h-14 w-14 place-items-center bg-[#0D3B66] text-white"><Icon className="h-6 w-6" /></div>
                <h3 className="mt-8 text-2xl font-semibold tracking-[-0.02em] text-[#071E33]">{title}</h3>
                <div className="mt-4 h-px w-12 bg-[#C8A45D]" />
                <p className="mt-5 leading-8 text-[#3A4653]">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 md:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-[#C8A45D]">The stages</p>
          <h2 className="text-3xl font-semibold leading-tight tracking-[-0.03em] text-[#071E33] md:text-5xl">From land papers to the last coat of paint.</h2>
          <ol className="mt-12 grid gap-px overflow-hidden border border-[#0D3B66]/10 bg-[#0D3B66]/10 md:grid-cols-2">
            {stages.map((stage, index) => (
              <li key={stage.slug} className="bg-white">
                <Link href={`/build-guide/${stage.slug}`} className="group flex h-full gap-6 p-7 transition hover:bg-[#F7F8FA]">
                  <span className="text-sm font-bold tracking-[0.2em] text-[#C8A45D]">{String(index + 1).padStart(2, "0")}</span>
                  <span className="flex-1">
                    <span className="block text-xl font-semibold text-[#071E33] group-hover:text-[#0D3B66]">{stage.title}</span>
                    <span className="mt-2 block text-sm leading-7 text-[#3A4653]">{stage.summary}</span>
                  </span>
                  <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-[#C8A45D] transition group-hover:translate-x-1" />
                </Link>
              </li>
            ))}
          </ol>
          {guides.map((guide) => (
            <Link key={guide.slug} href={`/build-guide/${guide.slug}`} className="group mt-6 flex items-center gap-6 bg-[#0D3B66] p-7 text-white transition hover:bg-[#071E33]">
              <Globe2 className="h-8 w-8 shrink-0 text-[#E8C77F]" />
              <span className="flex-1">
                <span className="block text-xl font-semibold">{guide.title}</span>
                <span className="mt-2 block text-sm leading-7 text-white/72">{guide.summary}</span>
              </span>
              <ArrowRight className="h-5 w-5 shrink-0 text-[#E8C77F] transition group-hover:translate-x-1" />
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-[#071E33] px-5 py-16 text-white md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 lg:flex-row lg:items-center">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.28em] text-[#F2B544]"><ShieldCheck className="h-4 w-4" /> Charismak Project Nigeria Limited</p>
            <h2 className="mt-4 max-w-4xl text-3xl font-semibold tracking-[-0.03em] md:text-5xl">Want someone on site you can trust?</h2>
            <p className="mt-4 max-w-3xl text-white/72">CPNL can quote your build, or act as your independent supervisor and quantity surveyor — checking work and costs before you pay.</p>
          </div>
          <Link href="/quote" className="inline-flex shrink-0 items-center gap-3 bg-[#C8A45D] px-7 py-4 text-sm font-bold text-[#071E33] transition hover:bg-white">
            Get CPNL to quote or supervise <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </main>
  );
}
