import type { Metadata } from "next";

import SpacePlanner from "@/components/planner/space-planner";

export const metadata: Metadata = {
  title: "Space Planner — Plan a Room, Place Furniture & Price It (Free)",
  description:
    "Upload a floor plan or type a room size, set the scale, draw walls, doors and windows, place furniture, kitchen, bathroom and electrical items, and download a priced PDF report. Free, no sign-up.",
  alternates: { canonical: "https://www.charismakproject.com/construction-studio/design" },
};

export default function SpacePlannerPage() {
  return <SpacePlanner />;
}
