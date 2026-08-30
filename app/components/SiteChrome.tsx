"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import Footer from "./Footer";
import Navbar from "./Navbar";

export default function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const estimatorApp = pathname.startsWith("/estimator/app");

  if (estimatorApp) return children;

  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}
