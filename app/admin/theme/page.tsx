import AdminNav from "@/components/admin/admin-nav";
import ThemeManager from "@/components/admin/theme-manager";

export default function AdminThemePage() {
  return <main className="cx-skin min-h-screen bg-[#F5F7FA] pt-20"><AdminNav /><ThemeManager /></main>;
}
