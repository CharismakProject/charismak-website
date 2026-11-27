import type { Metadata } from "next";

import AdminGate from "@/components/admin/admin-gate";
import DesignStudioLoader from "@/components/construction/design/design-studio-loader";

export const metadata: Metadata = { title: "Advanced 3D Studio (admin)", robots: { index: false, follow: false } };

/** The full 3D design editor, kept for Charismak staff only. Visitors use the Space Planner. */
export default function AdvancedStudioPage() {
  return <AdminGate><DesignStudioLoader /></AdminGate>;
}
