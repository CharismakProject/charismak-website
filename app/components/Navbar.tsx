"use client";

import Image from "next/image";
import Link from "next/link";
import { Download, Menu, Phone, X } from "lucide-react";
import { useState } from "react";
import { company } from "../site-data";

const navItems = [
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Projects", href: "/projects" },
  { label: "Estimate", href: "/estimator" },
  { label: "Prices", href: "/prices" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const whatsappLink =
    "https://wa.me/2347066619598?text=Hello%20Charismak%20Project%2C%20I%20would%20like%20to%20discuss%20a%20construction%20project.";

  return (
    <>
      <header className="fixed left-0 top-0 z-[120] w-full border-b border-white/10 bg-[#0D3B66]/90 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 md:px-8">
          <Link href="/" className="flex items-center gap-4">
            <div className="relative h-12 w-12 overflow-hidden bg-white">
              <Image
                src={company.logo}
                alt="Charismak Logo"
                fill
                priority
                sizes="48px"
                className="object-contain"
              />
            </div>

            <div>
              <h2 className="text-xl font-black tracking-[0.2em] text-white md:text-2xl">
                CHARISMAK
              </h2>
              <p className="text-xs font-medium text-white/70">
                Project Nigeria Limited
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-4 xl:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-semibold text-white/80 transition hover:text-[#C8A45D]"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <Link
              href="/company-profile.pdf"
              className="hidden items-center gap-2 border border-white/25 px-4 py-3 text-sm font-bold text-white transition hover:border-[#C8A45D] hover:text-[#C8A45D] 2xl:inline-flex"
            >
              Profile <Download className="h-4 w-4" />
            </Link>

            <Link
              href="/quote"
              className="inline-flex items-center gap-2 bg-[#C8A45D] px-5 py-3 text-sm font-bold text-[#071E33] transition hover:bg-[#F2B544]"
            >
              Get a Quote
            </Link>

            <Link
              href={whatsappLink}
              target="_blank"
              className="inline-flex items-center gap-2 bg-[#8B1E00] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#C8A45D]"
            >
              WhatsApp <Phone className="h-4 w-4" />
            </Link>
          </div>

          <button
            onClick={() => setMobileOpen(true)}
            className="grid h-11 w-11 place-items-center border border-white/25 text-white xl:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-[200] bg-[#0D3B66] text-white xl:hidden">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-6">
            <div>
              <h2 className="text-2xl font-bold tracking-[0.22em]">
                CHARISMAK
              </h2>
              <p className="text-xs text-white/60">Project Nigeria Limited</p>
            </div>

            <button onClick={() => setMobileOpen(false)}>
              <X className="h-7 w-7" />
            </button>
          </div>

          <div className="flex flex-col px-5 py-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="border-b border-white/10 py-5 text-lg text-white/85"
              >
                {item.label}
              </Link>
            ))}

            <Link
              href="/quote"
              onClick={() => setMobileOpen(false)}
              className="mt-6 inline-flex items-center justify-center gap-2 bg-[#C8A45D] px-5 py-4 text-base font-bold text-[#071E33]"
            >
              Get a Quote
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
