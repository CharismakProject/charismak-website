import type { Metadata } from "next";

import AdminDashboard from "@/components/admin/admin-dashboard";

export const metadata: Metadata = {
  title: "Charismak Admin",
  description: "Private Charismak administration and supplier review control centre.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-[#F5F7FA] pt-20">
      <AdminDashboard />
    </main>
  );
}
