"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Menu, Phone, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { company } from "../site-data";

const navItems = [
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Projects", href: "/projects" },
];

const toolItems = [
  { label: "Cost Estimator", href: "/estimator", description: "Early budget range for your project" },
  { label: "Material Prices", href: "/prices", description: "Abuja prices with source and date" },
  { label: "Rate Bank", href: "/rates", description: "Build-ups for common construction work" },
  { label: "Supplier Directory", href: "/marketplace", description: "Suppliers and artisans" },
  { label: "News & Learning", href: "/blog", description: "Guides and company updates" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const toolsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!toolsOpen) return;
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent ? event.key === "Escape" : !toolsRef.current?.contains(event.target as Node)) setToolsOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [toolsOpen]);

  const whatsappLink =
    "https://wa.me/2347066619598?text=Hello%20Charismak%20Project%2C%20I%20would%20like%20to%20discuss%20a%20construction%20project.";

  return (
    <>
      <header className="fixed left-0 top-0 z-[120] w-full border-b border-[#0D3B66]/10 bg-white/96 shadow-[0_4px_24px_rgba(7,30,51,0.05)] backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 md:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative h-11 w-11 overflow-hidden">
              <Image
                src={company.logo}
                alt="Charismak Logo"
                fill
                priority
                sizes="44px"
                className="object-contain"
              />
            </div>
            <div className="leading-none">
              <h2 className="text-xl font-black tracking-[0.09em] text-[#0D3B66] md:text-2xl">
                CHARISMAK
              </h2>
              <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#3A4653]/70">
                Project Nigeria Limited
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-5 xl:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-[13px] font-semibold text-[#151B22] transition hover:text-[#0D3B66]"
              >
                {item.label}
              </Link>
            ))}
            <div ref={toolsRef} className="relative" onMouseLeave={() => setToolsOpen(false)}>
              <button
                type="button"
                aria-expanded={toolsOpen}
                aria-haspopup="true"
                onClick={(event) => setToolsOpen((open) => (event.detail === 0 ? !open : true))}
                onMouseEnter={() => setToolsOpen(true)}
                className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#151B22] transition hover:text-[#0D3B66]"
              >
                Construction Tools <ChevronDown className={`h-3.5 w-3.5 transition ${toolsOpen ? "rotate-180" : ""}`} />
              </button>
              {toolsOpen ? (
                <div className="absolute left-1/2 top-full w-72 -translate-x-1/2 pt-3">
                  <ul className="border border-[#0D3B66]/10 bg-white p-2 shadow-[0_18px_40px_rgba(7,30,51,0.14)]">
                    {toolItems.map((item) => (
                      <li key={item.href}>
                        <Link href={item.href} onClick={() => setToolsOpen(false)} className="block px-3 py-2.5 transition hover:bg-[#F5F7FA] focus:bg-[#F5F7FA] focus:outline-none">
                          <span className="block text-sm font-semibold text-[#071E33]">{item.label}</span>
                          <span className="block text-xs text-[#617286]">{item.description}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
            <Link href="/contact" className="text-[13px] font-semibold text-[#151B22] transition hover:text-[#0D3B66]">
              Contact
            </Link>
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <Link
              href="/quote"
              className="inline-flex items-center gap-2 bg-[#071E33] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0D3B66]"
            >
              Get a Quote
            </Link>
            <Link
              href={whatsappLink}
              target="_blank"
              aria-label="Chat with Charismak on WhatsApp"
              className="grid h-11 w-11 place-items-center border border-[#0D3B66]/15 text-[#0D3B66] transition hover:border-[#C8A45D] hover:bg-[#C8A45D] hover:text-[#071E33]"
            >
              <Phone className="h-4 w-4" />
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
            className="grid h-11 w-11 place-items-center border border-[#0D3B66]/15 text-[#0D3B66] xl:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-[200] overflow-y-auto bg-[#071E33] text-white xl:hidden">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
            <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-3">
              <div className="relative h-10 w-10 bg-white">
                <Image
                  src={company.logo}
                  alt="Charismak Logo"
                  fill
                  sizes="40px"
                  className="object-contain"
                />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-[0.14em]">CHARISMAK</h2>
                <p className="mt-1 text-[9px] uppercase tracking-[0.2em] text-white/55">
                  Project Nigeria Limited
                </p>
              </div>
            </Link>

            <button
              type="button"
              aria-label="Close navigation"
              onClick={() => setMobileOpen(false)}
              className="grid h-11 w-11 place-items-center border border-white/15"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="flex flex-col px-5 py-7">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="border-b border-white/10 py-4 text-lg text-white/82 transition hover:text-[#F2B544]"
              >
                {item.label}
              </Link>
            ))}
            <p className="pb-2 pt-6 text-xs font-bold uppercase tracking-[0.2em] text-[#F2B544]">Construction Tools</p>
            {toolItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="border-b border-white/10 py-3 text-base text-white/82 transition hover:text-[#F2B544]"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/contact"
              onClick={() => setMobileOpen(false)}
              className="mt-4 border-b border-white/10 py-4 text-lg text-white/82"
            >
              Contact
            </Link>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <Link
                href="/quote"
                onClick={() => setMobileOpen(false)}
                className="inline-flex items-center justify-center bg-[#C8A45D] px-5 py-4 text-base font-bold text-[#071E33]"
              >
                Get a Quote
              </Link>
              <Link
                href={whatsappLink}
                target="_blank"
                onClick={() => setMobileOpen(false)}
                className="inline-flex items-center justify-center gap-2 border border-white/20 px-5 py-4 text-base font-bold text-white"
              >
                WhatsApp <Phone className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
