"use client";

import { Check, Link2, Printer } from "lucide-react";
import { useState } from "react";

export default function ProfileActions() {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard access can be blocked by the browser; the URL remains available in the address bar.
    }
  }

  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex items-center gap-2 rounded-md bg-[#0D3B66] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#071E33]"
      >
        <Printer className="h-4 w-4" />
        Print / Save PDF
      </button>
      <button
        type="button"
        onClick={copyLink}
        className="inline-flex items-center gap-2 rounded-md border border-[#0D3B66]/15 bg-white px-4 py-2.5 text-xs font-bold text-[#071E33] transition hover:border-[#C8A45D]"
      >
        {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Link2 className="h-4 w-4" />}
        {copied ? "Link copied" : "Copy profile link"}
      </button>
    </div>
  );
}
