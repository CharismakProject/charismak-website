import AdminNav from "@/components/admin/admin-nav";
import SupplierProfileManager from "@/components/admin/supplier-profile-manager";

export const metadata = { title: "Admin Supplier Profiles" };

export default function AdminSupplierProfilesPage() {
  return <main className="min-h-screen bg-[#F5F7FA] pt-20"><AdminNav /><SupplierProfileManager /></main>;
}
