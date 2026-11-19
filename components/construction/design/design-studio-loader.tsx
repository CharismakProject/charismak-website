"use client";

import dynamic from "next/dynamic";

// The editor is browser-only (WebGPU / IndexedDB), so it is never server-rendered.
const DesignStudio = dynamic(() => import("./design-studio"), {
  ssr: false,
  loading: () => <div className="grid h-[calc(100vh-5rem)] place-items-center bg-[#02080F] pt-20 text-sm text-white/60">Loading Design Studio…</div>,
});

export default function DesignStudioLoader() {
  return <DesignStudio />;
}
