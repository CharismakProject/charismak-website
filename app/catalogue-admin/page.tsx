import type { Metadata } from "next";

import CatalogueManager from "@/components/pricing/catalogue-manager";

export const metadata: Metadata = {
  title: "Catalogue Management",
  description: "Private Charismak catalogue administration for materials, equipment, labour and specialist services.",
  robots: { index: false, follow: false, nocache: true },
};

export default function CatalogueAdminPage() {
  return (
    <main className="min-h-screen bg-[#F5F7FA] pt-20">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">
        <CatalogueManager />
      </div>
    </main>
  );
}
