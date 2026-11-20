"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertTriangle, BadgeCheck, MapPin, MessageCircle, Phone, Store } from "lucide-react";

import { loadMarketplaceDirectory, type MarketplaceOffer, type MarketplaceProfile } from "@/lib/platform/marketplace";

const money = (value: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value);
const date = (value: string) => (value ? new Date(value).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "");

/** The liability caveat shown wherever suppliers are listed. */
export function SupplierCaveat() {
  return (
    <div className="flex gap-3 rounded-xl border border-[#E7C75D] bg-[#FFF9E7] p-4 text-sm leading-6 text-[#5D4600]">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
      <p>
        <strong>Verify the goods before you pay.</strong> Inspect the product, quantity and quality, and confirm the supplier&apos;s identity and account name before any payment. Suppliers are listed for convenience; Charismak Project Nigeria Limited does not take part in payments or deliveries and is not liable for any loss, defect, delay or dispute between buyer and supplier.{" "}
        <Link href="/marketplace-safety" className="font-bold underline">Safety guide</Link>
      </p>
    </div>
  );
}

/** Suppliers who have quoted for one material, under that material's price page. */
export default function MaterialSuppliers({ itemId, itemName }: { itemId: string; itemName: string }) {
  const [state, setState] = useState<{ status: "loading" | "ok" | "error"; rows: { profile: MarketplaceProfile; offer: MarketplaceOffer }[]; message?: string }>({ status: "loading", rows: [] });

  useEffect(() => {
    let cancelled = false;
    void loadMarketplaceDirectory().then((result) => {
      if (cancelled) return;
      const rows = result.profiles
        .filter((profile) => profile.status === "approved" && !profile.isDemo)
        .flatMap((profile) => [...profile.offers, ...profile.pastOffers].filter((offer) => offer.catalogueItemId === itemId).map((offer) => ({ profile, offer })))
        .sort((a, b) => Number(a.offer.expired) - Number(b.offer.expired) || a.offer.price - b.offer.price);
      setState({ status: result.status === "ok" ? "ok" : "error", rows, message: result.status === "ok" ? undefined : result.message });
    });
    return () => { cancelled = true; };
  }, [itemId]);

  return (
    <section id="suppliers" className="scroll-mt-28 rounded-2xl border border-[#DCE4EC] bg-white p-5 md:p-6">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#A82B05]">Suppliers</p>
      <h2 className="mt-1 text-xl font-black text-[#071E33]">Suppliers of {itemName.toLowerCase()}</h2>
      <div className="mt-4"><SupplierCaveat /></div>

      {state.status === "loading" ? <p className="mt-4 text-sm text-[#617286]">Loading suppliers…</p> : null}
      {state.status === "error" ? <p className="mt-4 text-sm text-[#617286]">{state.message ?? "Suppliers could not be loaded right now."}</p> : null}
      {state.status === "ok" && !state.rows.length ? <p className="mt-4 text-sm text-[#617286]">No registered supplier has quoted for this material yet.</p> : null}

      {state.rows.length ? (
        <ul className="mt-4 divide-y divide-[#EEF2F6]">
          {state.rows.map(({ profile, offer }) => {
            const whatsapp = (profile.whatsapp || profile.phone || "").replace(/[^0-9]/g, "").replace(/^0/, "234");
            return (
              <li key={offer.id} className="grid gap-3 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <p className="flex flex-wrap items-center gap-2 font-black text-[#071E33]">
                    {profile.businessName}
                    {profile.verified ? <span className="inline-flex items-center gap-1 rounded-full bg-[#E8F3EC] px-2 py-0.5 text-[10px] font-bold text-[#15803D]"><BadgeCheck className="h-3 w-3" /> Profile reviewed</span> : null}
                    {offer.expired ? <span className="rounded-full bg-[#F1F3F5] px-2 py-0.5 text-[10px] font-bold text-[#617286]">Last quoted — may have changed</span> : null}
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#617286]">
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{offer.location || profile.location}</span>
                    {offer.specification ? <span>{offer.specification}</span> : null}
                    {offer.brand ? <span>Brand: {offer.brand}</span> : null}
                    <span>Valid {offer.validUntil ? `until ${date(offer.validUntil)}` : "—"}</span>
                    {offer.deliveryIncluded ? <span>Delivery included</span> : offer.deliveryFee ? <span>Delivery {money(offer.deliveryFee)}</span> : null}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <strong className="mr-2 text-lg text-[#071E33]">{money(offer.price)}<span className="block text-[11px] font-normal text-[#617286]">per {offer.quotedUnit}</span></strong>
                  {profile.phone ? <a href={`tel:${profile.phone}`} className="inline-flex items-center gap-1 rounded-lg border border-[#D6E0E9] px-3 py-2 text-xs font-bold text-[#0D3B66]"><Phone className="h-3.5 w-3.5" /> Call</a> : null}
                  {whatsapp ? <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg bg-[#15803D] px-3 py-2 text-xs font-bold text-white"><MessageCircle className="h-3.5 w-3.5" /> WhatsApp</a> : null}
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}

      <Link href="/supplier-prices" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#0D3B66] px-4 py-3 text-xs font-black text-white hover:bg-[#071E33]">
        <Store className="h-4 w-4" /> Do you supply this? Register as a supplier
      </Link>
    </section>
  );
}
