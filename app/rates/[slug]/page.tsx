import Link from "next/link";
import { ArrowLeft, CalendarDays, MapPin } from "lucide-react";
import { notFound } from "next/navigation";

import RateCalculator from "@/components/rates/rate-calculator";
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

  return {
    title: item.shortTitle + " Rate Build-up",
    description:
      "Review the Charismak construction rate build-up for " +
      item.shortTitle +
      " and edit a private copy with your own prices, allowances and O/P.",
  };
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
    item.status === "verified" ? "Verified rate" : item.status === "review" ? "Under review" : "Pilot rate";
  const statusClass =
    item.status === "verified"
      ? "bg-[#EAF7EF] text-[#197447]"
      : item.status === "review"
        ? "bg-[#FFF9E7] text-[#8A6200]"
        : "bg-[#FFF1EA] text-[#8B1E00]";

  return (
    <main className="min-h-screen bg-[#F5F7FA] pt-20">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-14">
        <Link
          href="/rates"
          className="inline-flex items-center gap-2 text-xs font-black text-[#0D3B66] transition hover:text-[#A82B05]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Rate Bank
        </Link>

        <section className="mt-5 rounded-[2rem] bg-white p-5 shadow-[0_18px_55px_rgba(7,30,51,0.08)] md:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#EAF0F6] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#0D3B66]">
              {item.code}
            </span>
            <span className={"rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] " + statusClass}>
              {statusLabel}
            </span>
          </div>

          <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-[#A82B05]">
            {item.section}
          </p>
          <h1 className="mt-2 max-w-5xl text-3xl font-black leading-tight text-[#071E33] md:text-5xl">
            {item.title}
          </h1>

          <p className="mt-5 max-w-4xl text-sm leading-7 text-[#617286] md:text-base">
            {item.specification}
          </p>

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-xs text-[#617286]">
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#A82B05]" />
              {item.city}, {item.country}
            </span>
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-[#A82B05]" />
              Reviewed {new Date(item.lastReviewed).toLocaleDateString("en-NG")}
            </span>
          </div>

          <div className="mt-6 grid gap-4 border-t border-[#E6EBEF] pt-6 lg:grid-cols-2">
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

        <div className="mt-6">
          <RateCalculator item={item} />
        </div>

        <section className="mt-6 rounded-2xl border border-[#DCE4EC] bg-white p-5 text-xs leading-6 text-[#617286]">
          <strong className="text-[#071E33]">Reference-use note:</strong> This rate is an execution-cost reference, not a project quotation. Project specification, procurement source, haul distance, productivity, access, programme, taxes, preliminaries and commercial terms can change the final price. The editable calculator does not modify Charismak&apos;s public reference rate.
        </section>
      </div>
    </main>
  );
}
