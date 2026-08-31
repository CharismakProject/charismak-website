"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Boxes, Building2, CircleDollarSign, LayoutDashboard, Settings2, Store, UserRoundCog, Users, Wrench } from "lucide-react";

const links = [
  { href: "/admin", label: "Control Centre", icon: LayoutDashboard },
  { href: "/admin/projects", label: "Projects", icon: Building2 },
  { href: "/admin/leadership", label: "Leadership", icon: Users },
  { href: "/admin/services", label: "Services", icon: Wrench },
  { href: "/blog/manage", label: "News & Learning", icon: BookOpen },
  { href: "/catalogue-admin", label: "Catalogue", icon: Boxes },
  { href: "/price-admin", label: "Market Prices", icon: CircleDollarSign },
  { href: "/admin/suppliers", label: "Supplier Profiles", icon: UserRoundCog },
  { href: "/admin/supplier-reviews", label: "Supplier Reviews", icon: Store },
  { href: "/admin/content", label: "Website Content", icon: Settings2 },
];

export default function AdminNav() {
  const pathname = usePathname();
  return <nav className="sticky top-20 z-40 border-b border-[#DCE4EC] bg-white/95 px-4 py-3 backdrop-blur md:px-8"><div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto pb-1">{links.map(({ href, label, icon: Icon }) => { const active = href === "/admin" ? pathname === href : pathname.startsWith(href); return <Link key={href} href={href} className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-3.5 text-xs font-black transition ${active ? "bg-[#071E33] text-white" : "bg-[#F5F7FA] text-[#526579] hover:bg-[#EAF0F5] hover:text-[#071E33]"}`}><Icon className="h-4 w-4" /> {label}</Link>; })}</div></nav>;
}
