import AdminNav from "@/components/admin/admin-nav";
import ProjectManager from "@/components/admin/project-manager";

export const metadata = { title: "Admin Projects" };

export default function AdminProjectsPage() {
  return (
    <main className="min-h-screen bg-[#F5F7FA] pt-20">
      <AdminNav />
      <ProjectManager />
    </main>
  );
}
