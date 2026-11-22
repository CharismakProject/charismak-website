"use client";

import "./pascal-bootstrap";

import Link from "next/link";
import { get, set } from "idb-keyval";
import { Editor, ItemsPanel, type SidebarTab } from "@pascal-app/editor";
import { Hammer, Layers, Package, Palette, Settings } from "lucide-react";
import { useState, type ComponentProps } from "react";

import { BuildTab } from "./pascal/build-tab";
import { PaintPanel } from "./pascal/paint-panel";
import PriceDesignButton from "./price-design-panel";
import StudioHubTabs from "../studio-hub-tabs";
import QuickDesign from "./quick-design";

type SceneGraph = NonNullable<Awaited<ReturnType<NonNullable<ComponentProps<typeof Editor>["onLoad"]>>>>;

// Designs are saved only in this visitor's browser (IndexedDB) — free, no account, nothing on our servers.
const STORAGE_KEY = "charismak-design-studio-v1";

async function loadScene(): Promise<SceneGraph | null> {
  try {
    return ((await get(STORAGE_KEY)) as SceneGraph | undefined) ?? null;
  } catch {
    return null;
  }
}

async function saveScene(scene: SceneGraph) {
  try {
    await set(STORAGE_KEY, scene);
  } catch {
    // Storage blocked (private mode etc.): the editor keeps working, it just won't persist.
  }
}

const tabIcon = (name: string) => (
  <img alt="" className="h-8 w-8 object-contain" height={32} src={`/icons/${name}.webp`} width={32} />
);

// Same sidebar as Pascal's standalone editor. "site" and "settings" render built-in panels.
const SIDEBAR_TABS: (SidebarTab & { component: React.ComponentType })[] = [
  { id: "site", label: "Scene", component: () => null, mobileDefaultSnap: 0.5, mobileIcon: <Layers className="h-5 w-5" />, icon: tabIcon("scene") },
  { id: "build", label: "Build", component: BuildTab, mobileDefaultSnap: 0.5, mobileIcon: <Hammer className="h-5 w-5" />, icon: tabIcon("build") },
  { id: "paint", label: "Paint", component: PaintPanel, mobileDefaultSnap: 0.5, mobileIcon: <Palette className="h-5 w-5" />, icon: tabIcon("paint") },
  { id: "items", label: "Items", component: () => <ItemsPanel showSourceFilter={false} showTagFilters={false} />, mobileDefaultSnap: 0.5, mobileIcon: <Package className="h-5 w-5" />, icon: tabIcon("item") },
  { id: "settings", label: "Settings", component: () => null, mobileDefaultSnap: 0.5, mobileIcon: <Settings className="h-5 w-5" />, icon: tabIcon("settings") },
];

export default function DesignStudio() {
  // Quick design (simple sliders) is the default; the full editor is one click away.
  const [mode, setMode] = useState<"quick" | "advanced">("quick");

  const openAdvanced = async (scene?: { nodes: unknown; rootNodeIds: unknown; materials: unknown; collections: unknown; installedPlugins: unknown }) => {
    if (scene) await saveScene(scene as unknown as SceneGraph);
    setMode("advanced");
  };

  return (
    <main className="dark flex h-[100dvh] flex-col bg-[#0F1923] pt-20">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-2 text-xs text-white/60">
        <span className="flex flex-wrap items-center gap-3">
          <StudioHubTabs active="design" compact />
          <span className="flex rounded-md bg-white/5 p-0.5" role="tablist" aria-label="Design mode">
            <button type="button" role="tab" aria-selected={mode === "quick"} onClick={() => setMode("quick")} className={`rounded px-2.5 py-1 font-bold ${mode === "quick" ? "bg-white/15 text-white" : "text-white/60"}`}>Quick design</button>
            <button type="button" role="tab" aria-selected={mode === "advanced"} onClick={() => void openAdvanced()} className={`rounded px-2.5 py-1 font-bold ${mode === "advanced" ? "bg-white/15 text-white" : "text-white/60"}`}>Advanced editor</button>
          </span>
          {mode === "advanced" ? <PriceDesignButton /> : <span className="hidden sm:inline">free · saved in this browser only</span>}
        </span>
        <span>
          Built on{" "}
          <a href="https://github.com/pascalorg/editor" target="_blank" rel="noreferrer" className="underline hover:text-white">
            Pascal Editor
          </a>{" "}
          (MIT) ·{" "}
          <Link href="/construction-studio" className="underline hover:text-white">
            Construction Studio
          </Link>
        </span>
      </div>
      {mode === "quick" ? (
        <QuickDesign onAdvanced={(scene) => void openAdvanced(scene)} />
      ) : (
        <div className="relative min-h-0 flex-1">
          <Editor layoutVersion="v2" projectId="charismak-local" onLoad={loadScene} onSave={saveScene} actionMenuPlacement="top" sidebarTabs={SIDEBAR_TABS} />
        </div>
      )}
    </main>
  );
}
