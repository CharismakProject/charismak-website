"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  ExternalLink,
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
  loadSupplierOffersForItem,
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

const whatsappHref = (offer: SupplierMarketplaceOffer, productName: string) => {
  const phone = (offer.whatsapp || offer.phone || "").replace(/[^0-9]/g, "");
  if (!phone) return null;
  const message = encodeURIComponent(
    `Hello ${offer.supplierName}, I found your ${productName} price on Charismak. Please confirm the current price, availability and delivery to my site.`,
  );
  return `https://wa.me/${phone}?text=${message}`;
};

export default function MaterialSupplierDetail({ itemId }: { itemId: string }) {
  const [item, setItem] = useState<PriceItem | null>(null);
  const [offers, setOffers] = useState<SupplierMarketplaceOffer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const selected = loadPriceItems().find((candidate) => candidate.id === itemId) ?? null;
    setItem(selected);
    if (!selected) {
      setLoading(false);
      return;
    }
    void loadSupplierOffersForItem(itemId).then((rows) => {
      setOffers(rows);
      setLoading(false);
    });
  }, [itemId]);

  const supplierLocations = useMemo(
    () => Array.from(new Set(offers.map((offer) => offer.location).filter(Boolean))),
    [offers],
  );

  if (!item) {
    return (
      <section className="rounded-3xl border border-dashed border-[#B8C7D6] bg-white p-10 text-center">
        <PackageSearch className="mx-auto h-8 w-8 text-[#7A8B9E]" />
        <h1 className="mt-4 text-2xl font-black text-[#071E33]">Material not found</h1>
        <p className="mt-2 text-sm text-[#617286]">This price item may have been renamed or removed from the catalogue.</p>
        <Link href="/prices" className="mt-5 inline-flex rounded-xl bg-[#0D3B66] px-5 py-3 text-sm font-bold text-white">Back to price list</Link>
      </section>
    );
  }

  const market = JIJI_MARKET_SNAPSHOT[item.id];
  const displayName = market?.marketName || item.description;
  const displayLocation = market?.location || item.location;
  const image = item.imageUrl || previewImages[item.id] || null;
  const lowestOffer = offers[0] ?? null;

  return (
    <div className="space-y-6">
      <Link href="/prices" className="inline-flex items-center gap-2 text-sm font-bold text-[#0D3B66] hover:text-[#A82B05]">
        <ArrowLeft className="h-4 w-4" /> Back to price list
      </Link>

      <section className="overflow-hidden rounded-[2rem] border border-[#DCE4EC] bg-white shadow-[0_18px_55px_rgba(7,30,51,0.08)]">
        <div className="grid lg:grid-cols-[0.85fr_1.15fr]">
          <div className="relative min-h-72 bg-[#EEF2F6] lg:min-h-[430px]">
            {image ? (
              <img src={image} alt={item.imageAlt || displayName} className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div className="absolute inset-0 grid place-items-center text-center">
                <div><ImageIcon className="mx-auto h-10 w-10 text-[#9AA8B6]" /><span className="mt-3 block text-xs font-black uppercase tracking-[0.14em] text-[#7A8B9E]">Product photo pending</span></div>
              </div>
            )}
          </div>

          <div className="p-6 md:p-8 lg:p-10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#EAF2FF] px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#0D3B66]">{item.category === "plant" ? "Equipment" : item.category}</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF7EF] px-3 py-1 text-[10px] font-black text-[#197447]"><BadgeCheck className="h-3.5 w-3.5" /> Supplier-linked item</span>
            </div>
            <h1 className="mt-4 text-3xl font-black leading-tight text-[#071E33] md:text-4xl">{displayName}</h1>
            {(market?.specification || item.specification) ? <p className="mt-3 text-sm leading-6 text-[#617286]">{market?.specification || item.specification}</p> : null}
            <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#526579]"><MapPin className="h-4 w-4 text-[#A82B05]" />{displayLocation}</p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-[#071E33] p-5 text-white">
                <span className="text-[10px] font-black uppercase tracking-[0.13em] text-white/55">Market reference / {market?.unit || item.marketUnit || item.unit}</span>
                <strong className="mt-2 block text-2xl">{market ? money(market.reference) : money(item.rate, item.currency)}</strong>
                {market ? <span className="mt-2 block text-xs text-white/60">Observed range {money(market.priceLow)} – {money(market.priceHigh)}</span> : null}
              </div>
              <div className="rounded-2xl border border-[#DCE4EC] bg-[#F8FAFC] p-5">
                <span className="text-[10px] font-black uppercase tracking-[0.13em] text-[#617286]">Approved supplier offers</span>
                <strong className="mt-2 block text-2xl text-[#071E33]">{offers.length}</strong>
                <span className="mt-2 block text-xs text-[#617286]">{lowestOffer ? `From ${money(lowestOffer.unitPrice)} / ${lowestOffer.quotedUnit}` : "Waiting for an approved supplier submission"}</span>
              </div>
            </div>

            <p className="mt-5 text-xs leading-6 text-[#617286]">Supplier offers below come from the supplier price-update system and only appear here after Charismak review. Brand, specification, unit and location stay attached to the supplier's submitted price.</p>
          </div>
        </div>
      </section>

      <section>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#A82B05]">Suppliers for this item</p>
            <h2 className="mt-2 text-2xl font-black text-[#071E33]">Compare exact supplier submissions</h2>
          </div>
          {supplierLocations.length ? <p className="text-xs text-[#617286]">Available in {supplierLocations.join(", ")}</p> : null}
        </div>

        {loading ? (
          <div className="mt-5 rounded-2xl border border-[#DCE4EC] bg-white p-8 text-center text-sm text-[#617286]">Loading approved supplier prices…</div>
        ) : offers.length ? (
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {offers.map((offer, index) => {
              const whatsapp = whatsappHref(offer, displayName);
              return (
                <article key={offer.id} className="rounded-2xl border border-[#DCE4EC] bg-white p-5 shadow-[0_8px_26px_rgba(7,30,51,0.045)]">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#EAF2FF] text-[#0D3B66]"><Store className="h-5 w-5" /></span>
                      <div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#A82B05]">{index === 0 ? "Lowest approved offer" : "Approved supplier"}</p><h3 className="mt-1 truncate text-lg font-black text-[#071E33]">{offer.supplierName}</h3><p className="mt-1 flex items-center gap-1.5 text-xs text-[#617286]"><MapPin className="h-3.5 w-3.5" />{offer.location}{offer.serviceArea ? ` · serves ${offer.serviceArea}` : ""}</p></div>
                    </div>
                    <strong className="shrink-0 text-right text-lg text-[#0D3B66]">{money(offer.unitPrice)}<span className="block text-[10px] font-semibold text-[#7A8B9E]">per {offer.quotedUnit}</span></strong>
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-xl bg-[#F8FAFC] p-3"><dt className="text-[#7A8B9E]">Brand / make</dt><dd className="mt-1 font-bold text-[#071E33]">{offer.brand || "Not stated"}</dd></div>
                    <div className="rounded-xl bg-[#F8FAFC] p-3"><dt className="text-[#7A8B9E]">Specification</dt><dd className="mt-1 font-bold text-[#071E33]">{offer.specification || "As listed"}</dd></div>
                    <div className="rounded-xl bg-[#F8FAFC] p-3"><dt className="text-[#7A8B9E]">Bulk price</dt><dd className="mt-1 font-bold text-[#071E33]">{offer.bulkPrice == null ? "—" : money(offer.bulkPrice)}</dd></div>
                    <div className="rounded-xl bg-[#F8FAFC] p-3"><dt className="text-[#7A8B9E]">Minimum quantity</dt><dd className="mt-1 font-bold text-[#071E33]">{offer.minimumQty == null ? "—" : `${offer.minimumQty} ${offer.quotedUnit}`}</dd></div>
                    <div className="rounded-xl bg-[#F8FAFC] p-3"><dt className="text-[#7A8B9E]">Delivery</dt><dd className="mt-1 font-bold text-[#071E33]">{offer.deliveryIncluded ? "Included" : offer.deliveryFee == null ? "Confirm with supplier" : money(offer.deliveryFee)}</dd></div>
                    <div className="rounded-xl bg-[#F8FAFC] p-3"><dt className="text-[#7A8B9E]">Availability</dt><dd className="mt-1 font-bold text-[#071E33]">{offer.availability || "Confirm stock"}</dd></div>
                  </dl>

                  {offer.supplierRemarks ? <p className="mt-3 text-xs leading-5 text-[#617286]">{offer.supplierRemarks}</p> : null}
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[10px] text-[#7A8B9E]">
                    {offer.submittedAt ? <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />Submitted {new Date(offer.submittedAt).toLocaleDateString("en-NG")}</span> : null}
                    {offer.validUntil ? <span>Valid to {new Date(offer.validUntil).toLocaleDateString("en-NG")}</span> : null}
                  </div>

                  <div className="mt-5 grid gap-2 sm:grid-cols-3">
                    {whatsapp ? <a href={whatsapp} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#0D3B66] px-3 text-xs font-bold text-white"><MessageCircle className="h-3.5 w-3.5" />WhatsApp</a> : null}
                    {offer.phone ? <a href={`tel:${offer.phone}`} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#CAD5E0] px-3 text-xs font-bold text-[#071E33]"><Phone className="h-3.5 w-3.5" />Call</a> : null}
                    {offer.email ? <a href={`mailto:${offer.email}?subject=${encodeURIComponent(`Quote request for ${displayName}`)}`} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#CAD5E0] px-3 text-xs font-bold text-[#071E33]"><Mail className="h-3.5 w-3.5" />Quote</a> : null}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-[#B8C7D6] bg-white p-8 text-center">
            <Truck className="mx-auto h-8 w-8 text-[#7A8B9E]" />
            <h3 className="mt-3 text-lg font-black text-[#071E33]">No approved supplier price for this exact item yet</h3>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#617286]">As suppliers submit this material through the price-update form and Charismak approves the entries, they will appear here automatically. We will not show a supplier against a material they did not actually price.</p>
          </div>
        )}
      </section>

      {market ? <section className="rounded-2xl border border-[#DCE4EC] bg-white p-5 md:p-6"><p className="text-xs font-black uppercase tracking-[0.14em] text-[#617286]">External market reference</p><div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm leading-6 text-[#526579]">The external market observation remains a reference point; supplier submissions are listed separately so users can see who can actually supply the item.</p><a href={market.primarySourceUrl} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-2 text-sm font-bold text-[#0D3B66]">View source <ExternalLink className="h-4 w-4" /></a></div></section> : null}
    </div>
  );
}
