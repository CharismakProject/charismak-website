import AdminNav from "@/components/admin/admin-nav";
import LeadershipManager from "@/components/admin/leadership-manager";

export const metadata = { title: "Admin Leadership" };

export default function AdminLeadershipPage() {
  return (
    <main className="min-h-screen bg-[#F5F7FA] pt-20">
      <AdminNav />
      <LeadershipManager />
    </main>
  );
}
