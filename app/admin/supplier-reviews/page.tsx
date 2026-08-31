import AdminNav from "@/components/admin/admin-nav";
import SupplierReviewQueue from "@/components/admin/supplier-review-queue";

export const metadata = { title: "Admin Supplier Reviews" };

export default function AdminSupplierReviewsPage() {
  return <main className="min-h-screen bg-[#F5F7FA] pt-20"><AdminNav /><SupplierReviewQueue /></main>;
}
