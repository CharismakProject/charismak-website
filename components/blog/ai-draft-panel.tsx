"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";

export type AiDraft = {
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  body: string;
  contentType: "news" | "learning";
};

const IDEAS = [
  "How many trips of sand and granite does a 3-bedroom bungalow foundation need?",
  "Sharp sand vs plaster sand: which one goes where?",
  "Building material prices in Abuja this month",
  "How to check block quality before you pay the supplier",
  "Why your BOQ needs a contingency and how much to allow",
];

export default function AiDraftPanel({
  getToken,
  onDraft,
}: {
  getToken: () => string | undefined;
  onDraft: (draft: AiDraft) => void;
}) {
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");
  const [contentType, setContentType] = useState<"news" | "learning">("learning");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const generate = async () => {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/blog-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken() ?? ""}` },
        body: JSON.stringify({ topic, notes, contentType }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "Drafting failed.");
      onDraft(payload.draft as AiDraft);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Drafting failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <details className="group rounded-2xl border border-[#E2CF9E] bg-[#FFF9ED] p-4">
      <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-black text-[#081B36]">
        <Sparkles className="h-4 w-4 text-[#C8A45D]" />
        Draft with AI
        <span className="text-xs font-normal text-[#795E16]">— fills the form below as a draft for you to check</span>
      </summary>
      <div className="mt-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {IDEAS.map((idea) => (
            <button key={idea} type="button" onClick={() => setTopic(idea)} className="rounded-full border border-[#E2CF9E] bg-white px-3 py-1 text-xs text-[#5D4600] hover:border-[#C8A45D]">
              {idea}
            </button>
          ))}
        </div>
        <label className="block text-sm font-bold text-[#081B36]">
          Topic
          <input value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="e.g. Roof progress at Jahi project" className="mt-2 min-h-11 w-full rounded-xl border border-[#C9D5E1] bg-white px-4 font-normal" />
        </label>
        <label className="block text-sm font-bold text-[#081B36]">
          Facts to include <span className="font-normal text-[#617286]">(site progress, figures, dates — the AI will not invent these)</span>
          <textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-2 w-full rounded-xl border border-[#C9D5E1] bg-white px-4 py-3 font-normal leading-6" />
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <select value={contentType} onChange={(event) => setContentType(event.target.value as "news" | "learning")} className="min-h-11 rounded-xl border border-[#C9D5E1] bg-white px-3 text-sm">
            <option value="learning">Learning guide</option>
            <option value="news">News update</option>
          </select>
          <button type="button" disabled={busy || !topic.trim()} onClick={() => void generate()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#081B36] px-5 text-sm font-bold text-white disabled:opacity-50">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-[#F2B544]" />}
            {busy ? "Drafting… (about 30 s)" : "Generate draft"}
          </button>
        </div>
        {error ? <p className="text-sm text-[#A82B05]">{error}</p> : null}
        <p className="text-xs leading-5 text-[#795E16]">
          Anything the AI could not verify is marked [CHECK: …]. Publishing is blocked until every marker is resolved.
        </p>
      </div>
    </details>
  );
}
