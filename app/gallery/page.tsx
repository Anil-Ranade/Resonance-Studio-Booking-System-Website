"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight, X, ChevronLeft, ChevronRight } from "lucide-react";

const spaces = [
  {
    id: "studio-a",
    name: "Studio A",
    note: "Large room for full bands and big karaoke parties",
    meta: "Up to 30 people · from ₹350/hr",
    bookable: true,
    photos: [
      "/studios/main/studio_a.jpeg",
      "/studios/studio-a.jpeg",
      "/studios/studio-a-2.jpeg",
      "/studios/studio-a-3.jpeg",
      "/studios/studio-a-4.jpeg",
    ],
  },
  {
    id: "studio-b",
    name: "Studio B",
    note: "Medium room for karaoke groups and small acoustic sets",
    meta: "Up to 10 people · from ₹250/hr",
    bookable: true,
    photos: [
      "/studios/main/studio_b.jpeg",
      "/studios/studio-b-2.jpeg",
      "/studios/studio-b-3.jpeg",
      "/studios/studio-b-4.jpeg",
    ],
  },
  {
    id: "studio-c",
    name: "Studio C",
    note: "Compact room for recording, video and podcasts",
    meta: "Up to 5 people · from ₹200/hr",
    bookable: true,
    photos: [
      "/studios/main/studio_c.jpeg",
      "/studios/studio-c.jpeg",
      "/studios/studio-c-2.jpeg",
      "/studios/studio-c-3.jpeg",
    ],
  },
  {
    id: "lobby",
    name: "Lobby",
    note: "Where you wait, warm up and meet your band",
    meta: "Shared by all rooms",
    bookable: false,
    photos: ["/studios/common_area.jpeg", "/studios/logo.jpeg", "/studios/common_area_2.jpeg"],
  },
];

// Flat list so the lightbox can step through every photo in page order
const allPhotos = spaces.flatMap((space) =>
  space.photos.map((src, i) => ({ src, space, n: i + 1 })),
);
const indexOf = (src: string) => allPhotos.findIndex((p) => p.src === src);

export default function GalleryPage() {
  const [open, setOpen] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const current = open === null ? null : allPhotos[open];

  useEffect(() => {
    if (open === null) return;
    closeRef.current?.focus();
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((i) => (i === null ? i : (i + 1) % allPhotos.length));
      if (e.key === "ArrowLeft") setOpen((i) => (i === null ? i : (i - 1 + allPhotos.length) % allPhotos.length));
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const step = (d: number) =>
    setOpen((i) => (i === null ? i : (i + d + allPhotos.length) % allPhotos.length));

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <Link
          href="/home"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-10"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </Link>

        <header className="mb-10 flex flex-col-reverse lg:flex-row lg:items-center lg:justify-between gap-8">
          <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-fuchsia-400 mb-4">
            {allPhotos.length} photos · 3 studios and the lobby
          </p>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.02] max-w-3xl">
            Look around <span className="text-violet-400">before you book.</span>
          </h1>
          </div>
          <Image
            src="/gallery.png"
            alt="Gold vintage movie camera with a film strip showing a mic, guitar and drums"
            width={1254}
            height={1254}
            priority
            sizes="(min-width: 1024px) 320px, 224px"
            className="w-56 lg:w-80 shrink-0 self-center"
          />
        </header>

        <nav aria-label="Jump to a space" className="flex flex-wrap gap-2 mb-16 lg:mb-24">
          {spaces.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="px-4 py-2 rounded-full border border-white/10 bg-white/[0.03] text-sm text-zinc-200 hover:border-violet-400/50 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
            >
              {s.name} <span className="text-zinc-500">{s.photos.length}</span>
            </a>
          ))}
        </nav>

        <div className="space-y-20 lg:space-y-28 mb-24">
          {spaces.map((space) => (
            <section
              key={space.id}
              id={space.id}
              aria-labelledby={`${space.id}-title`}
              className="scroll-mt-28 grid lg:grid-cols-12 gap-6 lg:gap-12"
            >
              {/* Room label: stays in view while its photos scroll past */}
              <div className="lg:col-span-3">
                <div className="lg:sticky lg:top-28 border-t border-violet-400/60 pt-5">
                  <h2 id={`${space.id}-title`} className="text-3xl font-bold text-white tracking-tight mb-2">
                    {space.name}
                  </h2>
                  <p className="text-zinc-300 mb-2">{space.note}</p>
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-400 mb-6">{space.meta}</p>
                  {space.bookable && (
                    <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
                      <Link href="/booking/new" className="group inline-flex items-center gap-1.5 text-violet-400 hover:text-violet-300">
                        Book {space.name}
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                      <Link href={`/studios#${space.id}`} className="text-zinc-400 hover:text-white">
                        Room details
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact sheet: lead photo full width, the rest in 2 or 3 columns so rows never leave a gap */}
              <div
                className={`lg:col-span-9 grid grid-cols-2 gap-3 ${
                  (space.photos.length - 1) % 2 ? "sm:grid-cols-3" : ""
                }`}
              >
                {space.photos.map((src, i) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setOpen(indexOf(src))}
                    className={`group relative rounded-2xl overflow-hidden bg-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-navy ${
                      i === 0
                        ? "col-span-full aspect-[16/9]"
                        : i === space.photos.length - 1 && (space.photos.length - 1) % 2
                          ? "col-span-2 sm:col-span-1 aspect-[16/9] sm:aspect-[4/3]"
                          : "aspect-[4/3]"
                    }`}
                    aria-label={`Open ${space.name} photo ${i + 1} of ${space.photos.length}`}
                  >
                    <Image
                      src={src}
                      alt=""
                      fill
                      sizes={i === 0 ? "(min-width: 1024px) 70vw, 100vw" : "(min-width: 1024px) 24vw, 50vw"}
                      className="object-cover group-hover:scale-[1.03] transition-transform duration-500 motion-reduce:transition-none"
                    />
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {current && open !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${current.space.name}, photo ${current.n} of ${current.space.photos.length}`}
          className="fixed inset-0 z-[60] flex flex-col bg-zinc-950/95 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between gap-4 px-4 sm:px-8 py-4">
            <p className="text-sm text-zinc-300">
              <span className="text-white font-semibold">{current.space.name}</span>
              <span className="text-zinc-500"> · {current.n} of {current.space.photos.length}</span>
            </p>
            <div className="flex items-center gap-3">
              {current.space.bookable && (
                <Link
                  href="/booking/new"
                  className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-400 hover:bg-violet-300 text-navy text-sm font-semibold"
                >
                  Book {current.space.name}
                </Link>
              )}
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(null)}
                aria-label="Close gallery"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="relative flex-1 mx-4 sm:mx-20 mb-6" onClick={() => setOpen(null)}>
            <Image src={current.src} alt={`${current.space.name}, photo ${current.n}`} fill sizes="100vw" className="object-contain" />
          </div>

          <button
            type="button"
            onClick={() => step(-1)}
            aria-label="Previous photo"
            className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label="Next photo"
            className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
}
