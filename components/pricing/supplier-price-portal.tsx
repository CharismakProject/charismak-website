"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  HardHat,
  MapPin,
  Pencil,
  Search,
  ShieldCheck,
  Store,
  UserRound,
  Wrench,
  X,
} from "lucide-react";

import {
  SUPPLIER_FORM_GROUPS,
  SUPPLIER_FORMS,
  type SupplierFormDefinition,
  type SupplierFormGroup,
} from "@/lib/pricing/supplier-forms";
import {
  createSupplierProfile,
  getSupplierProfile,
  recoverSupplierProfile,
  updateSupplierProfile,
  type SupplierProfile,
} from "@/lib/platform/supplier-profiles";

type SupplierMode = "new" | "returning";
type GroupFilter = "All" | SupplierFormGroup;

type ProfileDraft = {
  businessName: string;
  contactPerson: string;
  phone: string;
  whatsapp: string;
  email: string;
  location: string;
  deliveryAreas: string;
};

const PROFILE_TOKEN_KEY = "charismak:supplier-profile-token:v1";
const COMPLETED_KEY = "charismak:supplier-price-completed:v1";
const emptyDraft: ProfileDraft = {
  businessName: "",
  contactPerson: "",
  phone: "",
  whatsapp: "",
  email: "",
  location: "",
  deliveryAreas: "",
};

const groupIcons: Record<SupplierFormGroup, typeof Building2> = {
  "Core materials": Building2,
  "Finishes & envelope": Store,
  "MEP & building systems": ShieldCheck,
  "Civil, site & safety": HardHat,
  "Tools, plant & equipment": Wrench,
  "Labour & specialists": ClipboardCheck,
};

const embeddedUrl = (url: string) =>
  `${url}${url.includes("?") ? "&" : "?"}embedded=true`;

function Field({
  label,
  required,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "email" | "tel";
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black text-[#071E33]">
        {label}{required ? " *" : ""}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-12 w-full rounded-xl border border-[#DCE4EC] bg-white px-4 text-sm text-[#071E33] outline-none transition focus:border-[#0D3B66] focus:ring-2 focus:ring-[#0D3B66]/10"
      />
    </label>
  );
}

export default function SupplierPricePortal() {
  const [mode, setMode] = useState<SupplierMode>("new");
  const [group, setGroup] = useState<GroupFilter>("All");
  const [query, setQuery] = useState("");
  const [profile, setProfile] = useState<SupplierProfile | null>(null);
  const [profileDraft, setProfileDraft] = useState<ProfileDraft>(emptyDraft);
  const [recoverBusiness, setRecoverBusiness] = useState("");
  const [recoverPhone, setRecoverPhone] = useState("");
  const [profileBusy, setProfileBusy] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [editingProfile, setEditingProfile] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [activeForm, setActiveForm] = useState<SupplierFormDefinition | null>(null);

  useEffect(() => {
    let cancelled = false;
    const restore = async () => {
      try {
        const storedCompleted = window.localStorage.getItem(COMPLETED_KEY);
        if (storedCompleted) {
          const parsed = JSON.parse(storedCompleted) as string[];
          if (Array.isArray(parsed)) {
            setCompletedIds(parsed.filter((id) => SUPPLIER_FORMS.some((form) => form.id === id)));
          }
        }
        const token = window.localStorage.getItem(PROFILE_TOKEN_KEY);
        if (!token) return;
        const restored = await getSupplierProfile(token);
        if (cancelled) return;
        setProfile(restored);
        setSelectedIds(restored.categories.filter((id) => SUPPLIER_FORMS.some((form) => form.id === id)));
        setProfileDraft({
          businessName: restored.businessName,
          contactPerson: restored.contactPerson || "",
          phone: restored.phone,
          whatsapp: restored.whatsapp || "",
          email: restored.email || "",
          location: restored.location,
          deliveryAreas: restored.deliveryAreas || "",
        });
        setMode("returning");
      } catch {
        window.localStorage.removeItem(PROFILE_TOKEN_KEY);
      } finally {
        if (!cancelled) setProfileBusy(false);
      }
    };
    void restore();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(COMPLETED_KEY, JSON.stringify(completedIds));
    } catch {
      // Completion markers are only a convenience for the current browser.
    }
  }, [completedIds]);

  const filteredForms = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SUPPLIER_FORMS.filter((form) => {
      const groupMatch = group === "All" || form.group === group;
      const text = [form.title, form.shortTitle, form.audience, ...form.keywords]
        .join(" ")
        .toLowerCase();
      return groupMatch && (!q || text.includes(q));
    });
  }, [group, query]);

  const selectedForms = selectedIds
    .map((id) => SUPPLIER_FORMS.find((form) => form.id === id))
    .filter((form): form is SupplierFormDefinition => Boolean(form));

  const activeUrl = activeForm?.formUrl || null;
  const nextPendingForm = activeForm
    ? selectedForms.find(
        (form) => form.id !== activeForm.id && !completedIds.includes(form.id),
      ) ?? null
    : null;

  const saveToken = (next: SupplierProfile) => {
    window.localStorage.setItem(PROFILE_TOKEN_KEY, next.accessToken);
    setProfile(next);
    setSelectedIds(next.categories.filter((id) => SUPPLIER_FORMS.some((form) => form.id === id)));
    setProfileDraft({
      businessName: next.businessName,
      contactPerson: next.contactPerson || "",
      phone: next.phone,
      whatsapp: next.whatsapp || "",
      email: next.email || "",
      location: next.location,
      deliveryAreas: next.deliveryAreas || "",
    });
    setMode("returning");
    setEditingProfile(false);
  };

  const submitNewProfile = async () => {
    setProfileError("");
    if (!profileDraft.businessName.trim() || !profileDraft.phone.trim() || !profileDraft.location.trim()) {
      setProfileError("Business name, phone / WhatsApp and main supply location are required.");
      return;
    }
    setProfileBusy(true);
    try {
      const result = await createSupplierProfile({ ...profileDraft, categories: selectedIds });
      saveToken(result.profile);
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Unable to save supplier profile.");
    } finally {
      setProfileBusy(false);
    }
  };

  const recoverProfile = async () => {
    setProfileError("");
    if (!recoverBusiness.trim() || !recoverPhone.trim()) {
      setProfileError("Enter the business name and phone used on your supplier profile.");
      return;
    }
    setProfileBusy(true);
    try {
      saveToken(await recoverSupplierProfile(recoverBusiness, recoverPhone));
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Supplier profile not found.");
    } finally {
      setProfileBusy(false);
    }
  };

  const saveProfileEdits = async () => {
    if (!profile) return;
    setProfileError("");
    setProfileBusy(true);
    try {
      saveToken(await updateSupplierProfile(profile.accessToken, { ...profileDraft, categories: selectedIds }));
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Unable to update supplier profile.");
    } finally {
      setProfileBusy(false);
    }
  };

  const switchSupplier = () => {
    window.localStorage.removeItem(PROFILE_TOKEN_KEY);
    window.localStorage.removeItem(COMPLETED_KEY);
    setProfile(null);
    setProfileDraft(emptyDraft);
    setSelectedIds([]);
    setCompletedIds([]);
    setMode("new");
    setRecoverBusiness("");
    setRecoverPhone("");
    setProfileError("");
  };

  const toggleCategory = async (id: string) => {
    if (!profile) return;
    const next = selectedIds.includes(id)
      ? selectedIds.filter((value) => value !== id)
      : [...selectedIds, id];
    setSelectedIds(next);
    try {
      const updated = await updateSupplierProfile(profile.accessToken, { categories: next });
      setProfile(updated);
    } catch {
      // Keep the selection usable; the next profile save will retry the sync.
    }
  };

  const finishActiveForm = () => {
    if (!activeForm) return;
    setCompletedIds((current) =>
      current.includes(activeForm.id) ? current : [...current, activeForm.id],
    );
    setActiveForm(nextPendingForm);
  };

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] bg-[#071E33] px-5 py-9 text-white shadow-[0_25px_70px_rgba(7,30,51,0.18)] md:px-9 md:py-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(200,164,93,0.24),transparent_28rem)]" />
        <div className="relative max-w-4xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#F2B544]">
            <Store className="h-4 w-4" /> Supplier price update
          </span>
          <h1 className="mt-5 text-4xl font-black leading-tight md:text-6xl">
            Your profile. Your products. Your current prices.
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-white/70 md:text-base">
            Create your Charismak supplier profile once, choose what you sell and update only the price categories that apply to your business.
          </p>
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {[
              ["1", "Create or open your profile"],
              ["2", "Choose what you supply"],
              ["3", "Update current prices"],
            ].map(([number, label]) => (
              <div key={number} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#C8A45D] text-xs font-black text-[#071E33]">{number}</span>
                <span className="text-xs font-bold text-white/85">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-[#DCE4EC] bg-white p-5 shadow-[0_10px_35px_rgba(7,30,51,0.05)] md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#A82B05]">Step 1 · Supplier profile</p>
            <h2 className="mt-2 text-2xl font-black text-[#071E33]">
              {profile ? "Profile ready" : "Tell us who is supplying"}
            </h2>
          </div>
          {!profile ? (
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-[#F3F6F9] p-1.5 md:min-w-[390px]">
              <button type="button" onClick={() => { setMode("new"); setProfileError(""); }} className={`min-h-11 rounded-xl px-4 text-sm font-black transition ${mode === "new" ? "bg-white text-[#071E33] shadow-sm" : "text-[#617286]"}`}>New supplier</button>
              <button type="button" onClick={() => { setMode("returning"); setProfileError(""); }} className={`min-h-11 rounded-xl px-4 text-sm font-black transition ${mode === "returning" ? "bg-[#0D3B66] text-white shadow-sm" : "text-[#617286]"}`}>Returning supplier</button>
            </div>
          ) : null}
        </div>

        {profileBusy && !profile ? (
          <div className="mt-5 rounded-2xl bg-[#F7F9FB] p-5 text-sm text-[#617286]">Checking for a saved supplier profile…</div>
        ) : profile ? (
          <div className="mt-5 rounded-2xl border border-[#CFE4D7] bg-[#F3FBF6] p-5">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex min-w-0 gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#197447] text-white"><UserRound className="h-6 w-6" /></span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-black text-[#071E33]">{profile.businessName}</h3>
                    <span className="rounded-full bg-white px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#197447]">{profile.supplierCode}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#526579]">
                    <span>{profile.phone}</span>
                    {profile.email ? <span>{profile.email}</span> : null}
                    <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-[#A82B05]" />{profile.location}</span>
                  </div>
                  {profile.deliveryAreas ? <p className="mt-2 text-xs text-[#617286]">Delivery areas: {profile.deliveryAreas}</p> : null}
                  <p className="mt-3 text-xs font-bold text-[#197447]">This profile will be linked to your supplier prices after Charismak review.</p>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <button type="button" onClick={() => setEditingProfile((value) => !value)} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#BFD6C8] bg-white px-4 text-xs font-black text-[#071E33]"><Pencil className="h-3.5 w-3.5" />Edit profile</button>
                <button type="button" onClick={switchSupplier} className="min-h-10 rounded-xl px-3 text-xs font-bold text-[#617286] underline underline-offset-4">Switch supplier</button>
              </div>
            </div>

            {editingProfile ? (
              <div className="mt-6 border-t border-[#D8E9DE] pt-5">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Field label="Business / supplier name" required value={profileDraft.businessName} onChange={(value) => setProfileDraft((draft) => ({ ...draft, businessName: value }))} />
                  <Field label="Contact person" value={profileDraft.contactPerson} onChange={(value) => setProfileDraft((draft) => ({ ...draft, contactPerson: value }))} />
                  <Field label="Phone / WhatsApp" required type="tel" value={profileDraft.phone} onChange={(value) => setProfileDraft((draft) => ({ ...draft, phone: value }))} />
                  <Field label="Alternative WhatsApp" type="tel" value={profileDraft.whatsapp} onChange={(value) => setProfileDraft((draft) => ({ ...draft, whatsapp: value }))} />
                  <Field label="Email" type="email" value={profileDraft.email} onChange={(value) => setProfileDraft((draft) => ({ ...draft, email: value }))} />
                  <Field label="Main supply location" required value={profileDraft.location} onChange={(value) => setProfileDraft((draft) => ({ ...draft, location: value }))} />
                </div>
                <div className="mt-4">
                  <Field label="Delivery / service areas" value={profileDraft.deliveryAreas} onChange={(value) => setProfileDraft((draft) => ({ ...draft, deliveryAreas: value }))} placeholder="e.g. Abuja, Nasarawa, Kaduna" />
                </div>
                <button type="button" disabled={profileBusy} onClick={saveProfileEdits} className="mt-4 min-h-11 rounded-xl bg-[#0D3B66] px-5 text-sm font-black text-white disabled:opacity-50">{profileBusy ? "Saving…" : "Save profile changes"}</button>
              </div>
            ) : null}
          </div>
        ) : mode === "new" ? (
          <div className="mt-5">
            <p className="mb-5 max-w-2xl text-sm leading-6 text-[#617286]">Complete this once. Your profile stays connected to the categories and prices you submit.</p>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Field label="Business / supplier name" required value={profileDraft.businessName} onChange={(value) => setProfileDraft((draft) => ({ ...draft, businessName: value }))} placeholder="e.g. ABC Building Materials" />
              <Field label="Contact person" value={profileDraft.contactPerson} onChange={(value) => setProfileDraft((draft) => ({ ...draft, contactPerson: value }))} />
              <Field label="Phone / WhatsApp" required type="tel" value={profileDraft.phone} onChange={(value) => setProfileDraft((draft) => ({ ...draft, phone: value }))} placeholder="080…" />
              <Field label="Alternative WhatsApp" type="tel" value={profileDraft.whatsapp} onChange={(value) => setProfileDraft((draft) => ({ ...draft, whatsapp: value }))} />
              <Field label="Email" type="email" value={profileDraft.email} onChange={(value) => setProfileDraft((draft) => ({ ...draft, email: value }))} />
              <Field label="Main supply location" required value={profileDraft.location} onChange={(value) => setProfileDraft((draft) => ({ ...draft, location: value }))} placeholder="e.g. Abuja / FCT" />
            </div>
            <div className="mt-4 max-w-2xl"><Field label="Delivery / service areas" value={profileDraft.deliveryAreas} onChange={(value) => setProfileDraft((draft) => ({ ...draft, deliveryAreas: value }))} placeholder="e.g. Abuja, Nasarawa, Kaduna" /></div>
            <button type="button" disabled={profileBusy} onClick={submitNewProfile} className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#A82B05] px-6 text-sm font-black text-white transition hover:bg-[#8B1E00] disabled:opacity-50">{profileBusy ? "Saving profile…" : "Save profile & continue"}<ArrowRight className="h-4 w-4" /></button>
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-[#DCE4EC] bg-[#F7F9FB] p-5">
            <p className="max-w-2xl text-sm leading-6 text-[#617286]">Enter the same business name and phone number used when your profile was created. We’ll reopen your saved supplier profile and categories.</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Business / supplier name" required value={recoverBusiness} onChange={setRecoverBusiness} />
              <Field label="Phone / WhatsApp" required type="tel" value={recoverPhone} onChange={setRecoverPhone} />
            </div>
            <button type="button" disabled={profileBusy} onClick={recoverProfile} className="mt-4 min-h-11 rounded-xl bg-[#0D3B66] px-5 text-sm font-black text-white disabled:opacity-50">{profileBusy ? "Opening profile…" : "Open my profile"}</button>
          </div>
        )}

        {profileError ? (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-[#F1C8C0] bg-[#FFF4F1] px-4 py-3 text-sm text-[#8B1E00]"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{profileError}</div>
        ) : null}
      </section>

      <section className={`relative rounded-[2rem] border border-[#DCE4EC] bg-white p-5 shadow-[0_10px_35px_rgba(7,30,51,0.05)] md:p-7 ${profile ? "" : "overflow-hidden"}`}>
        {!profile ? (
          <div className="absolute inset-0 z-10 grid place-items-center bg-white/85 p-6 backdrop-blur-[2px]">
            <div className="max-w-md text-center"><UserRound className="mx-auto h-8 w-8 text-[#7A8B9E]" /><h3 className="mt-3 text-lg font-black text-[#071E33]">Complete your supplier profile first</h3><p className="mt-2 text-sm leading-6 text-[#617286]">Once your profile is saved, your supply categories will unlock here immediately.</p></div>
          </div>
        ) : null}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#A82B05]">Step 2 · Supply categories</p>
            <h2 className="mt-2 text-2xl font-black text-[#071E33]">What do you supply?</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#617286]">Choose all that apply. These categories are saved to {profile?.businessName || "your supplier profile"}.</p>
          </div>
          <label className="relative block w-full lg:max-w-sm">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A8B9E]" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search roofing, PPR, cement, excavator..." className="min-h-12 w-full rounded-xl border border-[#DCE4EC] bg-white pl-11 pr-4 text-sm text-[#071E33] outline-none focus:border-[#0D3B66]" />
          </label>
        </div>
        <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
          <button type="button" onClick={() => setGroup("All")} className={`shrink-0 rounded-full px-4 py-2 text-xs font-black ${group === "All" ? "bg-[#071E33] text-white" : "border border-[#DCE4EC] text-[#617286]"}`}>All categories</button>
          {SUPPLIER_FORM_GROUPS.map((value) => <button key={value} type="button" onClick={() => setGroup(value)} className={`shrink-0 rounded-full px-4 py-2 text-xs font-black ${group === value ? "bg-[#0D3B66] text-white" : "border border-[#DCE4EC] text-[#617286]"}`}>{value}</button>)}
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filteredForms.map((form) => {
            const selected = selectedIds.includes(form.id);
            const completed = completedIds.includes(form.id);
            const Icon = groupIcons[form.group];
            return (
              <button key={form.id} type="button" disabled={!profile} onClick={() => void toggleCategory(form.id)} className={`group flex min-h-[148px] items-start gap-4 rounded-2xl border p-4 text-left transition ${selected ? "border-[#0D3B66] bg-[#F1F6FB] shadow-[inset_0_0_0_1px_#0D3B66]" : "border-[#DCE4EC] bg-white hover:border-[#C8A45D]"}`}>
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${selected ? "bg-[#0D3B66] text-[#F2B544]" : "bg-[#F3F6F9] text-[#A82B05]"}`}><Icon className="h-5 w-5" /></span>
                <span className="min-w-0 flex-1"><span className="flex items-start justify-between gap-2"><strong className="text-sm leading-5 text-[#071E33]">{form.shortTitle}</strong><span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border ${selected ? "border-[#0D3B66] bg-[#0D3B66] text-white" : "border-[#C8D3DE] text-transparent"}`}><Check className="h-3.5 w-3.5" /></span></span><span className="mt-2 block text-xs leading-5 text-[#6F7F90]">{form.audience}</span>{completed ? <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#197447]"><CheckCircle2 className="h-3.5 w-3.5" />Price form completed</span> : null}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-[2rem] bg-[#071E33] p-5 text-white md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#F2B544]">Step 3 · Price update</p><h2 className="mt-2 text-2xl font-black">{!profile ? "Complete Step 1 first" : selectedForms.length ? `${selectedForms.length} categor${selectedForms.length === 1 ? "y" : "ies"} ready` : "Choose at least one category above"}</h2><p className="mt-2 max-w-xl text-sm leading-6 text-white/65">Open each selected category, submit its Google price form, then return here for the next one.</p></div>
          {selectedForms.length > 1 ? <button type="button" onClick={() => { setSelectedIds([]); setCompletedIds([]); if (profile) void updateSupplierProfile(profile.accessToken, { categories: [] }).then(setProfile).catch(() => undefined); }} className="text-xs font-bold text-white/60 underline underline-offset-4">Clear categories</button> : null}
        </div>
        {profile && selectedForms.length ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {selectedForms.map((form, index) => {
              const completed = completedIds.includes(form.id);
              return <button key={form.id} type="button" onClick={() => setActiveForm(form)} className={`flex min-h-16 items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left text-[#071E33] ${completed ? "bg-[#E9F8F1]" : "bg-white hover:bg-[#FFF9ED]"}`}><span className="flex min-w-0 items-center gap-3"><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-black ${completed ? "bg-[#197447] text-white" : "bg-[#F2B544]"}`}>{completed ? <Check className="h-4 w-4" /> : index + 1}</span><span className="text-sm font-black leading-5">{form.shortTitle}</span></span><ArrowRight className="h-4 w-4 shrink-0 text-[#A82B05]" /></button>;
            })}
          </div>
        ) : null}
      </section>

      {activeUrl && activeForm && profile ? (
        <div className="fixed inset-0 z-[140] bg-[#071E33]/70 p-0 backdrop-blur-sm md:p-4">
          <div className="mx-auto flex h-full max-w-6xl flex-col overflow-hidden bg-white shadow-2xl md:rounded-2xl">
            <header className="flex min-h-16 shrink-0 items-center justify-between gap-3 border-b border-[#DCE4EC] bg-white px-4 md:px-5">
              <div className="min-w-0"><span className="block text-[9px] font-black uppercase tracking-[0.14em] text-[#A82B05]">{profile.businessName} · {profile.supplierCode}</span><strong className="block truncate text-sm text-[#071E33] md:text-base">{activeForm.shortTitle}</strong></div>
              <div className="flex items-center gap-2"><a href={activeUrl} target="_blank" rel="noreferrer" className="hidden min-h-10 items-center gap-2 rounded-lg border border-[#DCE4EC] px-3 text-xs font-black text-[#0D3B66] sm:inline-flex">Open separately <ExternalLink className="h-3.5 w-3.5" /></a><button type="button" onClick={() => setActiveForm(null)} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#071E33] px-3 text-xs font-black text-white"><ArrowLeft className="h-4 w-4" /><span className="hidden sm:inline">Back to categories</span><X className="h-4 w-4 sm:hidden" /></button></div>
            </header>
            <div className="shrink-0 border-b border-[#E4EAF0] bg-[#FFF9ED] px-4 py-2 text-[11px] text-[#526579] md:px-5">Use the same supplier name and phone shown above in the Google Form. Your response will be matched back to this profile for review.</div>
            <iframe src={embeddedUrl(activeUrl)} title={activeForm.shortTitle} className="min-h-0 flex-1 border-0 bg-[#F4F2FF]" loading="eager" />
            <footer className="shrink-0 border-t border-[#DCE4EC] bg-white px-3 py-3 shadow-[0_-8px_24px_rgba(7,30,51,0.08)] sm:px-5"><div className="mx-auto flex max-w-5xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><p className="text-[11px] leading-5 text-[#617286] sm:text-xs">After Google confirms the response was submitted, continue here. Charismak will receive it for review before the supplier price is listed publicly.</p><button type="button" onClick={finishActiveForm} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#A82B05] px-5 text-sm font-black text-white"><CheckCircle2 className="h-4 w-4" />{nextPendingForm ? "Submitted — next category" : "Submitted — back to categories"}</button></div></footer>
          </div>
        </div>
      ) : null}
    </div>
  );
}
