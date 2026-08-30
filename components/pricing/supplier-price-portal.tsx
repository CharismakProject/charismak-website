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
  Zap,
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
type AccessPath = "profile" | "quick";
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
    <label className="block min-w-0">
      <span className="mb-2 block text-xs font-black text-[#071E33]">
        {label}{required ? " *" : ""}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-12 w-full min-w-0 rounded-xl border border-[#DCE4EC] bg-white px-4 text-base text-[#071E33] outline-none transition focus:border-[#0D3B66] focus:ring-2 focus:ring-[#0D3B66]/10 sm:text-sm"
      />
    </label>
  );
}

export default function SupplierPricePortal() {
  const [accessPath, setAccessPath] = useState<AccessPath>("profile");
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
  const [activeFormUrl, setActiveFormUrl] = useState<string | null>(null);
  const [formBusy, setFormBusy] = useState(false);
  const [prefillReady, setPrefillReady] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    const restore = async () => {
      try {
        const storedCompleted = window.localStorage.getItem(COMPLETED_KEY);
        if (storedCompleted) {
          const parsed = JSON.parse(storedCompleted) as string[];
          if (Array.isArray(parsed)) {
            setCompletedIds(
              parsed.filter((id) => SUPPLIER_FORMS.some((form) => form.id === id)),
            );
          }
        }

        const token = window.localStorage.getItem(PROFILE_TOKEN_KEY);
        if (!token) return;
        const restored = await getSupplierProfile(token);
        if (cancelled) return;

        setProfile(restored);
        setAccessPath("profile");
        setSelectedIds(
          restored.categories.filter((id) => SUPPLIER_FORMS.some((form) => form.id === id)),
        );
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
      // Browser-only convenience. Submission records live in the backend.
    }
  }, [completedIds]);

  const canChooseCategories = accessPath === "quick" || Boolean(profile);

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

  const nextPendingForm = activeForm
    ? selectedForms.find(
        (form) => form.id !== activeForm.id && !completedIds.includes(form.id),
      ) ?? null
    : null;

  const saveToken = (next: SupplierProfile) => {
    window.localStorage.setItem(PROFILE_TOKEN_KEY, next.accessToken);
    setProfile(next);
    setAccessPath("profile");
    setSelectedIds(
      next.categories.filter((id) => SUPPLIER_FORMS.some((form) => form.id === id)),
    );
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

  const chooseAccessPath = (path: AccessPath) => {
    setAccessPath(path);
    setProfileError("");
    setActiveForm(null);
    setActiveFormUrl(null);
    if (path === "profile" && profile) {
      setSelectedIds(
        profile.categories.filter((id) => SUPPLIER_FORMS.some((form) => form.id === id)),
      );
    }
  };

  const submitNewProfile = async () => {
    setProfileError("");
    if (
      !profileDraft.businessName.trim()
      || !profileDraft.phone.trim()
      || !profileDraft.location.trim()
    ) {
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
      saveToken(
        await updateSupplierProfile(profile.accessToken, {
          ...profileDraft,
          categories: selectedIds,
        }),
      );
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
    setAccessPath("profile");
    setMode("new");
    setRecoverBusiness("");
    setRecoverPhone("");
    setProfileError("");
  };

  const toggleCategory = async (id: string) => {
    if (!canChooseCategories) return;

    const next = selectedIds.includes(id)
      ? selectedIds.filter((value) => value !== id)
      : [...selectedIds, id];
    setSelectedIds(next);

    if (accessPath === "profile" && profile) {
      try {
        const updated = await updateSupplierProfile(profile.accessToken, { categories: next });
        setProfile(updated);
      } catch {
        // Keep the local selection usable. A later profile save retries the sync.
      }
    }
  };

  const clearCategories = () => {
    setSelectedIds([]);
    setCompletedIds([]);
    if (accessPath === "profile" && profile) {
      void updateSupplierProfile(profile.accessToken, { categories: [] })
        .then(setProfile)
        .catch(() => undefined);
    }
  };

  const openPriceForm = async (form: SupplierFormDefinition) => {
    setActiveForm(form);
    setActiveFormUrl(null);
    setPrefillReady(null);
    setFormBusy(true);

    if (accessPath === "profile" && profile) {
      try {
        const response = await fetch("/api/supplier-form-prefill", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            formId: form.id,
            businessName: profile.businessName,
            phone: profile.phone,
            location: profile.location,
          }),
        });
        const data = await response.json() as { url?: string; prefillReady?: boolean };
        setActiveFormUrl(data.url || form.formUrl);
        setPrefillReady(Boolean(data.prefillReady));
      } catch {
        setActiveFormUrl(form.formUrl);
        setPrefillReady(false);
      } finally {
        setFormBusy(false);
      }
      return;
    }

    setActiveFormUrl(form.formUrl);
    setPrefillReady(null);
    setFormBusy(false);
  };

  const closeActiveForm = () => {
    setActiveForm(null);
    setActiveFormUrl(null);
    setPrefillReady(null);
  };

  const finishActiveForm = () => {
    if (!activeForm) return;
    setCompletedIds((current) =>
      current.includes(activeForm.id) ? current : [...current, activeForm.id],
    );

    if (nextPendingForm) {
      void openPriceForm(nextPendingForm);
    } else {
      closeActiveForm();
    }
  };

  return (
    <div className="min-w-0 space-y-5 overflow-x-hidden sm:space-y-8">
      <section className="relative overflow-hidden rounded-[1.4rem] bg-[#071E33] px-4 py-7 text-white shadow-[0_25px_70px_rgba(7,30,51,0.18)] sm:rounded-[2rem] sm:px-6 sm:py-9 md:px-9 md:py-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(200,164,93,0.24),transparent_28rem)]" />
        <div className="relative max-w-4xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#F2B544]">
            <Store className="h-4 w-4" /> Supplier price update
          </span>
          <h1 className="mt-4 text-3xl font-black leading-[1.08] sm:mt-5 sm:text-4xl md:text-6xl">
            Send current prices your way.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-white/72 sm:mt-5 sm:leading-7 md:text-base">
            Regular suppliers can keep a reusable Charismak profile. Anyone can also send a quick price update without creating a profile.
          </p>
        </div>
      </section>

      <section className="rounded-[1.4rem] border border-[#DCE4EC] bg-white p-4 shadow-[0_10px_35px_rgba(7,30,51,0.05)] sm:rounded-[2rem] sm:p-6 md:p-7">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#A82B05]">Choose how to continue</p>
          <h2 className="mt-2 text-2xl font-black text-[#071E33]">Profile or quick update?</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#617286]">Both routes reach the same Charismak price review. A profile simply makes repeat updates faster.</p>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <button
            type="button"
            onClick={() => chooseAccessPath("profile")}
            className={`flex min-h-[112px] items-start gap-4 rounded-2xl border p-4 text-left transition sm:p-5 ${accessPath === "profile" ? "border-[#0D3B66] bg-[#F1F6FB] shadow-[inset_0_0_0_1px_#0D3B66]" : "border-[#DCE4EC] bg-white hover:border-[#0D3B66]"}`}
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#0D3B66] text-[#F2B544]"><UserRound className="h-5 w-5" /></span>
            <span className="min-w-0">
              <strong className="block text-base text-[#071E33]">Use supplier profile</strong>
              <span className="mt-1.5 block text-xs leading-5 text-[#617286]">Best for regular suppliers. Save business details once, keep your categories and avoid retyping identity details.</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => chooseAccessPath("quick")}
            className={`flex min-h-[112px] items-start gap-4 rounded-2xl border p-4 text-left transition sm:p-5 ${accessPath === "quick" ? "border-[#A82B05] bg-[#FFF5F1] shadow-[inset_0_0_0_1px_#A82B05]" : "border-[#DCE4EC] bg-white hover:border-[#A82B05]"}`}
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#A82B05] text-white"><Zap className="h-5 w-5" /></span>
            <span className="min-w-0">
              <strong className="block text-base text-[#071E33]">Quick price update</strong>
              <span className="mt-1.5 block text-xs leading-5 text-[#617286]">No profile required. Choose a category and enter your supplier details directly in the price form.</span>
            </span>
          </button>
        </div>
      </section>

      {accessPath === "profile" ? (
        <section className="rounded-[1.4rem] border border-[#DCE4EC] bg-white p-4 shadow-[0_10px_35px_rgba(7,30,51,0.05)] sm:rounded-[2rem] sm:p-6 md:p-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#A82B05]">Step 1 · Supplier profile</p>
              <h2 className="mt-2 text-2xl font-black text-[#071E33]">{profile ? "Profile ready" : "Create or open your profile"}</h2>
            </div>
            {!profile ? (
              <div className="grid w-full grid-cols-2 gap-1.5 rounded-2xl bg-[#F3F6F9] p-1.5 md:w-auto md:min-w-[390px]">
                <button type="button" onClick={() => { setMode("new"); setProfileError(""); }} className={`min-h-11 rounded-xl px-3 text-sm font-black transition sm:px-4 ${mode === "new" ? "bg-white text-[#071E33] shadow-sm" : "text-[#617286]"}`}>New supplier</button>
                <button type="button" onClick={() => { setMode("returning"); setProfileError(""); }} className={`min-h-11 rounded-xl px-3 text-sm font-black transition sm:px-4 ${mode === "returning" ? "bg-[#0D3B66] text-white shadow-sm" : "text-[#617286]"}`}>Returning supplier</button>
              </div>
            ) : null}
          </div>

          {profileBusy && !profile ? (
            <div className="mt-5 rounded-2xl bg-[#F7F9FB] p-5 text-sm text-[#617286]">Checking for a saved supplier profile…</div>
          ) : profile ? (
            <div className="mt-5 rounded-2xl border border-[#CFE4D7] bg-[#F3FBF6] p-4 sm:p-5">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex min-w-0 gap-3 sm:gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#197447] text-white sm:h-12 sm:w-12"><UserRound className="h-5 w-5 sm:h-6 sm:w-6" /></span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="break-words text-lg font-black text-[#071E33] sm:text-xl">{profile.businessName}</h3>
                      <span className="rounded-full bg-white px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#197447]">{profile.supplierCode}</span>
                    </div>
                    <div className="mt-3 flex flex-col gap-1.5 text-xs text-[#526579] sm:flex-row sm:flex-wrap sm:gap-x-5 sm:gap-y-2">
                      <span className="break-all sm:break-normal">{profile.phone}</span>
                      {profile.email ? <span className="break-all">{profile.email}</span> : null}
                      <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 shrink-0 text-[#A82B05]" />{profile.location}</span>
                    </div>
                    {profile.deliveryAreas ? <p className="mt-2 text-xs leading-5 text-[#617286]">Delivery areas: {profile.deliveryAreas}</p> : null}
                    <p className="mt-3 text-xs font-bold leading-5 text-[#197447]">Your saved name, phone and location will be filled into supported price forms automatically.</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                  <button type="button" onClick={() => setEditingProfile((value) => !value)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#BFD6C8] bg-white px-3 text-xs font-black text-[#071E33] sm:px-4"><Pencil className="h-3.5 w-3.5" />Edit profile</button>
                  <button type="button" onClick={switchSupplier} className="min-h-11 rounded-xl px-3 text-xs font-bold text-[#617286] underline underline-offset-4">Switch supplier</button>
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
                  <div className="mt-4"><Field label="Delivery / service areas" value={profileDraft.deliveryAreas} onChange={(value) => setProfileDraft((draft) => ({ ...draft, deliveryAreas: value }))} placeholder="e.g. Abuja, Nasarawa, Kaduna" /></div>
                  <button type="button" disabled={profileBusy} onClick={saveProfileEdits} className="mt-4 min-h-12 w-full rounded-xl bg-[#0D3B66] px-5 text-sm font-black text-white disabled:opacity-50 sm:w-auto">{profileBusy ? "Saving…" : "Save profile changes"}</button>
                </div>
              ) : null}
            </div>
          ) : mode === "new" ? (
            <div className="mt-5">
              <p className="mb-5 max-w-2xl text-sm leading-6 text-[#617286]">Complete this once. Your profile will stay connected to future price updates.</p>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Field label="Business / supplier name" required value={profileDraft.businessName} onChange={(value) => setProfileDraft((draft) => ({ ...draft, businessName: value }))} placeholder="e.g. ABC Building Materials" />
                <Field label="Contact person" value={profileDraft.contactPerson} onChange={(value) => setProfileDraft((draft) => ({ ...draft, contactPerson: value }))} />
                <Field label="Phone / WhatsApp" required type="tel" value={profileDraft.phone} onChange={(value) => setProfileDraft((draft) => ({ ...draft, phone: value }))} placeholder="080…" />
                <Field label="Alternative WhatsApp" type="tel" value={profileDraft.whatsapp} onChange={(value) => setProfileDraft((draft) => ({ ...draft, whatsapp: value }))} />
                <Field label="Email" type="email" value={profileDraft.email} onChange={(value) => setProfileDraft((draft) => ({ ...draft, email: value }))} />
                <Field label="Main supply location" required value={profileDraft.location} onChange={(value) => setProfileDraft((draft) => ({ ...draft, location: value }))} placeholder="e.g. Abuja / FCT" />
              </div>
              <div className="mt-4"><Field label="Delivery / service areas" value={profileDraft.deliveryAreas} onChange={(value) => setProfileDraft((draft) => ({ ...draft, deliveryAreas: value }))} placeholder="e.g. Abuja, Nasarawa, Kaduna" /></div>
              <button type="button" disabled={profileBusy} onClick={submitNewProfile} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#A82B05] px-6 text-sm font-black text-white transition hover:bg-[#8B1E00] disabled:opacity-50 sm:w-auto">{profileBusy ? "Saving profile…" : "Save profile & continue"}<ArrowRight className="h-4 w-4" /></button>
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-[#DCE4EC] bg-[#F7F9FB] p-4 sm:p-5">
              <p className="max-w-2xl text-sm leading-6 text-[#617286]">Enter the business name and phone used on the saved profile. We’ll reopen the supplier details and categories.</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Field label="Business / supplier name" required value={recoverBusiness} onChange={setRecoverBusiness} />
                <Field label="Phone / WhatsApp" required type="tel" value={recoverPhone} onChange={setRecoverPhone} />
              </div>
              <button type="button" disabled={profileBusy} onClick={recoverProfile} className="mt-4 min-h-12 w-full rounded-xl bg-[#0D3B66] px-5 text-sm font-black text-white disabled:opacity-50 sm:w-auto">{profileBusy ? "Opening profile…" : "Open my profile"}</button>
            </div>
          )}

          {profileError ? (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-[#F1C8C0] bg-[#FFF4F1] px-4 py-3 text-sm text-[#8B1E00]"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{profileError}</div>
          ) : null}
        </section>
      ) : (
        <section className="rounded-[1.4rem] border border-[#F1D5CB] bg-[#FFF8F5] p-4 sm:rounded-[2rem] sm:p-6 md:p-7">
          <div className="flex items-start gap-3 sm:gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#A82B05] text-white"><Zap className="h-5 w-5" /></span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#A82B05]">Quick update</p>
              <h2 className="mt-1 text-xl font-black text-[#071E33] sm:text-2xl">No supplier profile needed</h2>
              <p className="mt-2 text-sm leading-6 text-[#617286]">Go straight to the category you want to price. The Google Form will ask for your business name, phone and location so we can identify the supplier.</p>
            </div>
          </div>
        </section>
      )}

      <section className={`relative rounded-[1.4rem] border border-[#DCE4EC] bg-white p-4 shadow-[0_10px_35px_rgba(7,30,51,0.05)] sm:rounded-[2rem] sm:p-6 md:p-7 ${canChooseCategories ? "" : "overflow-hidden"}`}>
        {!canChooseCategories ? (
          <div className="absolute inset-0 z-10 grid place-items-center bg-white/88 p-6 backdrop-blur-[2px]">
            <div className="max-w-md text-center">
              <UserRound className="mx-auto h-8 w-8 text-[#7A8B9E]" />
              <h3 className="mt-3 text-lg font-black text-[#071E33]">Save or open your profile first</h3>
              <p className="mt-2 text-sm leading-6 text-[#617286]">Or choose Quick price update above to continue without a profile.</p>
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#A82B05]">{accessPath === "profile" ? "Step 2" : "Step 1"} · Supply categories</p>
            <h2 className="mt-2 text-2xl font-black text-[#071E33]">What do you supply?</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#617286]">{accessPath === "profile" && profile ? `Choose all that apply. These categories are saved to ${profile.businessName}.` : "Choose only the category or categories you want to update now."}</p>
          </div>
          <label className="relative block w-full lg:max-w-sm">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A8B9E]" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search cement, roofing, PPR..." className="min-h-12 w-full rounded-xl border border-[#DCE4EC] bg-white pl-11 pr-4 text-base text-[#071E33] outline-none focus:border-[#0D3B66] sm:text-sm" />
          </label>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" onClick={() => setGroup("All")} className={`rounded-full px-3 py-2 text-[11px] font-black sm:px-4 sm:text-xs ${group === "All" ? "bg-[#071E33] text-white" : "border border-[#DCE4EC] text-[#617286]"}`}>All categories</button>
          {SUPPLIER_FORM_GROUPS.map((value) => (
            <button key={value} type="button" onClick={() => setGroup(value)} className={`rounded-full px-3 py-2 text-[11px] font-black sm:px-4 sm:text-xs ${group === value ? "bg-[#0D3B66] text-white" : "border border-[#DCE4EC] text-[#617286]"}`}>{value}</button>
          ))}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filteredForms.map((form) => {
            const selected = selectedIds.includes(form.id);
            const completed = completedIds.includes(form.id);
            const Icon = groupIcons[form.group];
            return (
              <button
                key={form.id}
                type="button"
                disabled={!canChooseCategories}
                onClick={() => void toggleCategory(form.id)}
                className={`group flex min-h-[124px] items-start gap-3 rounded-2xl border p-4 text-left transition sm:min-h-[148px] sm:gap-4 ${selected ? "border-[#0D3B66] bg-[#F1F6FB] shadow-[inset_0_0_0_1px_#0D3B66]" : "border-[#DCE4EC] bg-white hover:border-[#C8A45D]"}`}
              >
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl sm:h-11 sm:w-11 ${selected ? "bg-[#0D3B66] text-[#F2B544]" : "bg-[#F3F6F9] text-[#A82B05]"}`}><Icon className="h-5 w-5" /></span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-start justify-between gap-2">
                    <strong className="text-sm leading-5 text-[#071E33]">{form.shortTitle}</strong>
                    <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border ${selected ? "border-[#0D3B66] bg-[#0D3B66] text-white" : "border-[#C8D3DE] text-transparent"}`}><Check className="h-3.5 w-3.5" /></span>
                  </span>
                  <span className="mt-2 block text-xs leading-5 text-[#6F7F90]">{form.audience}</span>
                  {completed ? <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.1em] text-[#197447]"><CheckCircle2 className="h-3.5 w-3.5" />Price form completed</span> : null}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-[1.4rem] bg-[#071E33] p-4 text-white sm:rounded-[2rem] sm:p-6 md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#F2B544]">{accessPath === "profile" ? "Step 3" : "Step 2"} · Price update</p>
            <h2 className="mt-2 text-xl font-black sm:text-2xl">{!canChooseCategories ? "Complete the profile first" : selectedForms.length ? `${selectedForms.length} categor${selectedForms.length === 1 ? "y" : "ies"} ready` : "Choose at least one category above"}</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/65">{accessPath === "profile" ? "Open a category. Your saved supplier identity will be carried into the form where supported." : "Open a category and enter the basic supplier details requested in the form."}</p>
          </div>
          {selectedForms.length > 1 ? <button type="button" onClick={clearCategories} className="min-h-11 self-start text-xs font-bold text-white/65 underline underline-offset-4 md:self-auto">Clear categories</button> : null}
        </div>

        {canChooseCategories && selectedForms.length ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {selectedForms.map((form, index) => {
              const completed = completedIds.includes(form.id);
              return (
                <button key={form.id} type="button" onClick={() => void openPriceForm(form)} className={`flex min-h-16 w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left text-[#071E33] ${completed ? "bg-[#E9F8F1]" : "bg-white hover:bg-[#FFF9ED]"}`}>
                  <span className="flex min-w-0 items-center gap-3"><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-black ${completed ? "bg-[#197447] text-white" : "bg-[#F2B544]"}`}>{completed ? <Check className="h-4 w-4" /> : index + 1}</span><span className="text-sm font-black leading-5">{form.shortTitle}</span></span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-[#A82B05]" />
                </button>
              );
            })}
          </div>
        ) : null}
      </section>

      {activeForm ? (
        <div className="fixed inset-0 z-[140] bg-[#071E33]/75 p-0 backdrop-blur-sm md:p-4">
          <div className="mx-auto flex h-[100dvh] w-full max-w-6xl flex-col overflow-hidden bg-white shadow-2xl md:h-[calc(100dvh-2rem)] md:rounded-2xl">
            <header className="flex min-h-16 shrink-0 items-center justify-between gap-2 border-b border-[#DCE4EC] bg-white px-3 pt-[env(safe-area-inset-top)] sm:gap-3 sm:px-5">
              <div className="min-w-0 py-2">
                <span className="block truncate text-[9px] font-black uppercase tracking-[0.12em] text-[#A82B05]">{accessPath === "profile" && profile ? `${profile.businessName} · ${profile.supplierCode}` : "Quick price update"}</span>
                <strong className="block truncate text-sm text-[#071E33] sm:text-base">{activeForm.shortTitle}</strong>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {activeFormUrl ? <a href={activeFormUrl} target="_blank" rel="noreferrer" aria-label="Open form separately" className="hidden min-h-11 items-center gap-2 rounded-lg border border-[#DCE4EC] px-3 text-xs font-black text-[#0D3B66] sm:inline-flex">Open separately <ExternalLink className="h-3.5 w-3.5" /></a> : null}
                <button type="button" onClick={closeActiveForm} className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-lg bg-[#071E33] px-3 text-xs font-black text-white"><ArrowLeft className="hidden h-4 w-4 sm:block" /><span className="hidden sm:inline">Back to categories</span><X className="h-5 w-5 sm:hidden" /></button>
              </div>
            </header>

            <div className={`shrink-0 border-b px-3 py-2 text-[11px] leading-5 sm:px-5 ${accessPath === "profile" ? "border-[#D8E9DE] bg-[#F3FBF6] text-[#456757]" : "border-[#E4EAF0] bg-[#FFF9ED] text-[#526579]"}`}>
              {accessPath === "profile" && profile
                ? prefillReady === false
                  ? "Your profile is linked, but Google could not prefill this form automatically. Please confirm the supplier details shown in the form."
                  : "Your saved supplier details are being filled into the form. Check them, then continue to the price questions."
                : "No profile required. Enter your business name, phone and location in this form, then continue to your prices."}
            </div>

            {formBusy || !activeFormUrl ? (
              <div className="grid min-h-0 flex-1 place-items-center bg-[#F6F7FB] p-6 text-center">
                <div><div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-[#DCE4EC] border-t-[#0D3B66]" /><p className="mt-3 text-sm font-bold text-[#617286]">Preparing your price form…</p></div>
              </div>
            ) : (
              <iframe src={embeddedUrl(activeFormUrl)} title={activeForm.shortTitle} className="min-h-0 w-full flex-1 border-0 bg-[#F4F2FF]" loading="eager" />
            )}

            <footer className="shrink-0 border-t border-[#DCE4EC] bg-white px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(7,30,51,0.08)] sm:px-5 sm:py-3">
              <div className="mx-auto flex max-w-5xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="hidden text-[11px] leading-5 text-[#617286] sm:block sm:text-xs">After Google confirms submission, use the button here to continue. The price will still go through Charismak review before it is listed.</p>
                <button type="button" onClick={finishActiveForm} disabled={formBusy} className="inline-flex min-h-12 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-[#A82B05] px-5 text-sm font-black text-white disabled:opacity-50 sm:w-auto"><CheckCircle2 className="h-4 w-4" />{nextPendingForm ? "Submitted — next category" : "Submitted — back to categories"}</button>
              </div>
            </footer>
          </div>
        </div>
      ) : null}
    </div>
  );
}
