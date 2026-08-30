"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  ArrowLeft,
  CalendarDays,
  ExternalLink,
  History,
  ImageIcon,
  Mail,
  MapPin,
  MessageCircle,
  PackageSearch,
  Phone,
  Store,
  Truck,
} from "lucide-react";

import { JIJI_MARKET_SNAPSHOT } from "@/lib/pricing/jiji-market-snapshot";
import type { PriceItem } from "@/lib/pricing/models";
import { loadPriceItems } from "@/lib/pricing/store";
import {
  getSupplierOfferEffectiveValidUntil,
  loadSupplierOfferHistoryForItem,
  summarizeSupplierOfferHistory,
  type SupplierMarketplaceOffer,
} from "@/lib/platform/supplier-offers";

const previewImages: Record<string, string> = {
  "cement-50kg": "https://titaniumbuildingsolutions.com/wp-content/uploads/2024/11/Titanium-BS-10.jpg",
  "sharp-sand": "https://www.nairaland.com/attachments/2868570_sharp6_jpeg50ab46832ede475b4a2bf7c0ab5e7fdf",
  "granite-aggregate": "https://titaniumbuildingsolutions.com/wp-content/uploads/2024/11/Titanium-BS-12.jpg",
  "block-225": "https://www.nairaland.com/attachments/5334494_screenshot201705172116321_jpeg0ec93fe55e4fd00777ff56622a797b8e",
  "reinforcement-steel": "https://s.alicdn.com/@sc04/kf/H07f75f4e5aee4ea18a89c35c67b2f532G/Steel-Rebar-Hpb300-Steel-Rebar-Co-Nigeria-Steel-Rebar-Top-Steel-Rebar-Reinforced-Steel-Rebar-Steel-Rebar-G40-18mm-Steel-Rebar.jpg",
  "formwork-sheet": "https://www.qdplywood.com/wp-pages/commercial-plywood/structural-plywood/images/commercial-construction-formwork-structural-plywood.webp",
  "floor-tile": "https://bulksuppliers.com.ng/products/1658247889.png",
  "ppr-pipe-25": "https://naijamart.com/storage/file_upload/downloads/66349cf2a888eIMG_20240329_085509-scaled.jpg",
  "longspan-roof-sheet": "https://www.nairaland.com/attachments/4045215_img20160207wa008copy_jpeg6f88ee38aab26d36e5d81c117c7470c3",
  "concrete-mixer": "https://www.camelwaygroup.com/dm-content/themes/camelwaygroup/page/images/small-concrete-mixer.webp",
};

const money = (value: number | null, currency = "NGN") =>
  value === null
    ? "—"
    : new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }).format(value);

const dateText = (value: string | null) =>
  value ? new Date(`${value.slice(0, 10)}T12:00:00Z`).toLocaleDateString("en-NG") : "—";

const whatsappHref = (offer: SupplierMarketplaceOffer, productName: string) => {
  const phone = (offer.whatsapp || offer.phone || "").replace(/[^0-9]/g, "");
  if (!phone) return null;
  const message = encodeURIComponent(
    `Hello ${offer.supplierName}, I saw your ${productName} price on Charismak. Please confirm today's price, availability and delivery cost to my location.`,
  );
  return `https://wa.me/${phone}?text=${message}`;
};

const distinctSupplierCount = (offers: SupplierMarketplaceOffer[]) =>
  new Set(offers.map((offer) => offer.supplierId || offer.supplierName.toLowerCase())).size;

export default function MaterialPriceDetail({ itemId }: { itemId: string }) {
  const [item, setItem] = useState<PriceItem | null>(null);
  const [allOffers, setAllOffers] = useState<SupplierMarketplaceOffer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const selected = loadPriceItems().find((candidate) => candidate.id === itemId) ?? null;
    setItem(selected);

    if (!selected) {
      setLoading(false);
      return;
    }

    void loadSupplierOfferHistoryForItem(itemId).then((rows) => {
      setAllOffers(rows);
      setLoading(false);
    });
  }, [itemId]);

  if (!item) {
    return (
      <section className="rounded-3xl border border-dashed border-[#B8C7D6] bg-white p-10 text-center">
        <PackageSearch className="mx-auto h-8 w-8 text-[#7A8B9E]" />
        <h1 className="mt-4 text-2xl font-black text-[#071E33]">Item not found</h1>
        <p className="mt-2 text-sm text-[#617286]">This item may have been renamed or removed from the price catalogue.</p>
        <Link href="/prices" className="mt-5 inline-flex rounded-xl bg-[#0D3B66] px-5 py-3 text-sm font-bold text-white">Back to prices</Link>
      </section>
    );
  }

  const market = JIJI_MARKET_SNAPSHOT[item.id];
  const displayName = market?.marketName || item.description;
  const displayLocation = market?.location || item.location;
  const image = item.imageUrl || previewImages[item.id] || null;
  const unit = market?.unit || item.marketUnit || item.unit;
  const history = summarizeSupplierOfferHistory(allOffers, {
    location: displayLocation,
    quotedUnit: unit,
  });
  const offers = history.live;
  const archivedOffers = history.archived;
  const supplierLocations = Array.from(new Set(offers.map((offer) => offer.location).filter(Boolean)));
  const liveSupplierCount = distinctSupplierCount(offers);
  const supplierRange = history.low === null
    ? null
    : history.high !== null && history.high !== history.low
      ? `${money(history.low, item.currency)} – ${money(history.high, item.currency)}`
      : money(history.low, item.currency);
  const fallbackRange = market
    ? `${money(market.priceLow, item.currency)} – ${money(market.priceHigh, item.currency)}`
    : money(item.rate, item.currency);

  return (
    <div className="space-y-7">
      <Link href="/prices" className="inline-flex items-center gap-2 text-sm font-bold text-[#0D3B66] transition hover:text-[#A82B05]">
        <ArrowLeft className="h-4 w-4" /> Back to prices
      </Link>

      <section className="overflow-hidden rounded-[2rem] border border-[#DCE4EC] bg-white shadow-[0_18px_55px_rgba(7,30,51,0.08)]">
        <div className="grid lg:grid-cols-[0.85fr_1.15fr]">
          <div className="relative min-h-72 bg-[#EEF2F6] lg:min-h-[430px]">
            {image ? (
              <img src={image} alt={item.imageAlt || displayName} className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div className="absolute inset-0 grid place-items-center text-center">
                <div>
                  <ImageIcon className="mx-auto h-10 w-10 text-[#9AA8B6]" />
                  <span className="mt-3 block text-xs font-black uppercase tracking-[0.14em] text-[#7A8B9E]">Product photo coming soon</span>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 md:p-8 lg:p-10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#EAF2FF] px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#0D3B66]">
                {item.category === "plant" ? "Equipment" : item.category}
              </span>
              {offers.length > 0 ? (
                <span className="rounded-full bg-[#EAF7EF] px-3 py-1 text-[10px] font-black text-[#197447]">
                  {offers.length} valid price update{offers.length === 1 ? "" : "s"}
                </span>
              ) : null}
              {archivedOffers.length > 0 ? (
                <span className="rounded-full bg-[#F3F5F7] px-3 py-1 text-[10px] font-black text-[#617286]">
                  {archivedOffers.length} archived
                </span>
              ) : null}
            </div>

            <h1 className="mt-4 text-3xl font-black leading-tight text-[#071E33] md:text-4xl">{displayName}</h1>
            {(market?.specification || item.specification) ? (
              <p className="mt-3 text-sm leading-6 text-[#617286]">{market?.specification || item.specification}</p>
            ) : null}
            <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#526579]">
              <MapPin className="h-4 w-4 text-[#A82B05]" /> {displayLocation}
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-[#071E33] p-5 text-white">
                <span className="text-[10px] font-black uppercase tracking-[0.13em] text-white/55">
                  {supplierRange ? `Current valid price / ${unit}` : `Market guide / ${unit}`}
                </span>
                <strong className="mt-2 block text-2xl">{supplierRange || fallbackRange}</strong>
                <span className="mt-2 block text-xs leading-5 text-white/60">
                  {supplierRange
                    ? offers.length > 1
                      ? `Range from ${offers.length} currently valid price observations.`
                      : `Latest valid supplier price. Valid to ${dateText(getSupplierOfferEffectiveValidUntil(offers[0]))}.`
                    : "No current supplier price is available, so the Charismak market guide is shown."}
                </span>
              </div>

              <div className="rounded-2xl border border-[#DCE4EC] bg-[#F8FAFC] p-5">
                <span className="text-[10px] font-black uppercase tracking-[0.13em] text-[#617286]">Current supplier coverage</span>
                <strong className="mt-2 block text-2xl text-[#071E33]">{liveSupplierCount}</strong>
                <span className="mt-2 block text-xs leading-5 text-[#617286]">
                  {offers.length
                    ? `${offers.length} valid price record${offers.length === 1 ? "" : "s"}${history.latest ? ` · latest ${money(history.latest.unitPrice)} / ${history.latest.quotedUnit}` : ""}`
                    : "No currently valid supplier price listed yet"}
                </span>
              </div>
            </div>

            {supplierRange && market ? (
              <p className="mt-4 rounded-xl bg-[#FFF9ED] px-4 py-3 text-xs leading-5 text-[#74520D]">
                Charismak market benchmark: {money(market.priceLow, item.currency)} – {money(market.priceHigh, item.currency)} / {unit}. The headline above uses currently valid supplier observations.
              </p>
            ) : null}

            <p className="mt-5 text-xs leading-6 text-[#617286]">
              Compare currently valid supplier prices, location, brand and delivery options below. Expired prices are removed from the live range automatically and retained only as history.
            </p>
          </div>
        </div>
      </section>

      <section>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#A82B05]">Available suppliers</p>
            <h2 className="mt-2 text-2xl font-black text-[#071E33]">Compare current prices and delivery options</h2>
          </div>
          {supplierLocations.length ? (
            <p className="text-xs text-[#617286]">Supplier locations: {supplierLocations.join(", ")}</p>
          ) : null}
        </div>

        {loading ? (
          <div className="mt-5 rounded-2xl border border-[#DCE4EC] bg-white p-8 text-center text-sm text-[#617286]">Finding supplier prices…</div>
        ) : offers.length ? (
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {offers.map((offer, index) => {
              const whatsapp = whatsappHref(offer, displayName);
              return (
                <article key={offer.id} className="rounded-2xl border border-[#DCE4EC] bg-white p-5 shadow-[0_8px_26px_rgba(7,30,51,0.045)]">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#EAF2FF] text-[#0D3B66]">
                        <Store className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#A82B05]">{index === 0 ? "Lowest valid price" : "Current supplier"}</p>
                        <h3 className="mt-1 truncate text-lg font-black text-[#071E33]">{offer.supplierName}</h3>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-[#617286]">
                          <MapPin className="h-3.5 w-3.5" /> {offer.location}{offer.serviceArea ? ` · delivers to ${offer.serviceArea}` : ""}
                        </p>
                      </div>
                    </div>
                    <strong className="shrink-0 text-right text-lg text-[#0D3B66]">
                      {money(offer.unitPrice)}
                      <span className="block text-[10px] font-semibold text-[#7A8B9E]">per {offer.quotedUnit}</span>
                    </strong>
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-xl bg-[#F8FAFC] p-3"><dt className="text-[#7A8B9E]">Brand / make</dt><dd className="mt-1 font-bold text-[#071E33]">{offer.brand || "Not specified"}</dd></div>
                    <div className="rounded-xl bg-[#F8FAFC] p-3"><dt className="text-[#7A8B9E]">Specification</dt><dd className="mt-1 font-bold text-[#071E33]">{offer.specification || "As shown"}</dd></div>
                    <div className="rounded-xl bg-[#F8FAFC] p-3"><dt className="text-[#7A8B9E]">Bulk price</dt><dd className="mt-1 font-bold text-[#071E33]">{offer.bulkPrice == null ? "Ask supplier" : money(offer.bulkPrice)}</dd></div>
                    <div className="rounded-xl bg-[#F8FAFC] p-3"><dt className="text-[#7A8B9E]">Minimum order</dt><dd className="mt-1 font-bold text-[#071E33]">{offer.minimumQty == null ? "Ask supplier" : `${offer.minimumQty} ${offer.quotedUnit}`}</dd></div>
                    <div className="rounded-xl bg-[#F8FAFC] p-3"><dt className="text-[#7A8B9E]">Delivery</dt><dd className="mt-1 font-bold text-[#071E33]">{offer.deliveryIncluded ? "Included" : offer.deliveryFee == null ? "Ask supplier" : money(offer.deliveryFee)}</dd></div>
                    <div className="rounded-xl bg-[#F8FAFC] p-3"><dt className="text-[#7A8B9E]">Availability</dt><dd className="mt-1 font-bold text-[#071E33]">{offer.availability || "Confirm stock"}</dd></div>
                  </dl>

                  {offer.supplierRemarks ? <p className="mt-3 text-xs leading-5 text-[#617286]">{offer.supplierRemarks}</p> : null}

                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[10px] text-[#7A8B9E]">
                    {offer.submittedAt ? (
                      <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> Price updated {new Date(offer.submittedAt).toLocaleDateString("en-NG")}</span>
                    ) : null}
                    <span>Valid to {dateText(getSupplierOfferEffectiveValidUntil(offer))}</span>
                  </div>

                  <div className="mt-5 grid gap-2 sm:grid-cols-3">
                    {whatsapp ? (
                      <a href={whatsapp} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#0D3B66] px-3 text-xs font-bold text-white">
                        <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                      </a>
                    ) : null}
                    {offer.phone ? (
                      <a href={`tel:${offer.phone}`} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#CAD5E0] px-3 text-xs font-bold text-[#071E33]">
                        <Phone className="h-3.5 w-3.5" /> Call
                      </a>
                    ) : null}
                    {offer.email ? (
                      <a href={`mailto:${offer.email}?subject=${encodeURIComponent(`Price enquiry for ${displayName}`)}`} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#CAD5E0] px-3 text-xs font-bold text-[#071E33]">
                        <Mail className="h-3.5 w-3.5" /> Get quote
                      </a>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-[#B8C7D6] bg-white p-9 text-center">
            <Truck className="mx-auto h-8 w-8 text-[#7A8B9E]" />
            <h3 className="mt-3 text-lg font-black text-[#071E33]">No current supplier prices listed</h3>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#617286]">
              Existing supplier observations may have expired. Use the market guide above for budgeting and check back as new verified prices are added.
            </p>
          </div>
        )}
      </section>

      {archivedOffers.length ? (
        <details className="group rounded-2xl border border-[#DCE4EC] bg-white">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 md:p-6">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#F3F5F7] text-[#617286]"><Archive className="h-5 w-5" /></span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#617286]">Archived price history</p>
                <p className="mt-1 text-sm text-[#526579]">{archivedOffers.length} expired price record{archivedOffers.length === 1 ? "" : "s"} retained for reference.</p>
              </div>
            </div>
            <History className="h-5 w-5 text-[#0D3B66]" />
          </summary>
          <div className="border-t border-[#E7ECF1] p-5 md:p-6">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-xs">
                <thead><tr className="border-b border-[#DCE4EC] text-[10px] font-black uppercase tracking-[0.1em] text-[#7A8B9E]"><th className="pb-3 pr-4">Supplier</th><th className="pb-3 pr-4">Price</th><th className="pb-3 pr-4">Brand/spec</th><th className="pb-3 pr-4">Recorded</th><th className="pb-3">Expired</th></tr></thead>
                <tbody>
                  {archivedOffers.map((offer) => (
                    <tr key={offer.id} className="border-b border-[#EEF2F5] text-[#526579]">
                      <td className="py-3 pr-4 font-bold text-[#071E33]">{offer.supplierName}</td>
                      <td className="py-3 pr-4 font-bold text-[#071E33]">{money(offer.unitPrice)} / {offer.quotedUnit}</td>
                      <td className="py-3 pr-4">{[offer.brand, offer.specification].filter(Boolean).join(" · ") || "—"}</td>
                      <td className="py-3 pr-4">{offer.submittedAt ? new Date(offer.submittedAt).toLocaleDateString("en-NG") : "—"}</td>
                      <td className="py-3">{dateText(getSupplierOfferEffectiveValidUntil(offer))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-[11px] leading-5 text-[#7A8B9E]">Archived prices are historical observations only. They are not included in the current live range and should not be treated as available quotations.</p>
          </div>
        </details>
      ) : null}

      {market ? (
        <section className="rounded-2xl border border-[#DCE4EC] bg-white p-5 md:p-6">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#617286]">Charismak market price guide</p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-6 text-[#526579]">Benchmark: {money(market.priceLow, item.currency)} – {money(market.priceHigh, item.currency)} / {unit}. Use valid supplier prices above for actual buying options.</p>
            <a href={market.primarySourceUrl} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-2 text-sm font-bold text-[#0D3B66]">
              View market source <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </section>
      ) : null}
    </div>
  );
}
