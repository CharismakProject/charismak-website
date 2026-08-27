"use client";

import Image from "next/image";
import Link from "next/link";
import { Download, Menu, Phone, X } from "lucide-react";
import { usePathname } from "next/navigation";
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
  const pathname = usePathname();

  const whatsappLink =
    "https://wa.me/2347066619598?text=Hello%20Charismak%20Project%2C%20I%20would%20like%20to%20discuss%20a%20construction%20project.";

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

  return (
    <>
      <header className="fixed left-0 top-0 z-[120] w-full border-b border-white/10 bg-[#0D3B66]/95 shadow-[0_12px_40px_rgba(7,30,51,0.14)] backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 md:px-8">
          <Link href="/" className="group flex items-center gap-3.5">
            <div className="relative h-11 w-11 overflow-hidden rounded-lg bg-white shadow-[0_6px_18px_rgba(0,0,0,0.14)] ring-1 ring-white/20 md:h-12 md:w-12">
              <Image
                src={company.logo}
                alt="Charismak Logo"
                fill
                priority
                sizes="48px"
                className="object-contain"
              />
            </div>

            <div className="leading-none">
              <h2 className="text-lg font-black tracking-[0.2em] text-white md:text-xl">
                CHARISMAK
              </h2>
              <p className="mt-1.5 text-[11px] font-medium tracking-wide text-white/65 md:text-xs">
                Project Nigeria Limited
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 xl:flex">
            {navItems.map((item) => {
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    active
                      ? "bg-white/10 text-[#F2B544]"
                      : "text-white/80 hover:bg-white/5 hover:text-[#C8A45D]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-2.5 lg:flex">
            <Link
              href="/company-profile.pdf"
              className="hidden items-center gap-2 rounded-xl border border-white/20 px-4 py-3 text-sm font-bold text-white transition hover:border-[#C8A45D] hover:bg-white/5 hover:text-[#C8A45D] 2xl:inline-flex"
            >
              Profile <Download className="h-4 w-4" />
            </Link>

            <Link
              href="/quote"
              className="inline-flex items-center gap-2 rounded-xl bg-[#C8A45D] px-5 py-3 text-sm font-bold text-[#071E33] shadow-[0_8px_22px_rgba(200,164,93,0.18)] transition hover:-translate-y-0.5 hover:bg-[#F2B544]"
            >
              Get a Quote
            </Link>

            <Link
              href={whatsappLink}
              target="_blank"
              className="inline-flex items-center gap-2 rounded-xl bg-[#8B1E00] px-5 py-3 text-sm font-bold text-white shadow-[0_8px_22px_rgba(139,30,0,0.18)] transition hover:-translate-y-0.5 hover:bg-[#A82B05]"
            >
              WhatsApp <Phone className="h-4 w-4" />
            </Link>
          </div>

          <button
            onClick={() => setMobileOpen(true)}
            className="grid h-11 w-11 place-items-center rounded-xl border border-white/20 bg-white/5 text-white transition hover:bg-white/10 xl:hidden"
            aria-label="Open navigation menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-[200] bg-[#071E33] text-white xl:hidden">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
            <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-3">
              <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-white">
                <Image src={company.logo} alt="Charismak Logo" fill sizes="40px" className="object-contain" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-[0.2em]">CHARISMAK</h2>
                <p className="mt-1 text-xs text-white/60">Project Nigeria Limited</p>
              </div>
            </Link>

            <button
              onClick={() => setMobileOpen(false)}
              className="grid h-11 w-11 place-items-center rounded-xl border border-white/15 bg-white/5"
              aria-label="Close navigation menu"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="flex h-[calc(100dvh-82px)] flex-col overflow-y-auto px-5 py-6">
            <div className="grid gap-1">
              {navItems.map((item) => {
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`rounded-xl px-4 py-4 text-base font-semibold transition ${
                      active
                        ? "bg-white/10 text-[#F2B544]"
                        : "text-white/85 hover:bg-white/5"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <div className="mt-auto grid gap-3 pt-8">
              <Link
                href="/quote"
                onClick={() => setMobileOpen(false)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#C8A45D] px-5 py-4 text-base font-bold text-[#071E33]"
              >
                Get a Quote
              </Link>

              <Link
                href={whatsappLink}
                target="_blank"
                onClick={() => setMobileOpen(false)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#8B1E00] px-5 py-4 text-base font-bold text-white"
              >
                WhatsApp <Phone className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
