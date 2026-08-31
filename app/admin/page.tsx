import type { Metadata } from "next";

import AdminDashboard from "@/components/admin/admin-dashboard";
import AdminEmailAccess from "@/components/admin/admin-email-access";
import AdminNav from "@/components/admin/admin-nav";
import AdminPrimaryActions from "@/components/admin/admin-primary-actions";
import styles from "./admin-mobile.module.css";

export const metadata: Metadata = {
  title: "Charismak Website Control Centre",
  description: "Private Charismak administration for website content, projects, leadership, prices, suppliers and News & Learning.",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminPage() {
  return (
    <main className={`${styles.adminPage} min-h-screen bg-[#F5F7FA] pt-20`}>
      <AdminNav />
      <AdminEmailAccess />
      <AdminPrimaryActions />
      <AdminDashboard />
    </main>
  );
}
