import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, ArrowRight, Camera, Clock, HelpCircle, Hammer, ShieldCheck } from "lucide-react";

import CheckText from "@/components/build-guide/check-text";
import JsonLd from "@/components/seo/json-ld";
import { getGuidePage, getGuidePages } from "@/lib/build-guide";
import { breadcrumbJsonLd, createSeoMetadata } from "@/lib/seo";

type Props = { params: Promise<{ stage: string }> };

// Every page comes from content/build-guide; anything else is a 404.
export const dynamicParams = false;
export function generateStaticParams() {
  return getGuidePages().map((page) => ({ stage: page.slug }));
}

export async function generateMetadata({ params }: Props) {
  const page = getGuidePage((await params).stage);
  if (!page) return {};
  return createSeoMetadata({
    title: page.seoTitle,
    description: page.seoDescription,
    path: `/build-guide/${page.slug}`,
    type: "article",
    keywords: ["building in Nigeria from abroad", `${page.title.toLowerCase()} Nigeria`, "diaspora construction guide", "Abuja Lagos construction"],
  });
}

const Section = ({ id, icon: Icon, title, items, ordered = false, tone = "default" }: { id: string; icon: typeof Hammer; title: string; items: string[]; ordered?: boolean; tone?: "default" | "warning" }) => {
  const List = ordered ? "ol" : "ul";
  return (
    <section id={id} className="scroll-mt-28">
      <div className="flex items-center gap-4">
        <div className={`grid h-12 w-12 shrink-0 place-items-center text-white ${tone === "warning" ? "bg-[#6A1400]" : "bg-[#0D3B66]"}`}><Icon className="h-5 w-5" /></div>
        <h2 className="text-2xl font-semibold tracking-[-0.02em] text-[#071E33] md:text-3xl">{title}</h2>
      </div>
      <List className={`mt-6 space-y-3 ${ordered ? "list-decimal" : "list-disc"} pl-6 marker:text-[#C8A45D]`}>
        {items.map((item) => <li key={item} className="pl-1 leading-8 text-[#3A4653]"><CheckText text={item} /></li>)}
      </List>
    </section>
  );
};

export default async function GuideStagePage({ params }: Props) {
  const page = getGuidePage((await params).stage);
  if (!page) notFound();
  const pages = getGuidePages();
  const index = pages.findIndex((item) => item.slug === page.slug);
  const prev = pages[index - 1];
  const next = pages[index + 1];
  const stageNumber = page.kind === "stage" ? pages.filter((item) => item.kind === "stage").findIndex((item) => item.slug === page.slug) + 1 : null;

  return (
    <main className="cx-skin overflow-hidden bg-white pt-20">
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Building Guide", path: "/build-guide" }, { name: page.title, path: `/build-guide/${page.slug}` }])} />
      <section className="relative overflow-hidden bg-[#071E33] px-5 py-20 text-white md:px-8 lg:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_15%,rgba(200,164,93,0.15),transparent_28rem)]" />
        <div className="relative mx-auto max-w-5xl">
          <Link href="/build-guide" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-white/60 hover:text-white"><ArrowLeft className="h-4 w-4" /> Building Guide</Link>
          <p className="mt-8 text-xs font-bold uppercase tracking-[0.32em] text-[#F2B544]">{stageNumber ? `Stage ${stageNumber} of ${pages.filter((item) => item.kind === "stage").length}` : "Building from abroad"}</p>
          <h1 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-[-0.04em] sm:text-5xl lg:text-6xl">{page.title}</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-[#E8C77F]"><CheckText text={page.headline} /></p>
          <p className="mt-4 max-w-3xl leading-8 text-white/72"><CheckText text={page.summary} /></p>
        </div>
      </section>

      <div className="mx-auto grid max-w-5xl gap-12 px-5 py-16 md:px-8 lg:grid-cols-[1fr_15rem]">
        <article className="space-y-14">
          <Section id="what-happens" icon={Hammer} title={page.kind === "stage" ? "What happens" : "How it works"} items={page.whatHappens} />
          <section id="duration" className="scroll-mt-28 border-l-4 border-[#C8A45D] bg-[#F7F8FA] p-6">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-[#C8A45D]"><Clock className="h-4 w-4" /> Typical duration</p>
            <p className="mt-3 text-lg leading-8 text-[#071E33]"><CheckText text={page.duration} /></p>
          </section>
          <Section id="problems" icon={AlertTriangle} tone="warning" title="Common problems & tricks to watch for" items={page.problems} />
          <Section id="questions" icon={HelpCircle} title="Questions to ask your contractor" items={page.questions} ordered />
          <Section id="photos" icon={Camera} title="Photo checkpoints — what to ask for as proof" items={page.photoCheckpoints} />
          <p className="text-sm leading-7 text-[#3A4653]/80">General guidance on common practice in Abuja and Lagos. Every site is different — follow your approved drawings, your engineer and local regulations.</p>
        </article>

        <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
          <nav aria-label="On this page" className="hidden text-sm lg:block">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#C8A45D]">On this page</p>
            <ul className="mt-4 space-y-3 text-[#3A4653]">
              {[["what-happens", page.kind === "stage" ? "What happens" : "How it works"], ["duration", "Typical duration"], ["problems", "Problems to watch for"], ["questions", "Questions to ask"], ["photos", "Photo checkpoints"]].map(([id, label]) => (
                <li key={id}><a href={`#${id}`} className="hover:text-[#0D3B66]">{label}</a></li>
              ))}
            </ul>
          </nav>
          <div className="bg-[#071E33] p-6 text-white">
            <ShieldCheck className="h-6 w-6 text-[#E8C77F]" />
            <p className="mt-4 font-semibold">Need eyes on your site?</p>
            <p className="mt-2 text-sm leading-6 text-white/70">CPNL can quote this stage or supervise it for you, with photo reports before every payment.</p>
            <Link href="/quote" className="mt-5 inline-flex items-center gap-2 bg-[#C8A45D] px-4 py-3 text-sm font-bold text-[#071E33] hover:bg-white">Get CPNL to quote or supervise <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </aside>
      </div>

      <section className="bg-[#071E33] px-5 py-14 text-white md:px-8">
        <div className="mx-auto flex max-w-5xl flex-col justify-between gap-8 lg:flex-row lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#F2B544]">Charismak Project Nigeria Limited</p>
            <h2 className="mt-4 max-w-3xl text-3xl font-semibold tracking-[-0.03em] md:text-4xl">Get CPNL to quote or supervise your build.</h2>
            <p className="mt-3 max-w-2xl text-white/72">Quantity surveying, construction and independent supervision in Abuja — with staged payments and photo proof for clients abroad.</p>
          </div>
          <Link href="/quote" className="inline-flex shrink-0 items-center gap-3 bg-[#C8A45D] px-7 py-4 text-sm font-bold text-[#071E33] transition hover:bg-white">
            Get CPNL to quote or supervise <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      <nav aria-label="Guide pages" className="mx-auto grid max-w-5xl gap-px bg-[#0D3B66]/10 px-0 md:grid-cols-2">
        {prev ? (
          <Link href={`/build-guide/${prev.slug}`} className="group flex items-center gap-4 bg-white p-7 hover:bg-[#F7F8FA]">
            <ArrowLeft className="h-5 w-5 text-[#C8A45D]" />
            <span><span className="block text-xs font-bold uppercase tracking-[0.2em] text-[#C8A45D]">Previous</span><span className="font-semibold text-[#071E33]">{prev.title}</span></span>
          </Link>
        ) : <span className="bg-white" />}
        {next ? (
          <Link href={`/build-guide/${next.slug}`} className="group flex items-center justify-end gap-4 bg-white p-7 text-right hover:bg-[#F7F8FA]">
            <span><span className="block text-xs font-bold uppercase tracking-[0.2em] text-[#C8A45D]">Next</span><span className="font-semibold text-[#071E33]">{next.title}</span></span>
            <ArrowRight className="h-5 w-5 text-[#C8A45D]" />
          </Link>
        ) : null}
      </nav>
    </main>
  );
}
