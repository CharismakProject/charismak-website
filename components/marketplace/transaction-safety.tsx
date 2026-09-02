"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  Flag,
  LockKeyhole,
  ShieldCheck,
  X,
} from "lucide-react";

type PendingContact = {
  href: string;
  supplierName: string;
};

const isProtectedContactHref = (href: string) => {
  const value = href.trim().toLowerCase();
  return value.startsWith("tel:") || value.startsWith("mailto:") || value.includes("wa.me/") || value.includes("whatsapp.com/");
};

const supplierNameFrom = (anchor: HTMLAnchorElement) => {
  const article = anchor.closest("article");
  const articleHeading = article?.querySelector("h2, h3")?.textContent?.trim();
  if (articleHeading) return articleHeading;

  const modal = anchor.closest(".fixed");
  const modalHeading = modal?.querySelector("h2, h3")?.textContent?.trim();
  if (modalHeading) return modalHeading;

  return "this supplier";
};

export function MarketplaceTransactionGuard() {
  const [pending, setPending] = useState<PendingContact | null>(null);
  const [productConfirmed, setProductConfirmed] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [platformConfirmed, setPlatformConfirmed] = useState(false);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const element = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(element instanceof HTMLAnchorElement)) return;
      if (element.dataset.charismakSafetySkip === "true") return;

      const href = element.getAttribute("href") || "";
      if (!isProtectedContactHref(href)) return;

      event.preventDefault();
      setPending({ href, supplierName: supplierNameFrom(element) });
      setProductConfirmed(false);
      setPaymentConfirmed(false);
      setPlatformConfirmed(false);
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  if (!pending) return null;

  const canContinue = productConfirmed && paymentConfirmed && platformConfirmed;
  const close = () => setPending(null);
  const proceed = () => {
    if (!canContinue) return;
    const href = pending.href;
    setPending(null);
    if (href.startsWith("http://") || href.startsWith("https://")) {
      window.open(href, "_blank", "noopener,noreferrer");
      return;
    }
    window.location.href = href;
  };

  return (
    <div className="fixed inset-0 z-[180] grid place-items-center overflow-y-auto bg-[#020B16]/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="transaction-safety-title">
      <div className="w-full max-w-xl overflow-hidden rounded-[1.5rem] bg-white shadow-2xl">
        <div className="bg-[#071E33] p-5 text-white sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#F2B544] text-[#071E33]">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#F2B544]">Before you contact or pay</p>
                <h2 id="transaction-safety-title" className="mt-1 text-xl font-black sm:text-2xl">Confirm the transaction yourself</h2>
                <p className="mt-2 text-xs leading-5 text-white/65">You are about to contact {pending.supplierName}.</p>
              </div>
            </div>
            <button type="button" onClick={close} aria-label="Close safety confirmation" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/15 bg-white/5 text-white/80">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <div className="rounded-2xl border border-[#F1D49A] bg-[#FFF9ED] p-4 text-xs leading-5 text-[#6F5216]">
            <strong className="block text-sm text-[#5D430D]">A listed or price-reviewed supplier is not a transaction guarantee.</strong>
            <span className="mt-1 block">Confirm identity, product, payment details and delivery directly before committing money or goods.</span>
          </div>

          <div className="mt-5 space-y-3">
            <SafetyCheck checked={productConfirmed} onChange={setProductConfirmed}>
              I will confirm the exact product/specification, quantity, stock, current price, delivery cost and delivery terms before placing the order.
            </SafetyCheck>
            <SafetyCheck checked={paymentConfirmed} onChange={setPaymentConfirmed}>
              I will confirm the beneficiary/account name and payment details independently and use a traceable payment method. I will not rely only on a chat, screenshot or payment alert.
            </SafetyCheck>
            <SafetyCheck checked={platformConfirmed} onChange={setPlatformConfirmed}>
              I understand Charismak provides listings and price references only and is not the buyer, seller, payment processor or escrow party in this transaction.
            </SafetyCheck>
          </div>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <button type="button" onClick={proceed} disabled={!canContinue} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#0D3B66] px-5 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-[#AAB6C2]">
              <CheckCircle2 className="h-4 w-4" /> Continue securely
            </button>
            <button type="button" onClick={close} className="min-h-12 rounded-xl border border-[#CBD7E2] px-5 text-sm font-black text-[#526579]">Cancel</button>
          </div>

          <a
            href="mailto:info@charismakproject.com?subject=Marketplace%20safety%20report"
            data-charismak-safety-skip="true"
            className="mt-4 inline-flex items-center gap-2 text-xs font-black text-[#A82B05]"
          >
            <Flag className="h-4 w-4" /> Report suspicious activity
          </a>
        </div>
      </div>
    </div>
  );
}

function SafetyCheck({ checked, onChange, children }: { checked: boolean; onChange: (value: boolean) => void; children: React.ReactNode }) {
  return (
    <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-xs leading-5 transition ${checked ? "border-[#9FD0B4] bg-[#F0FAF4] text-[#23583D]" : "border-[#DCE4EC] bg-white text-[#526579]"}`}>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[#197447]" />
      <span>{children}</span>
    </label>
  );
}

export function MarketplaceSafetyNotice({ compact = false }: { compact?: boolean }) {
  return (
    <section className={`rounded-2xl border border-[#F1D49A] bg-[#FFF9ED] ${compact ? "p-4" : "p-5 md:p-6"}`}>
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#F2B544] text-[#071E33]">
          <AlertTriangle className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#8A5D00]">Marketplace safety notice</p>
          <h2 className={`${compact ? "mt-1 text-base" : "mt-1 text-lg md:text-xl"} font-black text-[#071E33]`}>Confirm product, supplier and payment before finalising business.</h2>
          <p className="mt-2 text-xs leading-6 text-[#6A5A38]">
            Prices and listings are for reference and discovery. Confirm the exact product/specification, quantity, stock, final price, delivery terms and the beneficiary/account name directly before you pay or release goods. A reviewed price does not guarantee supplier identity, product quality, stock or delivery.
          </p>
          <p className="mt-2 text-[11px] leading-5 text-[#786947]">
            Charismak Project does not hold transaction funds or act as escrow and is not a party to buyer-seller transactions. Buyers and sellers remain responsible for their own checks and agreements. To the extent permitted by law, Charismak is not liable for losses arising from transactions between users.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link href="/marketplace-safety" className="inline-flex items-center gap-1.5 text-xs font-black text-[#0D3B66]">
              <ShieldCheck className="h-4 w-4" /> Safety guide & disclaimer
            </Link>
            <a href="mailto:info@charismakproject.com?subject=Marketplace%20safety%20report" data-charismak-safety-skip="true" className="inline-flex items-center gap-1.5 text-xs font-black text-[#A82B05]">
              <Flag className="h-4 w-4" /> Report suspicious activity
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SellerSafetyNotice() {
  return (
    <section className="mb-6 rounded-2xl border border-[#BFD4E8] bg-[#F4F9FE] p-5 md:p-6">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#0D3B66] text-white">
          <LockKeyhole className="h-5 w-5" />
        </span>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#0D3B66]">Protect your supplier account & goods</p>
          <h2 className="mt-1 text-lg font-black text-[#071E33]">Confirm cleared payment before releasing materials.</h2>
          <div className="mt-3 grid gap-2 text-xs leading-5 text-[#526579] md:grid-cols-2">
            <p className="flex gap-2"><BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#197447]" /> Never share your supplier PIN, OTP, password or account-access link. Charismak will not ask you for them.</p>
            <p className="flex gap-2"><BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#197447]" /> Do not release goods because of a payment screenshot or alert. Confirm the money has cleared in your own bank account.</p>
            <p className="flex gap-2"><BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#197447]" /> Keep an invoice/order record and confirm the buyer's phone, delivery address, quantity and receiving contact.</p>
            <p className="flex gap-2"><BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#197447]" /> Report impersonation, suspicious buyers or unusual payment requests to Charismak before proceeding.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
