"use client";

import { useRef, useState } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

const SKIP = ["/admin", "/staff", "/display"];
const COUNT_S = 2; // 0 -> 100 takes exactly this long
const FADE_S = 0.4;

// First-visit splash: counts 0 -> 100 over 2s while the bar fills, then fades out.
// Mounted once in the root layout, so client-side navigation never shows it again.
export default function Preloader() {
  const pathname = usePathname();
  const [done, setDone] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLDivElement>(null);
  const head = useRef<HTMLDivElement>(null);
  const pct = useRef<HTMLSpanElement>(null);
  const skip = SKIP.some((p) => pathname?.startsWith(p));

  useGSAP(
    () => {
      if (skip) return;
      const progress = { value: 0 };

      gsap
        .timeline({
          onComplete: () => {
            setDone(true);
            window.dispatchEvent(new Event("preloader:done")); // SiteMotion starts the hero intro
          },
        })
        .to(progress, {
          value: 100,
          duration: COUNT_S,
          ease: "none", // linear so every number from 0 to 100 shows
          onUpdate: () => {
            const v = Math.round(progress.value);
            if (fill.current) fill.current.style.width = `${progress.value}%`;
            if (head.current) head.current.style.left = `${progress.value}%`;
            if (pct.current) pct.current.textContent = String(v);
          },
        })
        .to(root.current, { autoAlpha: 0, duration: FADE_S, ease: "power2.inOut" }, "+=0.1");
    },
    { scope: root },
  );

  if (skip || done) return null;

  return (
    <div
      id="preloader"
      ref={root}
      role="progressbar"
      aria-label="Loading Resonance Studio"
      aria-valuemin={0}
      aria-valuemax={100}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-10 bg-[#101c3d] px-6"
    >
      <noscript>
        <style>{"#preloader{display:none}"}</style>
      </noscript>

      <p className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
        Resonance <span className="text-violet-400">Studio</span>
      </p>

      <div className="w-full max-w-sm">
        <div className="mb-4 flex items-end justify-between">
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-400">
            Tuning up
          </span>
          <span className="font-bold text-violet-400 tabular-nums leading-none">
            <span ref={pct} className="text-5xl">0</span>
            <span className="text-xl align-top ml-0.5">%</span>
          </span>
        </div>

        {/* Track */}
        <div className="relative h-2.5 rounded-full bg-white/[0.07] ring-1 ring-white/10">
          {/* Fill: champagne to rose, with a moving sheen */}
          <div
            ref={fill}
            className="preloader-fill absolute inset-y-0 left-0 w-0 rounded-full bg-gradient-to-r from-violet-500 via-violet-300 to-fuchsia-400 overflow-hidden"
          />
          {/* Glowing playhead at the leading edge */}
          <div
            ref={head}
            className="absolute top-1/2 left-0 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_14px_4px_rgba(247,215,148,0.7)]"
          />
        </div>

        {/* Tick marks every 25% */}
        <div className="mt-2 flex justify-between px-px">
          {[0, 25, 50, 75, 100].map((t) => (
            <span key={t} className="h-1.5 w-px bg-white/20" />
          ))}
        </div>
      </div>
    </div>
  );
}
