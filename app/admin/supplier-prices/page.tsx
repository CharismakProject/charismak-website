import AdminNav from "@/components/admin/admin-nav";
import SupplierPriceManager from "@/components/admin/supplier-price-manager";

export const metadata = { title: "Admin Approved Supplier Prices" };

export default function AdminSupplierPricesPage() {
  return <main className="min-h-screen bg-[#F5F7FA] pt-20"><AdminNav /><SupplierPriceManager /></main>;
}
