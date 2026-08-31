"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Save, Search, Trash2, X } from "lucide-react";

import { isAdminEmail } from "@/lib/auth/admin";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type ContentRow = {
  content_key: string;
  section: string;
  label: string;
  value: unknown;
  published: boolean;
  display_order: number;
};

type Draft = {
  content_key: string;
  section: string;
  label: string;
  textValue: string;
  published: boolean;
  display_order: number;
};

const blank = (): Draft => ({ content_key: "", section: "company", label: "", textValue: "", published: true, display_order: 100 });
const asText = (value: unknown) => typeof value === "string" ? value : value && typeof value === "object" && "text" in value ? String((value as { text?: unknown }).text ?? "") : JSON.stringify(value ?? "", null, 2);
const toValue = (text: string) => ({ text });

export default function WebsiteContentManager() {
  const client = getSupabaseBrowserClient();
  const [auth, setAuth] = useState<"checking" | "forbidden" | "ready">("checking");
  const [rows, setRows] = useState<ContentRow[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [originalKey, setOriginalKey] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [section, setSection] = useState("all");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = async () => {
    if (!client) return;
    const { data, error: loadError } = await client.from("website_content").select("*").order("section").order("display_order");
    if (loadError) setError(loadError.message);
    setRows((data || []) as ContentRow[]);
  };

  useEffect(() => {
    if (!client) { setAuth("forbidden"); return; }
    void client.auth.getSession().then(async ({ data }) => {
      if (!data.session || !isAdminEmail(data.session.user.email)) { setAuth("forbidden"); return; }
      setAuth("ready"); await load();
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sections = useMemo(() => Array.from(new Set(rows.map((row) => row.section))), [rows]);
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => (section === "all" || row.section === section) && (!q || [row.content_key,row.section,row.label,asText(row.value)].join(" ").toLowerCase().includes(q)));
  }, [rows, section, query]);

  const edit = (row: ContentRow) => { setDraft({ content_key: row.content_key, section: row.section, label: row.label, textValue: asText(row.value), published: row.published, display_order: row.display_order }); setOriginalKey(row.content_key); };
  const create = () => { setDraft(blank()); setOriginalKey(null); };

  const save = async () => {
    if (!client || !draft) return;
    const key = draft.content_key.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
    if (!key || !draft.section.trim() || !draft.label.trim()) { setError("Key, section and label are required."); return; }
    setBusy(true); setError(""); setMessage("");
    try {
      const { data: session } = await client.auth.getSession();
      const payload = { content_key: key, section: draft.section.trim(), label: draft.label.trim(), value: toValue(draft.textValue), published: draft.published, display_order: draft.display_order, updated_at: new Date().toISOString(), updated_by: session.session?.user.email || null };
      if (originalKey && originalKey !== key) {
        const { error: insertError } = await client.from("website_content").insert(payload); if (insertError) throw insertError;
        const { error: deleteError } = await client.from("website_content").delete().eq("content_key", originalKey); if (deleteError) throw deleteError;
      } else {
        const { error: saveError } = await client.from("website_content").upsert(payload, { onConflict: "content_key" }); if (saveError) throw saveError;
      }
      setDraft(null); setOriginalKey(null); setMessage("Website content saved."); await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to save content."); }
    finally { setBusy(false); }
  };

  const remove = async (row: ContentRow) => {
    if (!client || !window.confirm(`Remove ${row.label}?`)) return;
    const { error: deleteError } = await client.from("website_content").delete().eq("content_key", row.content_key);
    if (deleteError) setError(deleteError.message); else { setMessage("Content removed."); await load(); }
  };

  if (auth === "checking") return <div className="grid min-h-[50vh] place-items-center"><Loader2 className="h-7 w-7 animate-spin" /></div>;
  if (auth === "forbidden") return <div className="p-10 text-center"><h1 className="text-2xl font-black text-[#071E33]">Administrator sign-in required</h1></div>;

  return <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-[#A82B05]">Website CMS</p><h1 className="mt-2 text-3xl font-black text-[#071E33]">Website Content</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#617286]">Edit recurring company information and website copy without changing source code.</p></div><button onClick={create} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#0D3B66] px-5 text-sm font-black text-white"><Plus className="h-4 w-4"/> Add content</button></div>
    {message ? <p className="mt-5 rounded-xl bg-[#EAF7EF] p-4 text-sm text-[#197447]">{message}</p> : null}{error ? <p className="mt-5 rounded-xl bg-[#FFF4F1] p-4 text-sm text-[#8B1E00]">{error}</p> : null}
    <div className="mt-6 flex flex-col gap-3 sm:flex-row"><label className="relative flex-1"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A8B9E]"/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search content..." className="min-h-12 w-full rounded-xl border border-[#DCE4EC] bg-white pl-11 pr-4 text-sm outline-none"/></label><select value={section} onChange={(e)=>setSection(e.target.value)} className="min-h-12 rounded-xl border border-[#DCE4EC] bg-white px-4 text-sm font-bold text-[#071E33]"><option value="all">All sections</option>{sections.map((value)=><option key={value}>{value}</option>)}</select></div>
    <div className="mt-6 overflow-hidden rounded-2xl border border-[#DCE4EC] bg-white">{visible.map((row)=><div key={row.content_key} className="grid gap-3 border-b border-[#E8EDF2] p-4 last:border-b-0 md:grid-cols-[180px_1fr_auto] md:items-center"><div><span className="text-[10px] font-black uppercase tracking-[.12em] text-[#A82B05]">{row.section}</span><p className="mt-1 text-xs font-bold text-[#617286]">{row.content_key}</p></div><div><h3 className="font-black text-[#071E33]">{row.label}</h3><p className="mt-1 line-clamp-2 text-sm leading-6 text-[#617286]">{asText(row.value)}</p></div><div className="flex gap-2"><button onClick={()=>edit(row)} className="rounded-lg bg-[#0D3B66] px-4 py-2.5 text-xs font-black text-white">Edit</button><button onClick={()=>void remove(row)} className="grid h-10 w-10 place-items-center rounded-lg bg-[#FFF1EE] text-[#A82B05]"><Trash2 className="h-4 w-4"/></button></div></div>)}</div>
    {draft ? <div className="fixed inset-0 z-[170] overflow-y-auto bg-[#071E33]/75 p-4 backdrop-blur-sm"><section className="mx-auto max-w-2xl rounded-[1.75rem] bg-white"><header className="flex items-center justify-between border-b border-[#DCE4EC] p-5"><h2 className="text-xl font-black text-[#071E33]">{originalKey?"Edit content":"Add content"}</h2><button onClick={()=>setDraft(null)} className="grid h-10 w-10 place-items-center rounded-xl bg-[#071E33] text-white"><X className="h-5 w-5"/></button></header><div className="grid gap-4 p-5 sm:grid-cols-2"><Field label="Content key *"><input className="content-input" value={draft.content_key} onChange={(e)=>setDraft({...draft,content_key:e.target.value})}/></Field><Field label="Section *"><input className="content-input" value={draft.section} onChange={(e)=>setDraft({...draft,section:e.target.value})}/></Field><Field label="Admin label *" wide><input className="content-input" value={draft.label} onChange={(e)=>setDraft({...draft,label:e.target.value})}/></Field><Field label="Content" wide><textarea rows={9} className="content-input py-3" value={draft.textValue} onChange={(e)=>setDraft({...draft,textValue:e.target.value})}/></Field><Field label="Display order"><input type="number" className="content-input" value={draft.display_order} onChange={(e)=>setDraft({...draft,display_order:Number(e.target.value)})}/></Field><label className="flex items-center gap-2 pt-8 text-sm font-bold text-[#071E33]"><input type="checkbox" checked={draft.published} onChange={(e)=>setDraft({...draft,published:e.target.checked})}/> Published</label></div><footer className="flex justify-end gap-3 border-t border-[#DCE4EC] p-5"><button onClick={()=>setDraft(null)} className="rounded-xl border border-[#DCE4EC] px-5 py-3 text-sm font-black">Cancel</button><button disabled={busy} onClick={()=>void save()} className="inline-flex items-center gap-2 rounded-xl bg-[#A82B05] px-5 py-3 text-sm font-black text-white disabled:opacity-50">{busy?<Loader2 className="h-4 w-4 animate-spin"/>:<Save className="h-4 w-4"/>} Save</button></footer></section></div> : null}
    <style jsx global>{`.content-input{min-height:3rem;width:100%;border:1px solid #DCE4EC;border-radius:.75rem;padding-left:1rem;padding-right:1rem;font-size:.875rem;color:#071E33;outline:none}.content-input:focus{border-color:#0D3B66}`}</style>
  </div>;
}

function Field({label,children,wide=false}:{label:string;children:React.ReactNode;wide?:boolean}){return <label className={wide?"sm:col-span-2":""}><span className="mb-2 block text-xs font-black text-[#071E33]">{label}</span>{children}</label>}
