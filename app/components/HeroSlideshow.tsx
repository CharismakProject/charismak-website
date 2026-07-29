"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Download,
  MapPin,
} from "lucide-react";
import { useEffect, useState } from "react";

export type HeroSlide = {
  title: string;
  subtitle: string;
  description: string;
  image: string;
  location?: string;
  href: string;
};

type HeroSlideshowProps = {
  slides: HeroSlide[];
};

export default function HeroSlideshow({
  slides,
}: HeroSlideshowProps) {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;

    const interval = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 7000);

    return () => window.clearInterval(interval);
  }, [slides.length]);

  if (slides.length === 0) return null;

  const goPrevious = () => {
    setActiveSlide(
      (current) => (current - 1 + slides.length) % slides.length
    );
  };

  const goNext = () => {
    setActiveSlide((current) => (current + 1) % slides.length);
  };

  return (
    <section className="relative min-h-[88vh] overflow-hidden bg-[#071E33] text-white">
      {slides.map((slide, index) => (
        <div
          key={`${slide.title}-${slide.image}`}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === activeSlide ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <Image
            src={slide.image}
            alt={slide.title}
            fill
            priority={index === 0}
            sizes="100vw"
            className="object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-[#071E33]/98 via-[#0D3B66]/84 to-[#071E33]/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#071E33]/85 via-transparent to-[#071E33]/20" />
        </div>
      ))}

      <div className="relative mx-auto flex min-h-[88vh] max-w-7xl items-center px-5 py-24 md:px-8">
        <div className="max-w-4xl">
          <div
            key={activeSlide}
            className="animate-[fadeIn_700ms_ease-out]"
          >
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.3em] text-[#F2B544]">
              {slides[activeSlide].subtitle}
            </p>

            <h1 className="max-w-4xl text-5xl font-black leading-[1.02] tracking-tight md:text-7xl lg:text-[82px]">
              {slides[activeSlide].title}
            </h1>

            <p className="mt-7 max-w-2xl text-base leading-8 text-white/78 md:text-lg">
              {slides[activeSlide].description}
            </p>

            {slides[activeSlide].location && (
              <p className="mt-5 flex items-center gap-2 text-sm font-semibold text-white/75">
                <MapPin className="h-5 w-5 text-[#F2B544]" />
                {slides[activeSlide].location}
              </p>
            )}

            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                href={slides[activeSlide].href}
                className="inline-flex items-center gap-3 bg-[#A82B05] px-7 py-4 text-sm font-bold text-white transition hover:bg-[#C8A45D]"
              >
                View Project
                <ArrowRight className="h-5 w-5" />
              </Link>

              <Link
                href="/services"
                className="inline-flex items-center gap-3 border border-white/30 bg-white/5 px-7 py-4 text-sm font-bold text-white backdrop-blur transition hover:border-[#F2B544] hover:bg-white/10"
              >
                Our Services
                <Building2 className="h-5 w-5" />
              </Link>

              <Link
                href="/company-profile.pdf"
                className="inline-flex items-center gap-3 border border-white/30 bg-white/5 px-7 py-4 text-sm font-bold text-white backdrop-blur transition hover:border-[#F2B544] hover:bg-white/10"
              >
                Company Profile
                <Download className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-0 right-0 z-20">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 md:px-8">
          <div className="flex gap-2">
            {slides.map((slide, index) => (
              <button
                key={slide.title}
                onClick={() => setActiveSlide(index)}
                aria-label={`Show ${slide.title}`}
                className={`h-1 transition-all ${
                  index === activeSlide
                    ? "w-12 bg-[#F2B544]"
                    : "w-7 bg-white/35 hover:bg-white/60"
                }`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={goPrevious}
              aria-label="Previous slide"
              className="grid h-11 w-11 place-items-center border border-white/25 bg-[#071E33]/40 backdrop-blur transition hover:border-[#F2B544]"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <button
              onClick={goNext}
              aria-label="Next slide"
              className="grid h-11 w-11 place-items-center border border-white/25 bg-[#071E33]/40 backdrop-blur transition hover:border-[#F2B544]"
            >
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}