"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Pause, Play } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export type SiteUpdateSlide = {
  id: string;
  image: string;
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
      className="relative overflow-hidden rounded-2xl bg-[#071E33]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Ongoing project photos"
    >
      <div className="relative h-[420px] md:h-[540px]">
        {slides.map((item, index) => (
          <Image
            key={item.id}
            src={item.image}
            alt={`${item.projectTitle}: ${item.title}`}
            fill
            sizes="(max-width: 1280px) 100vw, 1280px"
            priority={index === 0}
            loading={index === 0 ? undefined : "lazy"}
            className={`object-cover transition-opacity duration-700 ${index === active ? "opacity-100" : "opacity-0"}`}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-[#071E33]/90 via-[#071E33]/20 to-transparent" />
      </div>

      <div className="absolute inset-x-0 bottom-0 p-5 text-white md:p-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#F2B544]">
          {slide.projectTitle}
          {slide.location ? <span className="text-white/60"> · {slide.location}</span> : null}
          {slide.date ? <span className="text-white/60"> · {slide.date}</span> : null}
        </p>
        <h3 className="mt-2 max-w-2xl text-xl font-semibold leading-snug md:text-2xl">{slide.title}</h3>
        {slide.summary ? <p className="mt-2 line-clamp-2 max-w-2xl text-sm leading-6 text-white/75">{slide.summary}</p> : null}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <Link href={slide.href} className="inline-flex items-center gap-2 text-sm font-bold text-white hover:text-[#F2B544]">
            View project <ArrowRight className="h-4 w-4" />
          </Link>

          {count > 1 ? (
            <div className="flex items-center gap-3">
              <div className="hidden gap-1.5 sm:flex">
                {slides.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActive(index)}
                    aria-label={`Show photo ${index + 1} of ${count}`}
                    aria-current={index === active}
                    className={`h-1.5 rounded-full transition-all ${index === active ? "w-6 bg-[#F2B544]" : "w-1.5 bg-white/45 hover:bg-white"}`}
                  />
                ))}
              </div>
              <span className="text-xs text-white/60 sm:hidden">{active + 1} / {count}</span>
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
                  className="grid h-9 w-9 place-items-center rounded-full border border-white/30 text-white transition hover:border-[#F2B544] hover:text-[#F2B544]"
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
