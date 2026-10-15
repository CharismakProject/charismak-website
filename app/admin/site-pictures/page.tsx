import AdminNav from "@/components/admin/admin-nav";
import SitePicturesManager from "@/components/admin/site-pictures-manager";

export const metadata = { title: "Admin Site Pictures", robots: { index: false, follow: false } };

export default function AdminSitePicturesPage() {
  return (
    <main className="min-h-screen bg-[#F5F7FA] pt-20">
      <AdminNav />
      <SitePicturesManager />
    </main>
  );
}
