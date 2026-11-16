import ConstructionExplorer from "@/components/construction/construction-explorer";
import { createSeoMetadata } from "@/lib/seo";

export const metadata = createSeoMetadata({
  title: "Construction Explorer — Learn Building, Steelwork, Plumbing & Electrical in 3D",
  description: "Explore six interactive construction models with 46 guided lessons: a bungalow, concrete frame, truss bridge, steel portal frame, plumbing and electrical systems. Rotate, reveal stages and inspect components with Charismak.",
  path: "/construction-explorer",
  keywords: ["construction education Nigeria", "interactive construction models", "3D steelwork", "plumbing explained", "electrical installation learning", "building construction stages"],
});

export default function ConstructionExplorerPage() { return <ConstructionExplorer />; }
