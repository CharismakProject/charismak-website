"use client";

import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  Expand,
  Images,
  PlayCircle,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type ProjectMediaGalleryProps = {
  title: string;
  images: string[];
  videos?: string[];
};

export default function ProjectMediaGallery({
  title,
  images,
  videos = [],
}: ProjectMediaGalleryProps) {
  const validImages = useMemo(
    () => images.filter((image) => image && image.trim() !== ""),
    [images]
  );

  const validVideos = useMemo(
    () => videos.filter((video) => video && video.trim() !== "").slice(0, 1),
    [videos]
  );

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const activeImage = validImages[activeImageIndex];

  const showPreviousImage = () => {
    if (validImages.length === 0) return;

    setActiveImageIndex((current) =>
      current === 0 ? validImages.length - 1 : current - 1
    );
  };

  const showNextImage = () => {
    if (validImages.length === 0) return;

    setActiveImageIndex((current) =>
      current === validImages.length - 1 ? 0 : current + 1
    );
  };

  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setLightboxOpen(false);
      }

      if (event.key === "ArrowLeft") {
        showPreviousImage();
      }

      if (event.key === "ArrowRight") {
        showNextImage();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [lightboxOpen, validImages.length]);

  if (validImages.length === 0 && validVideos.length === 0) {
    return (
      <div className="border border-[#0D3B66]/10 bg-[#F5F7FA] px-6 py-16 text-center">
        <Images className="mx-auto h-10 w-10 text-[#C8A45D]" />

        <h3 className="mt-5 text-xl font-bold text-[#0D3B66]">
          Project media is being prepared.
        </h3>

        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[#3A4653]">
          Selected project images and visual documentation will be added to
          this project profile.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-14">
        {validImages.length > 0 && (
          <section>
            <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#C8A45D]">
                  Project Gallery
                </p>

                <h3 className="mt-3 text-2xl font-bold text-[#0D3B66] md:text-3xl">
                  Selected visual records
                </h3>
              </div>

              <p className="text-sm font-semibold text-[#3A4653]">
                {String(activeImageIndex + 1).padStart(2, "0")} /{" "}
                {String(validImages.length).padStart(2, "0")}
              </p>
            </div>

            <div className="grid gap-5 lg:grid-cols-[1fr_190px]">
              <div className="group relative min-h-[360px] overflow-hidden bg-[#071E33] sm:min-h-[500px] lg:min-h-[620px]">
                {activeImage && (
                  <Image
                    src={activeImage}
                    alt={`${title} project image ${activeImageIndex + 1}`}
                    fill
                    sizes="(max-width: 1024px) 100vw, 75vw"
                    className="object-contain"
                    priority={activeImageIndex === 0}
                  />
                )}

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#071E33]/30 via-transparent to-transparent" />

                <button
                  type="button"
                  onClick={() => setLightboxOpen(true)}
                  className="absolute right-5 top-5 inline-flex items-center gap-2 bg-[#071E33]/80 px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-white backdrop-blur transition hover:bg-[#A82B05]"
                  aria-label="Open fullscreen gallery"
                >
                  <Expand className="h-4 w-4" />
                  Fullscreen
                </button>

                {validImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={showPreviousImage}
                      className="absolute left-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center border border-white/20 bg-[#071E33]/65 text-white backdrop-blur transition hover:bg-[#A82B05]"
                      aria-label="Previous project image"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>

                    <button
                      type="button"
                      onClick={showNextImage}
                      className="absolute right-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center border border-white/20 bg-[#071E33]/65 text-white backdrop-blur transition hover:bg-[#A82B05]"
                      aria-label="Next project image"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  </>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:max-h-[620px] lg:grid-cols-1 lg:overflow-y-auto lg:pr-1">
                {validImages.map((image, index) => (
                  <button
                    type="button"
                    key={`${image}-${index}`}
                    onClick={() => setActiveImageIndex(index)}
                    className={`relative min-h-[105px] overflow-hidden border-2 bg-[#E9EEF3] transition ${
                      index === activeImageIndex
                        ? "border-[#A82B05]"
                        : "border-transparent hover:border-[#C8A45D]"
                    }`}
                    aria-label={`Show project image ${index + 1}`}
                  >
                    <Image
                      src={image}
                      alt={`${title} thumbnail ${index + 1}`}
                      fill
                      sizes="190px"
                      className="object-cover"
                    />

                    <div
                      className={`absolute inset-0 transition ${
                        index === activeImageIndex
                          ? "bg-transparent"
                          : "bg-[#071E33]/20 hover:bg-transparent"
                      }`}
                    />

                    <span className="absolute bottom-2 left-2 grid h-7 w-7 place-items-center bg-[#071E33]/80 text-[10px] font-bold text-white">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {validVideos.length > 0 && (
          <section className="border-t border-[#0D3B66]/10 pt-14">
            <div className="mb-7 flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center bg-[#A82B05] text-white">
                <PlayCircle className="h-6 w-6" />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#C8A45D]">
                  Project Video
                </p>

                <h3 className="mt-1 text-2xl font-bold text-[#0D3B66]">
                  Project documentation
                </h3>
              </div>
            </div>

            <div className="overflow-hidden bg-black shadow-[0_25px_70px_rgba(7,30,51,0.16)]">
              <video
                controls
                playsInline
                preload="metadata"
                className="max-h-[720px] w-full object-contain"
              >
                <source src={validVideos[0]} type="video/mp4" />

                Your browser does not support the video element.
              </video>
            </div>
          </section>
        )}
      </div>

      {lightboxOpen && activeImage && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={`${title} fullscreen gallery`}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute right-5 top-5 z-20 grid h-12 w-12 place-items-center border border-white/20 bg-black/40 text-white backdrop-blur transition hover:bg-[#A82B05]"
            aria-label="Close fullscreen gallery"
          >
            <X className="h-6 w-6" />
          </button>

          <div className="relative h-[85vh] w-full max-w-7xl">
            <Image
              src={activeImage}
              alt={`${title} fullscreen image ${activeImageIndex + 1}`}
              fill
              sizes="100vw"
              className="object-contain"
              priority
            />
          </div>

          {validImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={showPreviousImage}
                className="absolute left-4 top-1/2 z-20 grid h-14 w-14 -translate-y-1/2 place-items-center border border-white/20 bg-black/40 text-white backdrop-blur transition hover:bg-[#A82B05] sm:left-8"
                aria-label="Previous fullscreen image"
              >
                <ChevronLeft className="h-7 w-7" />
              </button>

              <button
                type="button"
                onClick={showNextImage}
                className="absolute right-4 top-1/2 z-20 grid h-14 w-14 -translate-y-1/2 place-items-center border border-white/20 bg-black/40 text-white backdrop-blur transition hover:bg-[#A82B05] sm:right-8"
                aria-label="Next fullscreen image"
              >
                <ChevronRight className="h-7 w-7" />
              </button>
            </>
          )}

          <div className="absolute bottom-5 left-1/2 z-20 -translate-x-1/2 bg-black/60 px-5 py-3 text-sm font-bold text-white backdrop-blur">
            {activeImageIndex + 1} of {validImages.length}
          </div>
        </div>
      )}
    </>
  );
}