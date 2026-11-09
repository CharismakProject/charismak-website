import AdminNav from "@/components/admin/admin-nav";
import WebsiteContentManager from "@/components/admin/website-content-manager";

export const metadata = { title: "Admin Website Content" };

export default function AdminWebsiteContentPage() {
  return <main className="cx-skin min-h-screen bg-[#F5F7FA] pt-20"><AdminNav /><WebsiteContentManager /></main>;
}
