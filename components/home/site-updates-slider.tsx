"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Pause, Play } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export type SiteUpdateSlide = {
  id: string;
  image: string;
  alt?: string;
  projectTitle: string;
  location: string;
  title: string;
  summary: string;
  date: string;
  href: string;
};

const INTERVAL_MS = 5000;

export default function SiteUpdatesSlider({ slides }: { slides: SiteUpdateSlide[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;

  const go = useCallback((step: number) => setActive((current) => (current + step + count) % count), [count]);

  useEffect(() => {
    if (count <= 1 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => go(1), INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [count, paused, go]);

  if (!count) return null;
  const slide = slides[active];

  return (
    <div
      className="overflow-hidden rounded-2xl border border-black/10 bg-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Ongoing project photos"
    >
      <div className="relative h-[340px] bg-[#EEF2F6] md:h-[520px]">
        {slides.map((item, index) => (
          <Image
            key={item.id}
            src={item.image}
            alt={item.alt || `${item.projectTitle}: ${item.title}`}
            fill
            sizes="(max-width: 1280px) 100vw, 1280px"
            priority={index === 0}
            loading={index === 0 ? undefined : "lazy"}
            quality={90}
            className={`object-contain transition-opacity duration-700 ${index === active ? "opacity-100" : "opacity-0"}`}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
        <Link href={slide.href} className="min-w-0 flex-1 text-[#071E33] hover:text-[#A82B05]">
          <p className="truncate text-[11px] font-bold uppercase tracking-[0.14em] text-[#A82B05]">{slide.projectTitle}</p>
          <p className="truncate text-sm font-semibold md:text-base">{slide.title}</p>
        </Link>
        {count > 1 ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#617286]">{active + 1} / {count}</span>
            {[
              { label: paused ? "Play slideshow" : "Pause slideshow", icon: paused ? Play : Pause, onClick: () => setPaused((value) => !value) },
              { label: "Previous photo", icon: ArrowLeft, onClick: () => go(-1) },
              { label: "Next photo", icon: ArrowRight, onClick: () => go(1) },
            ].map(({ label, icon: Icon, onClick }) => (
              <button
                key={label}
                type="button"
                onClick={onClick}
                aria-label={label}
                className="grid h-8 w-8 place-items-center rounded-full border border-black/15 text-[#071E33] transition hover:border-[#A82B05] hover:text-[#A82B05]"
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
