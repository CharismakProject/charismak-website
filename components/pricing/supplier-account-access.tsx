"use client";

import { useState } from "react";
import { ArrowRight, KeyRound, Loader2, MessageCircle, Store, UserPlus } from "lucide-react";

import SupplierCategoryPicker from "@/components/pricing/supplier-category-picker";
import {
  createSupplierProfile,
  recoverSupplierProfile,
  type SupplierProfile,
} from "@/lib/platform/supplier-profiles";

const PROFILE_TOKEN_KEY = "charismak:supplier-profile-token:v1";

type Mode = "create" | "signin";
type Props = { onReady: (profile: SupplierProfile, created?: boolean) => void; onGuest: () => void };

const supportWhatsApp = (businessName: string, phone: string) => {
  const message = [
    "Hello Charismak Project, I need help resetting my supplier account PIN.",
    businessName.trim() ? `Business: ${businessName.trim()}` : "",
    phone.trim() ? `Registered phone: ${phone.trim()}` : "",
  ].filter(Boolean).join("\n");
  return `https://wa.me/2347066619598?text=${encodeURIComponent(message)}`;
};

export default function SupplierAccountAccess({ onReady, onGuest }: Props) {
  const [mode, setMode] = useState<Mode>("create");
  const [businessName, setBusinessName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [deliveryAreas, setDeliveryAreas] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const keep = (profile: SupplierProfile, created = false) => {
    window.localStorage.setItem(PROFILE_TOKEN_KEY, profile.accessToken);
    window.dispatchEvent(new CustomEvent("charismak:supplier-account-ready"));
    onReady(profile, created);
  };

  const submit = async () => {
    setError("");
    if (!businessName.trim() || !phone.trim() || !/^\d{4,6}$/.test(pin)) {
      setError("Business name, phone number and a 4–6 digit PIN are required.");
      return;
    }
    if (mode === "create" && !location.trim()) {
      setError("Add your main business location.");
      return;
    }
    if (mode === "create" && !categories.length) {
      setError("Select at least one product or service category.");
      return;
    }

    setBusy(true);
    try {
      if (mode === "create") {
        const result = await createSupplierProfile({
          businessName: businessName.trim(),
          contactPerson: contactPerson.trim(),
          phone: phone.trim(),
          whatsapp: whatsapp.trim() || phone.trim(),
          email: email.trim(),
          location: location.trim(),
          deliveryAreas: deliveryAreas.trim(),
          categories,
          pin,
        });
        keep(result.profile, true);
      } else {
        keep(await recoverSupplierProfile(businessName.trim(), phone.trim(), pin));
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "We could not open this supplier account.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-7">
      <section className="overflow-hidden rounded-[1.5rem] bg-[#071E33] p-5 text-white shadow-[0_24px_65px_rgba(7,30,51,0.18)] sm:rounded-[2rem] sm:p-8">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#F2B544]"><Store className="h-4 w-4" />Supplier portal</span>
        <h1 className="mt-4 max-w-3xl text-3xl font-black leading-tight sm:text-5xl">Create your supplier profile.</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70">For material suppliers, equipment vendors and specialist trade teams.</p>
      </section>

      <section className="rounded-[1.5rem] border border-[#DCE4EC] bg-white p-4 shadow-[0_10px_35px_rgba(7,30,51,0.05)] sm:rounded-[2rem] sm:p-7">
        <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-[#F3F6F9] p-1.5">
          <button type="button" onClick={() => { setMode("create"); setError(""); }} className={`min-h-12 rounded-xl px-3 text-sm font-black ${mode === "create" ? "bg-[#0D3B66] text-white shadow-sm" : "text-[#617286]"}`}><span className="inline-flex items-center gap-2"><UserPlus className="h-4 w-4" />New supplier</span></button>
          <button type="button" onClick={() => { setMode("signin"); setError(""); }} className={`min-h-12 rounded-xl px-3 text-sm font-black ${mode === "signin" ? "bg-[#071E33] text-white shadow-sm" : "text-[#617286]"}`}><span className="inline-flex items-center gap-2"><KeyRound className="h-4 w-4" />Sign in</span></button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Business name" value={businessName} onChange={setBusinessName} required />
          <Field label="Phone / WhatsApp" value={phone} onChange={setPhone} required inputMode="tel" />
          {mode === "create" ? <>
            <Field label="Contact person" value={contactPerson} onChange={setContactPerson} />
            <Field label="Alternative WhatsApp" value={whatsapp} onChange={setWhatsapp} inputMode="tel" />
            <Field label="Email" value={email} onChange={setEmail} inputMode="email" />
            <Field label="Business location" value={location} onChange={setLocation} required placeholder="e.g. Abuja" />
            <div className="sm:col-span-2"><Field label="Delivery / service areas" value={deliveryAreas} onChange={setDeliveryAreas} placeholder="e.g. Abuja, Nasarawa, Kaduna" /></div>
            <div className="sm:col-span-2"><SupplierCategoryPicker value={categories} onChange={setCategories} required compact /></div>
          </> : null}
          <Field label={mode === "create" ? "Create PIN" : "PIN"} value={pin} onChange={(value) => setPin(value.replace(/\D/g, "").slice(0, 6))} required inputMode="numeric" placeholder="4–6 digits" />
        </div>

        {mode === "signin" ? <div className="mt-4 flex flex-col gap-2 rounded-xl border border-[#CFE4D7] bg-[#F3FBF6] p-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs leading-5 text-[#526579]"><strong className="text-[#071E33]">Forgot your PIN?</strong> Account resets are verified through the registered contact.</p><a href={supportWhatsApp(businessName, phone)} target="_blank" rel="noreferrer" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#197447] px-4 text-xs font-black text-white"><MessageCircle className="h-4 w-4" />WhatsApp</a></div> : null}

        {error ? <p className="mt-4 rounded-xl border border-[#F0C4BA] bg-[#FFF4F1] p-3 text-sm text-[#8B1E00]">{error}</p> : null}

        <button type="button" onClick={() => void submit()} disabled={busy} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#A82B05] px-5 text-sm font-black text-white disabled:opacity-50 sm:w-auto">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          {busy ? "Please wait…" : mode === "create" ? "Create profile" : "Sign in"}
        </button>

        <div className="mt-6 border-t border-[#E4E9EE] pt-5"><button type="button" onClick={onGuest} className="text-xs font-bold text-[#0D3B66] underline underline-offset-4">Price update only</button></div>
      </section>
    </div>
  );
}

function Field({ label, value, onChange, required, placeholder, inputMode = "text" }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; placeholder?: string; inputMode?: "text" | "tel" | "email" | "numeric" }) {
  return <label className="block min-w-0"><span className="mb-2 block text-xs font-black text-[#071E33]">{label}{required ? " *" : ""}</span><input value={value} onChange={(event) => onChange(event.target.value)} inputMode={inputMode} placeholder={placeholder} className="min-h-12 w-full rounded-xl border border-[#DCE4EC] px-4 text-base text-[#071E33] outline-none focus:border-[#0D3B66] focus:ring-2 focus:ring-[#0D3B66]/10" /></label>;
}
