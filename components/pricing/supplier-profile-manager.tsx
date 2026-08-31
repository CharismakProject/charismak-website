"use client";

import { useState } from "react";
import { ArrowLeft, Loader2, LogOut, Save } from "lucide-react";

import SupplierCategoryPicker from "@/components/pricing/supplier-category-picker";
import { updateSupplierProfile, type SupplierProfile } from "@/lib/platform/supplier-profiles";

const PROFILE_TOKEN_KEY = "charismak:supplier-profile-token:v1";

export default function SupplierProfileManager({ profile, onDone, onSignOut }: { profile: SupplierProfile; onDone: (profile: SupplierProfile) => void; onSignOut: () => void }) {
  const [businessName, setBusinessName] = useState(profile.businessName);
  const [contactPerson, setContactPerson] = useState(profile.contactPerson || "");
  const [phone, setPhone] = useState(profile.phone);
  const [whatsapp, setWhatsapp] = useState(profile.whatsapp || "");
  const [email, setEmail] = useState(profile.email || "");
  const [location, setLocation] = useState(profile.location);
  const [deliveryAreas, setDeliveryAreas] = useState(profile.deliveryAreas || "");
  const [categories, setCategories] = useState<string[]>(profile.categories || []);
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    setError("");
    if (!businessName.trim() || !phone.trim() || !location.trim()) {
      setError("Business name, phone and location are required.");
      return;
    }
    if (!categories.length) {
      setError("Select at least one product or service category.");
      return;
    }
    if (pin && !/^\d{4,6}$/.test(pin)) {
      setError("New PIN must be 4–6 digits.");
      return;
    }
    setBusy(true);
    try {
      const next = await updateSupplierProfile(profile.accessToken, {
        businessName,
        contactPerson,
        phone,
        whatsapp,
        email,
        location,
        deliveryAreas,
        categories,
        pin: pin || undefined,
      });
      onDone(next);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Profile could not be updated.");
    } finally {
      setBusy(false);
    }
  };

  const signOut = () => {
    window.localStorage.removeItem(PROFILE_TOKEN_KEY);
    window.dispatchEvent(new CustomEvent("charismak:supplier-account-ready"));
    onSignOut();
  };

  return (
    <section className="rounded-[1.5rem] border border-[#DCE4EC] bg-white p-4 shadow-[0_10px_35px_rgba(7,30,51,.06)] sm:rounded-[2rem] sm:p-7">
      <button onClick={() => onDone(profile)} className="inline-flex items-center gap-2 text-sm font-black text-[#0D3B66]"><ArrowLeft className="h-4 w-4" />Back</button>
      <div className="mt-5"><p className="text-[10px] font-black uppercase tracking-[.14em] text-[#A82B05]">Supplier profile</p><h2 className="mt-2 text-2xl font-black text-[#071E33]">{profile.businessName}</h2></div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label="Business name *" value={businessName} onChange={setBusinessName} />
        <Field label="Contact person" value={contactPerson} onChange={setContactPerson} />
        <Field label="Phone *" value={phone} onChange={setPhone} />
        <Field label="WhatsApp" value={whatsapp} onChange={setWhatsapp} />
        <Field label="Email" value={email} onChange={setEmail} />
        <Field label="Business location *" value={location} onChange={setLocation} />
        <div className="sm:col-span-2"><Field label="Delivery / service areas" value={deliveryAreas} onChange={setDeliveryAreas} /></div>
        <div className="sm:col-span-2"><SupplierCategoryPicker value={categories} onChange={setCategories} required compact /></div>
        <Field label="New PIN (optional)" value={pin} onChange={(value) => setPin(value.replace(/\D/g, "").slice(0, 6))} />
      </div>

      {error ? <p className="mt-4 rounded-xl bg-[#FFF4F1] p-3 text-sm text-[#8B1E00]">{error}</p> : null}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button disabled={busy} onClick={() => void save()} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#0D3B66] px-5 text-sm font-black text-white disabled:opacity-50">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{busy ? "Saving…" : "Save profile"}</button>
        <button onClick={signOut} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#E5B8AE] px-5 text-sm font-black text-[#A82B05]"><LogOut className="h-4 w-4" />Sign out</button>
      </div>
    </section>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="block"><span className="mb-2 block text-xs font-black text-[#071E33]">{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} className="min-h-12 w-full rounded-xl border border-[#DCE4EC] px-4 text-base text-[#071E33] outline-none focus:border-[#0D3B66]" /></label>;
}
