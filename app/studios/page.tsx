"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";

// Meter scale: the biggest room fills the meter
const LIVE_MAX = 12;
const KARAOKE_MAX = 30;
const SEGMENTS = 12;

const studios = [
  {
    id: "studio-a",
    letter: "A",
    size: "Large",
    bestFor: "Full bands and big karaoke parties",
    description:
      "Our largest room, with a full backline set up and ready. Bring your sticks and play.",
    live: { label: "10-12 musicians", value: 12 },
    karaoke: { label: "Up to 30 people", value: 30 },
    gear: [
      "Yamaha Silver Star drum kit with cymbals",
      "Two electric guitars",
      "Keyboard",
      "Two guitar amps",
      "Bass amp",
      "Professional sound system",
      '65" karaoke screen',
      "Climate controlled",
    ],
    price: 350,
    images: [
      "/studios/main/studio_a.jpeg",
      "/studios/studio-a.jpeg",
      "/studios/studio-a-2.jpeg",
      "/studios/studio-a-3.jpeg",
      "/studios/studio-a-4.jpeg",
    ],
  },
  {
    id: "studio-b",
    letter: "B",
    size: "Medium",
    bestFor: "Karaoke groups and small acoustic sets",
    description:
      "A flexible mid-sized room with comfortable seating. Most karaoke groups book this one.",
    live: { label: "4-5 musicians", value: 5 },
    karaoke: { label: "Up to 10 people", value: 10 },
    gear: [
      '46" karaoke screen',
      "Professional sound system",
      "Comfortable seating area",
      "Climate controlled",
    ],
    price: 250,
    images: [
      "/studios/main/studio_b.jpeg",
      "/studios/studio-b-2.jpeg",
      "/studios/studio-b-3.jpeg",
      "/studios/studio-b-4.jpeg",
    ],
  },
  {
    id: "studio-c",
    letter: "C",
    size: "Compact",
    bestFor: "Recording, video and podcasts",
    description:
      "Built for audio and video recording. Also works well for podcasts and duo rehearsals.",
    live: { label: "Up to 2 musicians", value: 2 },
    karaoke: { label: "Up to 5 people", value: 5 },
    gear: [
      "Professional recording equipment",
      "Video recording setup",
      "Podcast ready",
      "Climate controlled",
    ],
    price: 200,
    images: [
      "/studios/main/studio_c.jpeg",
      "/studios/studio-c.jpeg",
      "/studios/studio-c-2.jpeg",
      "/studios/studio-c-3.jpeg",
    ],
  },
];

type Studio = (typeof studios)[number];

function Meter({ label, detail, value, max }: { label: string; detail: string; value: number; max: number }) {
  const lit = Math.max(1, Math.round((value / max) * SEGMENTS));
  return (
    <div>
      <div className="flex justify-between text-xs font-medium uppercase tracking-[0.14em] mb-2">
        <span className="text-zinc-400">{label}</span>
        <span className="text-white">{detail}</span>
      </div>
      <div className="flex gap-1" role="img" aria-label={`${label}: ${detail}`}>
        {Array.from({ length: SEGMENTS }, (_, i) => (
          <span
            key={i}
            className={`h-2.5 flex-1 rounded-[2px] ${
              i >= lit ? "bg-white/[0.07]" : i >= SEGMENTS - 2 ? "bg-fuchsia-400" : "bg-violet-400"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function StudioSection({ studio, flip }: { studio: Studio; flip: boolean }) {
  const [active, setActive] = useState(0);

  return (
    <section id={studio.id} className="scroll-mt-28 grid lg:grid-cols-12 gap-8 lg:gap-14 items-start">
      {/* Photos */}
      <div className={`lg:col-span-7 ${flip ? "lg:order-2" : ""}`}>
        <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-zinc-900 border border-white/10">
          <Image
            key={studio.images[active]}
            src={studio.images[active]}
            alt={`Studio ${studio.letter}, photo ${active + 1} of ${studio.images.length}`}
            fill
            sizes="(min-width: 1024px) 58vw, 100vw"
            className="object-cover"
            priority={studio.letter === "A"}
          />
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {studio.images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show photo ${i + 1}`}
              aria-pressed={i === active}
              className={`relative shrink-0 w-20 h-14 sm:w-24 sm:h-16 rounded-lg overflow-hidden border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${
                i === active ? "border-violet-400" : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              <Image src={src} alt="" fill sizes="96px" className="object-cover" />
            </button>
          ))}
        </div>
      </div>

      {/* Details */}
      <div className={`lg:col-span-5 lg:pt-4 ${flip ? "lg:order-1" : ""}`}>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-fuchsia-400 mb-3">
          {studio.size} room
        </p>
        <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-3">
          Studio <span className="font-bold text-violet-400">{studio.letter}</span>
        </h2>
        <p className="text-lg text-white mb-2">{studio.bestFor}</p>
        <p className="text-zinc-400 leading-relaxed mb-8">{studio.description}</p>

        <div className="space-y-5 mb-8">
          <Meter label="Live band" detail={studio.live.label} value={studio.live.value} max={LIVE_MAX} />
          <Meter label="Karaoke" detail={studio.karaoke.label} value={studio.karaoke.value} max={KARAOKE_MAX} />
        </div>

        <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-400 mb-3">In the room</p>
        <ul className="grid sm:grid-cols-2 gap-x-6 mb-10 border-t border-white/10">
          {studio.gear.map((item) => (
            <li key={item} className="py-2.5 border-b border-white/10 text-sm text-zinc-200">
              {item}
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-5">
          <Link
            href="/booking/new"
            className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-violet-400 hover:bg-violet-300 text-navy font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy"
          >
            Book Studio {studio.letter}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <p className="text-sm text-zinc-400">
            <span className="text-2xl font-bold text-white">₹{studio.price}</span> / hour
          </p>
        </div>
      </div>
    </section>
  );
}

export default function StudiosPage() {
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

        {/* Header */}
        <header className="mb-14 lg:mb-20">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-fuchsia-400 mb-4">
            Three rooms · Dattawadi, Pune
          </p>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.02] max-w-3xl">
            Find the room that <span className="font-bold text-violet-400">fits your sound.</span>
          </h1>
        </header>

        {/* Room picker */}
        <nav aria-label="Jump to a studio" className="grid sm:grid-cols-3 gap-3 mb-20 lg:mb-28">
          {studios.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="group flex items-center gap-4 p-4 rounded-2xl border border-white/10 bg-white/[0.03] hover:border-violet-400/50 hover:bg-white/[0.06] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
            >
              <span className="font-bold text-5xl leading-none text-violet-400 w-12 text-center">
                {s.letter}
              </span>
              <span className="flex-1">
                <span className="block text-white font-semibold">{s.bestFor}</span>
                <span className="block text-xs font-medium uppercase tracking-[0.14em] text-zinc-400 mt-1">
                  {s.karaoke.label} · ₹{s.price}/hr
                </span>
              </span>
              <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-violet-400 rotate-90 transition-colors" />
            </a>
          ))}
        </nav>

        <div className="space-y-24 lg:space-y-36 mb-24">
          {studios.map((studio, i) => (
            <StudioSection key={studio.id} studio={studio} flip={i % 2 === 1} />
          ))}
        </div>
      </div>
    </div>
  );
}
