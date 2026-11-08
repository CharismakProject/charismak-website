import Link from "next/link";
import { ArrowLeft, CalendarDays, MapPin } from "lucide-react";
import { notFound } from "next/navigation";

import RateDetailInteractive from "@/components/rates/rate-detail-interactive";
import JsonLd from "@/components/seo/json-ld";
import { breadcrumbJsonLd, createSeoMetadata } from "@/lib/seo";
import {
  RATE_BANK_ITEMS,
  getRateBankItem,
} from "@/lib/rates/defaults";

export function generateStaticParams() {
  return RATE_BANK_ITEMS.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = getRateBankItem(slug);

  if (!item) {
    return { title: "Construction Rate" };
  }

  return createSeoMetadata({
    title: item.shortTitle + " Construction Rate Nigeria",
    description:
      "See the full " +
      item.shortTitle +
      " rate build-up for " +
      item.city +
      ", including material quantities, labour, plant, logistics, fluctuation and risk. Edit a private copy with your own prices.",
    path: "/rates/" + item.slug,
    keywords: [
      item.shortTitle + " rate Nigeria",
      item.shortTitle + " rate analysis",
      "construction rates Nigeria",
    ],
  });
}

export default async function RateDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = getRateBankItem(slug);

  if (!item) notFound();

  const statusLabel =
    item.status === "verified" ? "Verified rate" : "Under validation";
  const statusClass =
    item.status === "verified"
      ? "bg-[#EAF7EF] text-[#197447]"
      : item.status === "review"
        ? "bg-[#FFF9E7] text-[#8A6200]"
        : "bg-[#FFF1EA] text-[#8B1E00]";

  return (
    <main className="min-h-screen bg-[#04121F] pt-20">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Construction Rate Bank", path: "/rates" },
          { name: item.shortTitle, path: "/rates/" + item.slug },
        ])}
      />
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-14">
        <Link
          href="/rates"
          className="inline-flex items-center gap-2 text-xs font-black text-white/70 transition hover:text-[#F2B544]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Rate Bank
        </Link>

        <section className="mt-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white/80">
              {item.code}
            </span>
            <span className={"rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] " + statusClass}>
              {statusLabel}
            </span>
          </div>

          <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-[#F2B544]">
            {item.section}
          </p>
          <h1 className="mt-2 max-w-5xl text-3xl font-black leading-tight text-white md:text-5xl">
            {item.title}
          </h1>

          <p className="mt-4 max-w-4xl text-sm leading-7 text-white/65 md:text-base">
            {item.specification}
          </p>

          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3 text-xs text-white/55">
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#F2B544]" />
              {item.city}, {item.country}
            </span>
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-[#F2B544]" />
              Reviewed {new Date(item.lastReviewed).toLocaleDateString("en-NG")}
            </span>
          </div>

        </section>

        <div className="mt-6">
          <RateDetailInteractive item={item} />
        </div>

        <section className="mt-6 rounded-2xl bg-white p-5 md:p-6">
          <h2 className="text-sm font-black text-[#071E33]">Basis, sources &amp; validation</h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl bg-[#F6F8FA] p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#617286]">
                Methodology
              </p>
              <p className="mt-2 text-xs leading-6 text-[#425466]">{item.methodologyNote}</p>
            </div>
            <div className="rounded-2xl bg-[#F6F8FA] p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#617286]">
                Source basis
              </p>
              <p className="mt-2 text-xs leading-6 text-[#425466]">{item.sourceNote}</p>
            </div>
          </div>
        </section>

        {item.status !== "verified" && item.validationNote ? (
          <section className="mt-4 rounded-2xl border border-[#E7C75D] bg-[#FFF9E7] p-5 text-sm leading-6 text-[#6B5310]">
            <strong className="block text-[#5D4600]">Under validation</strong>
            <span className="mt-1 block">{item.validationNote}</span>
          </section>
        ) : null}



        <section className="mt-6 rounded-2xl border border-[#DCE4EC] bg-white p-5 text-xs leading-6 text-[#617286]">
          <strong className="text-[#071E33]">Reference-use note:</strong> This rate is an execution-cost reference, not a project quotation. Project specification, procurement source, haul distance, productivity, access, programme, taxes, preliminaries and commercial terms can change the final price. The editable calculator does not modify Charismak&apos;s public reference rate.
        </section>
      </div>
    </main>
  );
}
