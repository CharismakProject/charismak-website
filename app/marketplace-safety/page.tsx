import Link from "next/link";
import { AlertTriangle, ArrowLeft, BadgeCheck, Flag, LockKeyhole, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Marketplace Safety & Disclaimer | Charismak Project",
  description: "Safety guidance for buyers and suppliers using Charismak construction prices and supplier marketplace listings.",
};

export default function MarketplaceSafetyPage() {
  return (
    <main className="min-h-screen bg-[#F5F7FA] pt-20">
      <div className="mx-auto max-w-5xl px-4 py-10 md:px-8 md:py-14">
        <Link href="/marketplace" className="inline-flex items-center gap-2 text-sm font-black text-[#0D3B66]">
          <ArrowLeft className="h-4 w-4" /> Back to marketplace
        </Link>

        <section className="mt-5 overflow-hidden rounded-[2rem] bg-[#071E33] p-6 text-white shadow-[0_20px_60px_rgba(7,30,51,0.14)] md:p-9">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#F2B544] text-[#071E33]"><ShieldCheck className="h-6 w-6" /></span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#F2B544]">Marketplace safety</p>
              <h1 className="mt-2 text-3xl font-black tracking-[-0.03em] md:text-5xl">Verify before you pay, deliver or release goods.</h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/70 md:text-base">Charismak helps buyers discover construction prices, suppliers and artisans. The final transaction remains between the buyer and seller, so both parties should independently confirm the important details before committing.</p>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <SafetyCard icon={<AlertTriangle className="h-5 w-5" />} title="For buyers" items={[
            "Confirm the supplier's business/contact details before sending money.",
            "Confirm the exact product, brand/specification, quantity, stock, final price, delivery fee and delivery date.",
            "Confirm the beneficiary/account name independently. Use traceable payment methods and keep payment evidence.",
            "Do not treat a screenshot, chat message or payment instruction alone as proof that a transaction is safe.",
            "For significant orders, inspect goods, request suitable evidence or agree a staged/controlled transaction before full payment.",
          ]} />

          <SafetyCard icon={<LockKeyhole className="h-5 w-5" />} title="For suppliers & artisans" items={[
            "Never share your Charismak supplier PIN, OTP, password, recovery information or private access link.",
            "Confirm funds have cleared in your own bank account before releasing goods or starting delivery. A screenshot or alert is not enough.",
            "Issue an invoice/order record and confirm the buyer's phone, delivery address, quantity and receiving contact.",
            "Be cautious if a buyer asks you to refund an overpayment to another account or makes unusual third-party payment requests.",
            "Report impersonation, suspicious messages or fraudulent payment claims before proceeding.",
          ]} />
        </div>

        <section className="mt-6 rounded-2xl border border-[#DCE4EC] bg-white p-5 md:p-7">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#EEF4FA] text-[#0D3B66]"><BadgeCheck className="h-5 w-5" /></span>
            <div>
              <h2 className="text-xl font-black text-[#071E33]">What a Charismak price review means</h2>
              <p className="mt-2 text-sm leading-6 text-[#526579]">An approved or reviewed supplier price means the price entry has passed through Charismak's price-review workflow for publication. It does <strong>not</strong> mean Charismak guarantees the supplier's identity, ownership of goods, stock availability, product authenticity or quality, delivery performance, buyer creditworthiness, payment safety or the outcome of a transaction.</p>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-[#F1D49A] bg-[#FFF9ED] p-5 md:p-7">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8A5D00]">Disclaimer</p>
          <h2 className="mt-2 text-xl font-black text-[#071E33]">Charismak is not a party to buyer-seller transactions.</h2>
          <div className="mt-3 space-y-3 text-sm leading-6 text-[#6A5A38]">
            <p>Charismak Project provides construction price references, supplier/artisan listings and contact discovery. Unless expressly stated otherwise for a separate contracted service, Charismak does not sell the listed goods, collect or hold marketplace payments, provide escrow, guarantee a user, or enter the purchase/supply agreement between users.</p>
            <p>Buyers and sellers are responsible for verifying identity, product/service details, price, payment information, delivery terms, documentation and any other condition important to their transaction. To the maximum extent permitted by applicable law, Charismak is not liable for loss, fraud, non-delivery, defective goods, payment disputes or other issues arising from transactions made directly between marketplace users.</p>
          </div>
        </section>

        <section className="mt-6 flex flex-col gap-4 rounded-2xl border border-[#F1C8C0] bg-[#FFF4F1] p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#A82B05]">Something looks wrong?</p>
            <h2 className="mt-1 text-lg font-black text-[#071E33]">Report suspicious activity before proceeding.</h2>
            <p className="mt-1 text-xs leading-5 text-[#617286]">Include the supplier/business name, supplier code if available, product and a short description of what happened.</p>
          </div>
          <a href="mailto:info@charismakproject.com?subject=Marketplace%20safety%20report" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#A82B05] px-5 text-sm font-black text-white">
            <Flag className="h-4 w-4" /> Report to Charismak
          </a>
        </section>
      </div>
    </main>
  );
}

function SafetyCard({ icon, title, items }: { icon: React.ReactNode; title: string; items: string[] }) {
  return (
    <section className="rounded-2xl border border-[#DCE4EC] bg-white p-5 md:p-6">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#EEF4FA] text-[#0D3B66]">{icon}</span>
        <h2 className="text-xl font-black text-[#071E33]">{title}</h2>
      </div>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <p key={item} className="flex items-start gap-2 text-xs leading-6 text-[#526579]">
            <BadgeCheck className="mt-1 h-4 w-4 shrink-0 text-[#197447]" /> {item}
          </p>
        ))}
      </div>
    </section>
  );
}
