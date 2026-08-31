"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { KeyRound, Loader2, MessageCircle, RefreshCw, Save, Search, ShieldCheck, Store } from "lucide-react";

import { isAdminEmail } from "@/lib/auth/admin";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type SupplierStatus = "active" | "inactive" | "blocked";

type SupplierRow = {
  id: string;
  supplier_code: string;
  business_name: string;
  contact_person: string | null;
  phone: string;
  whatsapp: string | null;
  email: string | null;
  location: string;
  delivery_areas: string | null;
  categories: string[] | null;
  status: SupplierStatus;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
};

const whatsappHref = (profile: SupplierRow) => {
  const digits = (profile.whatsapp || profile.phone || "").replace(/\D/g, "").replace(/^0/, "234");
  const message = `Hello ${profile.business_name}, Charismak Project is contacting you about supplier account ${profile.supplier_code}.`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
};

export default function SupplierProfileManager() {
  const client = useMemo(() => getSupabaseBrowserClient(), []);
  const [auth, setAuth] = useState<"checking" | "ready" | "forbidden">("checking");
  const [profiles, setProfiles] = useState<SupplierRow[]>([]);
  const [selected, setSelected] = useState<SupplierRow | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    setError("");
    const { data, error: loadError } = await client
      .from("supplier_profiles")
      .select("id,supplier_code,business_name,contact_person,phone,whatsapp,email,location,delivery_areas,categories,status,created_at,updated_at,last_login_at")
      .order("updated_at", { ascending: false });
    setLoading(false);
    if (loadError) {
      setError(loadError.message);
      return;
    }
    const rows = (data || []) as SupplierRow[];
    setProfiles(rows);
    setSelected((current) => current ? rows.find((row) => row.id === current.id) || null : rows[0] || null);
  }, [client]);

  useEffect(() => {
    if (!client) {
      setAuth("forbidden");
      setLoading(false);
      return;
    }
    let mounted = true;
    void client.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      if (!data.session || !isAdminEmail(data.session.user.email)) {
        setAuth("forbidden");
        setLoading(false);
        return;
      }
      setAuth("ready");
      await load();
    });
    return () => { mounted = false; };
  }, [client, load]);

  const visible = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return profiles;
    return profiles.filter((profile) => [profile.business_name, profile.supplier_code, profile.phone, profile.whatsapp, profile.email, profile.location, ...(profile.categories || [])].filter(Boolean).join(" ").toLowerCase().includes(value));
  }, [profiles, query]);

  const save = async () => {
    if (!client || !selected) return;
    if (!selected.business_name.trim() || !selected.phone.trim() || !selected.location.trim()) {
      setError("Business name, phone and location are required.");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    const { error: saveError } = await client.from("supplier_profiles").update({
      business_name: selected.business_name.trim(),
      contact_person: selected.contact_person?.trim() || null,
      phone: selected.phone.trim(),
      whatsapp: selected.whatsapp?.trim() || selected.phone.trim(),
      email: selected.email?.trim() || null,
      location: selected.location.trim(),
      delivery_areas: selected.delivery_areas?.trim() || null,
      categories: selected.categories || [],
      status: selected.status,
      updated_at: new Date().toISOString(),
    }).eq("id", selected.id);
    setBusy(false);
    if (saveError) {
      setError(saveError.message);
      return;
    }
    setMessage("Supplier profile saved.");
    await load();
  };

  const releasePin = async () => {
    if (!client || !selected) return;
    if (!window.confirm(`Release the PIN for ${selected.business_name}? Do this only after verifying the supplier's registered WhatsApp or phone number.`)) return;
    setBusy(true);
    setError("");
    setMessage("");
    const { error: resetError } = await client.from("supplier_profiles").update({
      account_pin_hash: null,
      account_pin_salt: null,
      login_failed_attempts: 0,
      login_locked_until: null,
      updated_at: new Date().toISOString(),
    }).eq("id", selected.id);
    setBusy(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setMessage("PIN released. Ask the verified supplier to use Returning Supplier and enter a new 4–6 digit PIN.");
  };

  if (auth === "checking") return <div className="mx-auto grid min-h-[260px] max-w-7xl place-items-center px-4"><Loader2 className="h-7 w-7 animate-spin text-[#0D3B66]" /></div>;
  if (auth === "forbidden") return <section className="mx-auto max-w-3xl px-4 py-14 text-center"><ShieldCheck className="mx-auto h-9 w-9 text-[#A82B05]" /><h1 className="mt-4 text-2xl font-black text-[#071E33]">Administrator access required</h1><p className="mt-3 text-sm leading-6 text-[#617286]">Sign in from the Admin Control Centre with an authorised Charismak account, then return to Supplier Profiles.</p></section>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#A82B05]">Supplier administration</p><h1 className="mt-2 text-3xl font-black text-[#071E33]">Supplier Profiles</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-[#617286]">Review and update supplier account details, directory status and verified PIN-recovery requests.</p></div>
        <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#DCE4EC] bg-white px-4 text-xs font-black text-[#0D3B66]"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />Refresh</button>
      </div>

      {message ? <p className="mt-5 rounded-xl border border-[#BFE2CD] bg-[#F0FAF4] p-4 text-sm text-[#17613C]">{message}</p> : null}
      {error ? <p className="mt-5 rounded-xl border border-[#F0C4BA] bg-[#FFF4F1] p-4 text-sm text-[#8B1E00]">{error}</p> : null}

      <div className="mt-7 grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
        <section className="rounded-[1.5rem] border border-[#DCE4EC] bg-white p-4">
          <label className="relative block"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A8B9E]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search supplier, phone, location…" className="min-h-12 w-full rounded-xl border border-[#DCE4EC] pl-11 pr-4 text-sm outline-none focus:border-[#0D3B66]" /></label>
          <div className="mt-3 max-h-[690px] space-y-2 overflow-y-auto pr-1">
            {visible.map((profile) => <button key={profile.id} type="button" onClick={() => { setSelected(profile); setMessage(""); setError(""); }} className={`w-full rounded-xl border p-3 text-left ${selected?.id === profile.id ? "border-[#0D3B66] bg-[#F1F6FB]" : "border-[#E3E9EF] bg-white"}`}><div className="flex items-start justify-between gap-3"><div><strong className="block text-sm text-[#071E33]">{profile.business_name}</strong><span className="mt-1 block text-xs text-[#617286]">{profile.supplier_code} · {profile.location}</span></div><span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase ${profile.status === "active" ? "bg-[#EAF8F0] text-[#197447]" : profile.status === "blocked" ? "bg-[#FFF0EC] text-[#A82B05]" : "bg-[#F1F3F5] text-[#617286]"}`}>{profile.status}</span></div></button>)}
            {!loading && !visible.length ? <p className="p-5 text-center text-sm text-[#617286]">No supplier profile matches this search.</p> : null}
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-[#DCE4EC] bg-white p-5 sm:p-7">
          {selected ? <>
            <div className="flex flex-col gap-3 border-b border-[#E5EAF0] pb-5 sm:flex-row sm:items-start sm:justify-between"><div><span className="inline-flex items-center gap-2 text-xs font-black text-[#A82B05]"><Store className="h-4 w-4" />{selected.supplier_code}</span><h2 className="mt-2 text-2xl font-black text-[#071E33]">{selected.business_name}</h2><p className="mt-1 text-xs text-[#617286]">Created {new Date(selected.created_at).toLocaleDateString("en-NG")} · Last login {selected.last_login_at ? new Date(selected.last_login_at).toLocaleDateString("en-NG") : "not recorded"}</p></div><a href={whatsappHref(selected)} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#197447] px-4 text-xs font-black text-white"><MessageCircle className="h-4 w-4" />WhatsApp supplier</a></div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Business name *" value={selected.business_name} onChange={(value) => setSelected({ ...selected, business_name: value })} />
              <Field label="Contact person" value={selected.contact_person || ""} onChange={(value) => setSelected({ ...selected, contact_person: value })} />
              <Field label="Phone *" value={selected.phone} onChange={(value) => setSelected({ ...selected, phone: value })} />
              <Field label="WhatsApp" value={selected.whatsapp || ""} onChange={(value) => setSelected({ ...selected, whatsapp: value })} />
              <Field label="Email (optional)" value={selected.email || ""} onChange={(value) => setSelected({ ...selected, email: value })} />
              <Field label="Main location *" value={selected.location} onChange={(value) => setSelected({ ...selected, location: value })} />
              <div className="sm:col-span-2"><Field label="Delivery / service areas" value={selected.delivery_areas || ""} onChange={(value) => setSelected({ ...selected, delivery_areas: value })} /></div>
              <div className="sm:col-span-2"><Field label="Categories (comma separated)" value={(selected.categories || []).join(", ")} onChange={(value) => setSelected({ ...selected, categories: value.split(",").map((entry) => entry.trim()).filter(Boolean) })} /></div>
              <label className="block"><span className="mb-2 block text-xs font-black text-[#071E33]">Directory status</span><select value={selected.status} onChange={(event) => setSelected({ ...selected, status: event.target.value as SupplierStatus })} className="min-h-12 w-full rounded-xl border border-[#DCE4EC] bg-white px-4 text-sm outline-none focus:border-[#0D3B66]"><option value="active">Active</option><option value="inactive">Inactive</option><option value="blocked">Blocked</option></select></label>
            </div>
            <div className="mt-6 flex flex-col gap-3 border-t border-[#E5EAF0] pt-5 sm:flex-row sm:flex-wrap"><button type="button" onClick={() => void save()} disabled={busy} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#0D3B66] px-5 text-sm font-black text-white disabled:opacity-50">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Save supplier</button><button type="button" onClick={() => void releasePin()} disabled={busy} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#E2B6AC] px-5 text-sm font-black text-[#A82B05] disabled:opacity-50"><KeyRound className="h-4 w-4" />Release forgotten PIN</button></div>
            <p className="mt-3 text-xs leading-5 text-[#617286]">For PIN recovery, first confirm the request from the registered WhatsApp or phone number. Releasing the PIN lets the supplier choose a new one on their next sign-in; it does not reveal the old PIN.</p>
          </> : <div className="grid min-h-[360px] place-items-center text-center"><div><Store className="mx-auto h-8 w-8 text-[#7A8B9E]" /><p className="mt-3 text-sm text-[#617286]">Choose a supplier profile to manage it.</p></div></div>}
        </section>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="block"><span className="mb-2 block text-xs font-black text-[#071E33]">{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} className="min-h-12 w-full rounded-xl border border-[#DCE4EC] px-4 text-sm outline-none focus:border-[#0D3B66]" /></label>;
}
