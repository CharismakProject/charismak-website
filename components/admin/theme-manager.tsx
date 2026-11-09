"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, RotateCcw, Save } from "lucide-react";

import { isAdminEmail } from "@/lib/auth/admin";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { DEFAULT_THEME, THEME_FIELDS, THEME_PRESETS, cleanTheme, isHex, type ThemeColors } from "@/lib/theme";

const KEY = "theme.colors";

export default function ThemeManager() {
  const client = getSupabaseBrowserClient();
  const [auth, setAuth] = useState<"checking" | "ready" | "forbidden">("checking");
  const [colors, setColors] = useState<ThemeColors>(DEFAULT_THEME);
  const [saved, setSaved] = useState<ThemeColors>(DEFAULT_THEME);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!client) { setAuth("forbidden"); return; }
    void client.auth.getSession().then(async ({ data }) => {
      if (!data.session || !isAdminEmail(data.session.user.email)) { setAuth("forbidden"); return; }
      setAuth("ready");
      const { data: row, error: loadError } = await client.from("website_content").select("value").eq("content_key", KEY).maybeSingle();
      if (loadError) setError(loadError.message);
      const current = cleanTheme(row?.value);
      setColors(current); setSaved(current);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (key: keyof ThemeColors, value: string) => {
    setDrafts((d) => ({ ...d, [key]: value }));
    const v = value.startsWith("#") ? value : `#${value}`;
    if (isHex(v)) setColors((c) => ({ ...c, [key]: v.toUpperCase() }));
  };

  async function save(next: ThemeColors) {
    if (!client) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const { data: session } = await client.auth.getSession();
      const { error: saveError } = await client.from("website_content").upsert({
        content_key: KEY, section: "theme", label: "Website colours", value: next, published: true, display_order: 1,
        updated_at: new Date().toISOString(), updated_by: session.session?.user.email || null,
      }, { onConflict: "content_key" });
      if (saveError) throw saveError;
      // Ask the site to refresh now (otherwise it updates within about 5 minutes).
      const token = session.session?.access_token;
      if (token) await fetch("/api/admin/revalidate", { method: "POST", headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" }, body: "{}" }).catch(() => undefined);
      setSaved(next); setColors(next); setDrafts({});
      setMessage("Saved. The website will show the new colours within a few minutes (refresh the page to see them).");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the colours.");
    } finally { setBusy(false); }
  }

  if (auth === "checking") return <div className="grid min-h-[40vh] place-items-center"><Loader2 className="h-7 w-7 animate-spin text-white/60" /></div>;
  if (auth === "forbidden") return <section className="mx-auto max-w-lg px-5 py-20 text-center"><h1 className="text-2xl font-semibold text-white">Administrator access only</h1><p className="mt-3 text-sm text-white/60">Sign in on the Control Centre with an approved admin email, then come back to this page.</p></section>;

  const changed = THEME_FIELDS.some((f) => colors[f.key] !== saved[f.key]);
  const previewVars = Object.fromEntries(THEME_FIELDS.map((f) => [f.cssVar, colors[f.key]])) as React.CSSProperties;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 md:px-8">
      <p className="cx-eyebrow">Admin · Appearance</p>
      <h1 className="cx-title mt-4 text-3xl md:text-5xl">Website colours</h1>
      <p className="cx-lead mt-3 max-w-2xl text-sm">Change the main colours of the website. Pick a ready-made style or set each colour yourself, check the preview, then save. The Estimator, Rate Bank, Prices and Marketplace keep their own colours.</p>

      <div className="mt-8 flex flex-wrap gap-2">
        {THEME_PRESETS.map((p) => (
          <button key={p.name} type="button" onClick={() => { setColors(p.colors); setDrafts({}); }} className="inline-flex items-center gap-2 border border-white/15 px-3 py-2 text-xs font-semibold text-white hover:border-white/40">
            <span className="flex">{[p.colors.void, p.colors.panel, p.colors.gold].map((c) => <span key={c} className="h-4 w-4 border border-white/20" style={{ background: c }} />)}</span>
            {p.name}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.1fr]">
        <div className="grid gap-3">
          {THEME_FIELDS.map((f) => (
            <label key={f.key} className="flex items-center gap-4 border border-white/10 bg-white/[0.03] p-4">
              <input type="color" value={colors[f.key]} onChange={(e) => set(f.key, e.target.value)} className="h-12 w-14 shrink-0 cursor-pointer border border-white/20 bg-transparent" aria-label={f.label} />
              <span className="flex-1">
                <span className="block text-sm font-semibold text-white">{f.label}</span>
                <span className="block text-xs text-white/50">{f.hint}</span>
              </span>
              <input value={drafts[f.key] ?? colors[f.key]} onChange={(e) => set(f.key, e.target.value.trim())} maxLength={7} className="w-28 border px-3 py-2 font-mono text-sm uppercase" aria-label={`${f.label} hex code`} />
            </label>
          ))}
          <div className="mt-2 flex flex-wrap gap-3">
            <button type="button" disabled={busy || !changed} onClick={() => void save(colors)} className="cx-btn cx-btn-primary disabled:opacity-40">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save colours</button>
            <button type="button" disabled={busy || !changed} onClick={() => { setColors(saved); setDrafts({}); }} className="cx-btn cx-btn-ghost disabled:opacity-40">Undo changes</button>
            <button type="button" disabled={busy} onClick={() => { if (confirm("Reset the website to the original Charismak colours?")) void save(DEFAULT_THEME); }} className="cx-btn cx-btn-ghost"><RotateCcw className="h-4 w-4" /> Reset to default</button>
          </div>
          {message ? <p className="flex items-center gap-2 text-sm text-emerald-300"><Check className="h-4 w-4" /> {message}</p> : null}
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
        </div>

        {/* Live preview using the chosen colours */}
        <div style={previewVars} className="overflow-hidden border border-white/10">
          <div className="cx-grid-bg p-8" style={{ background: "var(--cx-void)", color: "var(--cx-text)" }}>
            <p className="cx-eyebrow">Preview · Construction company</p>
            <h2 className="cx-title mt-4 text-4xl">Priced right. <span style={{ color: "var(--cx-gold)" }}>Built to last.</span></h2>
            <p className="mt-4 text-sm" style={{ color: "color-mix(in srgb, var(--cx-text) 62%, transparent)" }}>This is how headings, text and buttons will look across the website.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <span className="cx-btn cx-btn-primary">Start your project</span>
              <span className="cx-btn cx-btn-ghost">View projects</span>
            </div>
          </div>
          <div className="grid gap-px sm:grid-cols-2" style={{ background: "rgba(255,255,255,0.08)" }}>
            {["Building construction", "Project management"].map((t, i) => (
              <div key={t} className="p-6" style={{ background: i ? "var(--cx-panel)" : "var(--cx-deep)" }}>
                <span className="cx-mono text-xs" style={{ color: "var(--cx-gold)" }}>0{i + 1}</span>
                <h3 className="mt-4 font-semibold text-white">{t}</h3>
                <p className="mt-2 text-xs" style={{ color: "color-mix(in srgb, var(--cx-text) 62%, transparent)" }}>Section and panel backgrounds.</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
