import type { Metadata } from "next";
import AdminNav from "@/components/admin/admin-nav";
import ServiceManager from "@/components/admin/service-manager";

export const metadata: Metadata = { title: "Services | Charismak Admin", robots: { index:false, follow:false, nocache:true } };
export default function AdminServicesPage(){return <main className="min-h-screen bg-[#F5F7FA] pt-20"><AdminNav/><ServiceManager/></main>}
