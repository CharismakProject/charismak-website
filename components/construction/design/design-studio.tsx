"use client";

import "./pascal-bootstrap";

import Link from "next/link";
import { get, set } from "idb-keyval";
import { Editor, ItemsPanel, type SidebarTab } from "@pascal-app/editor";
import { Hammer, Layers, Package, Palette, Settings } from "lucide-react";
import type { ComponentProps } from "react";

import { BuildTab } from "./pascal/build-tab";
import { PaintPanel } from "./pascal/paint-panel";
import PriceDesignButton from "./price-design-panel";

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
  return (
    <main className="dark flex h-screen flex-col bg-[#02080F] pt-20">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-2 text-xs text-white/60">
        <span className="flex flex-wrap items-center gap-3">
          <span>
            <strong className="text-white">Design Studio</strong> · free · your design is saved in this browser only
          </span>
          <PriceDesignButton />
        </span>
        <span>
          Built on{" "}
          <a href="https://github.com/pascalorg/editor" target="_blank" rel="noreferrer" className="underline hover:text-white">
            Pascal Editor
          </a>{" "}
          (MIT) ·{" "}
          <Link href="/construction-studio" className="underline hover:text-white">
            Back to Construction Studio
          </Link>
        </span>
      </div>
      <div className="relative min-h-0 flex-1">
        <Editor layoutVersion="v2" projectId="charismak-local" onLoad={loadScene} onSave={saveScene} actionMenuPlacement="top" sidebarTabs={SIDEBAR_TABS} />
      </div>
    </main>
  );
}
