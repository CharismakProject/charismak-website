import type { Metadata } from "next";

import { createSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = createSeoMetadata({
  title: "Request a Construction Quote in Abuja",
  description:
    "Request a quote for building construction, renovation, steel fabrication or project management in Abuja and across Nigeria from Charismak Project Nigeria Limited.",
  path: "/quote",
  keywords: ["construction quote Abuja", "building contractor quote Abuja", "renovation quote Abuja"],
});

export default function QuoteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
