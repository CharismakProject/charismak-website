import type { Metadata } from "next";

import DesignStudioLoader from "@/components/construction/design/design-studio-loader";

export const metadata: Metadata = {
  title: "Design Studio — Draw a Building in 3D (Free)",
  description:
    "Draw walls, floors, roofs, doors and windows in 3D in your browser. Free to use, no sign-up; your design stays on your device. Built on the open-source Pascal Editor.",
  alternates: { canonical: "https://www.charismakproject.com/construction-studio/design" },
};

export default function DesignStudioPage() {
  return <DesignStudioLoader />;
}
