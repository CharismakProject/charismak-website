import type { Metadata } from "next";

import AdminDashboard from "@/components/admin/admin-dashboard";
import AdminEmailAccess from "@/components/admin/admin-email-access";
import AdminPrimaryActions from "@/components/admin/admin-primary-actions";
import styles from "./admin-mobile.module.css";

export const metadata: Metadata = {
  title: "Charismak Admin",
  description: "Private Charismak administration for catalogue, prices, suppliers, estimator tools and News & Learning publishing.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function AdminPage() {
  return (
    <main className={`${styles.adminPage} min-h-screen bg-[#F5F7FA] pt-20`}>
      <AdminEmailAccess />
      <AdminPrimaryActions />
      <AdminDashboard />
    </main>
  );
}
