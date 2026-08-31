"use client";

import { useEffect, useState } from "react";
import { ImagePlus, Loader2, Plus, Save, Trash2, X } from "lucide-react";

import { isAdminEmail } from "@/lib/auth/admin";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type PersonRow = {
  id: string;
  name: string;
  role: string;
  image_url: string | null;
  group_name: "Active Team" | "Supporting Team";
  category: string;
  bio: string;
  published: boolean;
  display_order: number;
};

const blank = (): PersonRow => ({ id: "", name: "", role: "", image_url: "", group_name: "Supporting Team", category: "Project Delivery", bio: "", published: true, display_order: 100 });

export default function LeadershipManager() {
  const client = getSupabaseBrowserClient();
  const [auth, setAuth] = useState<"checking" | "forbidden" | "ready">("checking");
  const [rows, setRows] = useState<PersonRow[]>([]);
  const [selected, setSelected] = useState<PersonRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = async () => {
    if (!client) return;
    const { data, error: loadError } = await client.from("website_people").select("*").order("group_name").order("display_order");
    if (loadError) setError(loadError.message);
    setRows((data || []) as PersonRow[]);
  };

  useEffect(() => {
    if (!client) { setAuth("forbidden"); return; }
    void client.auth.getSession().then(async ({ data }) => {
      if (!data.session || !isAdminEmail(data.session.user.email)) { setAuth("forbidden"); return; }
      setAuth("ready"); await load();
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const upload = async (files: FileList | null) => {
    if (!client || !selected || !files?.[0]) return;
    setBusy(true); setError("");
    try {
      const file = files[0];
      const ext = file.name.split(".").pop() || "jpg";
      const path = `team/${selected.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "member"}-${Date.now()}.${ext}`;
      const { error: uploadError } = await client.storage.from("content-media").upload(path, file);
      if (uploadError) throw uploadError;
      const publicUrl = client.storage.from("content-media").getPublicUrl(path).data.publicUrl;
      setSelected({ ...selected, image_url: publicUrl });
    } catch (err) { setError(err instanceof Error ? err.message : "Upload failed."); }
    finally { setBusy(false); }
  };

  const save = async () => {
    if (!client || !selected) return;
    if (!selected.name.trim() || !selected.role.trim()) { setError("Name and role are required."); return; }
    setBusy(true); setError(""); setMessage("");
    try {
      const { data: session } = await client.auth.getSession();
      const payload = { name: selected.name.trim(), role: selected.role.trim(), image_url: selected.image_url || null, group_name: selected.group_name, category: selected.category.trim(), bio: selected.bio.trim(), published: selected.published, display_order: selected.display_order, updated_at: new Date().toISOString(), updated_by: session.session?.user.email || null };
      const result = selected.id
        ? await client.from("website_people").update(payload).eq("id", selected.id)
        : await client.from("website_people").insert(payload);
      if (result.error) throw result.error;
      setSelected(null); setMessage("Leadership record saved."); await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to save team member."); }
    finally { setBusy(false); }
  };

  const remove = async (row: PersonRow) => {
    if (!client || !window.confirm(`Remove ${row.name} from the website CMS?`)) return;
    const { error: deleteError } = await client.from("website_people").delete().eq("id", row.id);
    if (deleteError) setError(deleteError.message); else { setMessage("Team member removed."); await load(); }
  };

  if (auth === "checking") return <div className="grid min-h-[50vh] place-items-center"><Loader2 className="h-7 w-7 animate-spin" /></div>;
  if (auth === "forbidden") return <div className="mx-auto max-w-xl p-8 text-center"><h1 className="text-2xl font-black text-[#071E33]">Administrator sign-in required</h1><p className="mt-3 text-sm text-[#617286]">Sign in from the Admin Control Centre first.</p></div>;

  return <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-[#A82B05]">Website CMS</p><h1 className="mt-2 text-3xl font-black text-[#071E33]">Leadership & Team</h1><p className="mt-2 text-sm text-[#617286]">Manage people, roles, photographs, grouping and display order.</p></div><button onClick={() => setSelected(blank())} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#0D3B66] px-5 text-sm font-black text-white"><Plus className="h-4 w-4" /> Add person</button></div>
    {message ? <p className="mt-5 rounded-xl bg-[#EAF7EF] p-4 text-sm text-[#197447]">{message}</p> : null}{error ? <p className="mt-5 rounded-xl bg-[#FFF4F1] p-4 text-sm text-[#8B1E00]">{error}</p> : null}
    {!rows.length ? <div className="mt-8 rounded-2xl border border-dashed border-[#B8C7D6] bg-white p-8 text-sm text-[#617286]">The CMS is ready. Current team records will be seeded into this table before the review deployment.</div> : <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{rows.map((row) => <article key={row.id} className="overflow-hidden rounded-2xl border border-[#DCE4EC] bg-white"><div className="relative h-56 bg-[#E9EEF3]">{row.image_url ? <img src={row.image_url} alt={row.name} className="h-full w-full object-cover object-top" /> : <div className="grid h-full place-items-center text-3xl font-black text-[#0D3B66]">{row.name.slice(0,2).toUpperCase()}</div>}</div><div className="p-5"><div className="flex items-start justify-between gap-3"><div><h3 className="font-black text-[#071E33]">{row.name}</h3><p className="mt-1 text-sm font-bold text-[#0D3B66]">{row.role}</p></div><span className={`rounded-full px-2 py-1 text-[9px] font-black ${row.published ? "bg-[#EAF7EF] text-[#197447]" : "bg-[#F1F3F5] text-[#617286]"}`}>{row.published ? "Visible" : "Hidden"}</span></div><p className="mt-3 text-xs text-[#617286]">{row.group_name} · {row.category}</p><div className="mt-5 flex gap-2"><button onClick={() => setSelected({ ...row })} className="flex-1 rounded-lg bg-[#0D3B66] py-2.5 text-xs font-black text-white">Edit</button><button onClick={() => void remove(row)} className="grid h-10 w-10 place-items-center rounded-lg bg-[#FFF1EE] text-[#A82B05]"><Trash2 className="h-4 w-4" /></button></div></div></article>)}</div>}
    {selected ? <div className="fixed inset-0 z-[170] overflow-y-auto bg-[#071E33]/75 p-4 backdrop-blur-sm"><section className="mx-auto max-w-2xl rounded-[1.75rem] bg-white shadow-2xl"><header className="flex items-center justify-between border-b border-[#DCE4EC] p-5"><h2 className="text-xl font-black text-[#071E33]">{selected.id ? "Edit person" : "Add person"}</h2><button onClick={() => setSelected(null)} className="grid h-10 w-10 place-items-center rounded-xl bg-[#071E33] text-white"><X className="h-5 w-5" /></button></header><div className="grid gap-4 p-5 sm:grid-cols-2">
      <Field label="Name *"><input className="cms-input" value={selected.name} onChange={(e) => setSelected({...selected,name:e.target.value})} /></Field><Field label="Role *"><input className="cms-input" value={selected.role} onChange={(e) => setSelected({...selected,role:e.target.value})} /></Field>
      <Field label="Team group"><select className="cms-input" value={selected.group_name} onChange={(e) => setSelected({...selected,group_name:e.target.value as PersonRow["group_name"]})}><option>Active Team</option><option>Supporting Team</option></select></Field><Field label="Category"><input className="cms-input" value={selected.category} onChange={(e) => setSelected({...selected,category:e.target.value})} /></Field>
      <Field label="Display order"><input type="number" className="cms-input" value={selected.display_order} onChange={(e) => setSelected({...selected,display_order:Number(e.target.value)})} /></Field><label className="flex items-center gap-2 pt-8 text-sm font-bold text-[#071E33]"><input type="checkbox" checked={selected.published} onChange={(e)=>setSelected({...selected,published:e.target.checked})}/> Show on website</label>
      <Field label="Bio" wide><textarea rows={5} className="cms-input py-3" value={selected.bio} onChange={(e)=>setSelected({...selected,bio:e.target.value})}/></Field>
      <Field label="Photograph" wide><div className="flex items-center gap-4">{selected.image_url ? <img src={selected.image_url} alt="Preview" className="h-20 w-20 rounded-xl object-cover object-top" /> : null}<label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#F5F7FA] px-4 py-3 text-xs font-black text-[#0D3B66]"><ImagePlus className="h-4 w-4" /> Upload image<input type="file" accept="image/*" className="hidden" onChange={(e)=>void upload(e.target.files)}/></label></div></Field>
    </div><footer className="flex justify-end gap-3 border-t border-[#DCE4EC] p-5"><button onClick={()=>setSelected(null)} className="rounded-xl border border-[#DCE4EC] px-5 py-3 text-sm font-black">Cancel</button><button disabled={busy} onClick={()=>void save()} className="inline-flex items-center gap-2 rounded-xl bg-[#A82B05] px-5 py-3 text-sm font-black text-white disabled:opacity-50">{busy?<Loader2 className="h-4 w-4 animate-spin"/>:<Save className="h-4 w-4"/>} Save</button></footer></section></div> : null}
    <style jsx global>{`.cms-input{min-height:3rem;width:100%;border:1px solid #DCE4EC;border-radius:.75rem;padding-left:1rem;padding-right:1rem;font-size:.875rem;color:#071E33;outline:none}.cms-input:focus{border-color:#0D3B66}`}</style>
  </div>;
}

function Field({label,children,wide=false}:{label:string;children:React.ReactNode;wide?:boolean}){return <label className={wide?"sm:col-span-2":""}><span className="mb-2 block text-xs font-black text-[#071E33]">{label}</span>{children}</label>}
