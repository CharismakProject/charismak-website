import ConstructionWalkthrough from "@/components/construction/construction-walkthrough";
import { createSeoMetadata } from "@/lib/seo";

export const metadata = createSeoMetadata({
  title: "Building Construction Walkthrough — From Ground to Handover",
  description: "Explore 14 construction stages in an interactive 3D bungalow, with quality checks, editable sample quantities and transparent Nigerian construction rate references.",
  path: "/rates/walkthrough",
  keywords: ["construction process Nigeria", "building construction stages", "3D construction walkthrough", "construction rates Nigeria"],
});

export default function WalkthroughPage() {
  return <ConstructionWalkthrough />;
}
