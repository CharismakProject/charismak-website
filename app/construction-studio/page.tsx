import ConstructionStudio from "@/components/construction/construction-studio";
import { createSeoMetadata } from "@/lib/seo";
export const metadata = createSeoMetadata({ title: "Construction Studio — Drawing, BOQ, 4D Sequence & Project Programme", description: "Import IFC and 3D models, trace a scaled 2D plan, connect an Excel BOQ and explore a proposed construction sequence with costs and an editable work programme.", path: "/construction-studio", keywords: ["4D construction Nigeria", "BOQ construction simulation", "IFC construction viewer", "construction work programme", "5D construction cost"] });
export default function ConstructionStudioPage() { return <ConstructionStudio />; }
