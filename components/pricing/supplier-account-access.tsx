"use client";

import { useState } from "react";
import { ArrowRight, KeyRound, Loader2, Store, UserPlus } from "lucide-react";

import {
  createSupplierProfile,
  recoverSupplierProfile,
  type SupplierProfile,
} from "@/lib/platform/supplier-profiles";

const PROFILE_TOKEN_KEY = "charismak:supplier-profile-token:v1";

type Mode = "create" | "signin";

type Props = {
  onReady: (profile: SupplierProfile) => void;
  onGuest: () => void;
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
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const keep = (profile: SupplierProfile) => {
    window.localStorage.setItem(PROFILE_TOKEN_KEY, profile.accessToken);
    window.dispatchEvent(new CustomEvent("charismak:supplier-account-ready"));
    onReady(profile);
  };

  const submit = async () => {
    setError("");
    if (!businessName.trim() || !phone.trim() || !/^\d{4,6}$/.test(pin)) {
      setError("Enter your business name, phone number and a 4–6 digit account PIN.");
      return;
    }
    if (mode === "create" && !location.trim()) {
      setError("Enter your main supply location.");
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
          pin,
        });
        keep(result.profile);
      } else {
        keep(await recoverSupplierProfile(businessName.trim(), phone.trim(), pin));
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to open the supplier account.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-7">
      <section className="overflow-hidden rounded-[1.5rem] bg-[#071E33] p-5 text-white shadow-[0_24px_65px_rgba(7,30,51,0.18)] sm:rounded-[2rem] sm:p-8">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#F2B544]"><Store className="h-4 w-4" />Supplier account</span>
        <h1 className="mt-4 max-w-3xl text-3xl font-black leading-tight sm:text-5xl">Create an account once. Keep your prices current from your phone.</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-white/70">Your account keeps your business details and previous price submissions together. New and updated prices still pass through Charismak review before appearing publicly.</p>
      </section>

      <section className="rounded-[1.5rem] border border-[#DCE4EC] bg-white p-4 shadow-[0_10px_35px_rgba(7,30,51,0.05)] sm:rounded-[2rem] sm:p-7">
        <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-[#F3F6F9] p-1.5">
          <button type="button" onClick={() => { setMode("create"); setError(""); }} className={`min-h-12 rounded-xl px-3 text-sm font-black ${mode === "create" ? "bg-[#0D3B66] text-white shadow-sm" : "text-[#617286]"}`}><span className="inline-flex items-center gap-2"><UserPlus className="h-4 w-4" />New supplier</span></button>
          <button type="button" onClick={() => { setMode("signin"); setError(""); }} className={`min-h-12 rounded-xl px-3 text-sm font-black ${mode === "signin" ? "bg-[#071E33] text-white shadow-sm" : "text-[#617286]"}`}><span className="inline-flex items-center gap-2"><KeyRound className="h-4 w-4" />Returning supplier</span></button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Business / supplier name" value={businessName} onChange={setBusinessName} required />
          <Field label="Phone / WhatsApp" value={phone} onChange={setPhone} required inputMode="tel" />
          {mode === "create" ? (
            <>
              <Field label="Contact person" value={contactPerson} onChange={setContactPerson} />
              <Field label="Alternative WhatsApp" value={whatsapp} onChange={setWhatsapp} inputMode="tel" />
              <Field label="Email" value={email} onChange={setEmail} inputMode="email" />
              <Field label="Main supply location" value={location} onChange={setLocation} required placeholder="e.g. Abuja" />
              <div className="sm:col-span-2"><Field label="Delivery / service areas" value={deliveryAreas} onChange={setDeliveryAreas} placeholder="e.g. Abuja, Nasarawa, Kaduna" /></div>
            </>
          ) : null}
          <Field label={mode === "create" ? "Create 4–6 digit PIN" : "Account PIN"} value={pin} onChange={(value) => setPin(value.replace(/\D/g, "").slice(0, 6))} required inputMode="numeric" />
        </div>

        <p className="mt-3 text-xs leading-5 text-[#617286]">Use a PIN you can remember. It is required together with your business name and phone when you return on another device.</p>
        {error ? <p className="mt-4 rounded-xl border border-[#F0C4BA] bg-[#FFF4F1] p-3 text-sm text-[#8B1E00]">{error}</p> : null}

        <button type="button" onClick={() => void submit()} disabled={busy} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#A82B05] px-5 text-sm font-black text-white disabled:opacity-50 sm:w-auto">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          {busy ? "Opening account…" : mode === "create" ? "Create supplier account" : "Sign in to supplier account"}
        </button>

        <div className="mt-6 border-t border-[#E4E9EE] pt-5">
          <button type="button" onClick={onGuest} className="text-xs font-bold text-[#0D3B66] underline underline-offset-4">No account? Send a one-off / bulk price update</button>
        </div>
      </section>
    </div>
  );
}

function Field({ label, value, onChange, required, placeholder, inputMode = "text" }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; placeholder?: string; inputMode?: "text" | "tel" | "email" | "numeric" }) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 block text-xs font-black text-[#071E33]">{label}{required ? " *" : ""}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} inputMode={inputMode} placeholder={placeholder} className="min-h-12 w-full rounded-xl border border-[#DCE4EC] px-4 text-base text-[#071E33] outline-none focus:border-[#0D3B66] focus:ring-2 focus:ring-[#0D3B66]/10" />
    </label>
  );
}
