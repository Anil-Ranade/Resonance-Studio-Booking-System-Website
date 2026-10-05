"use client";

// Site-wide GSAP motion for the public pages, driven by page structure so no
// page needs per-element markup:
//  - first block in <main> (the hero): staggered intro, floating illustration
//  - every later <section>/<header>: content fades up as it scrolls into view
// ponytail: selector heuristic, add data-attributes if a page needs exceptions.

import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

// App-style screens and internal tools stay static
const SKIP = ["/admin", "/staff", "/display", "/booking", "/edit-booking", "/cancel-booking"];

const ITEMS = "h1, h2, h3, p, li, img, a, table, iframe, form, dl, [data-slot=card]";
const CLEAR = "transform,opacity,visibility"; // hand hover/transition styles back to CSS

/** Matches inside root, keeping only the outermost (a <li> moves, not the <p> inside it). */
function outermost(root: Element, selector: string) {
  const all = Array.from(root.querySelectorAll<HTMLElement>(selector));
  return all.filter((el) => !all.some((other) => other !== el && other.contains(el)));
}

/** Resolves when the first-visit splash has finished (immediately if there is none). */
function afterPreloader(cb: () => void) {
  if (!document.getElementById("preloader")) return cb();
  window.addEventListener("preloader:done", cb, { once: true });
}

export default function SiteMotion() {
  const pathname = usePathname();
  const skip = SKIP.some((p) => pathname?.startsWith(p));

  useGSAP(
    () => {
      if (skip) return;
      const main = document.querySelector("main");
      if (!main) return;

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const blocks = outermost(main, "section, header");
        const [hero, ...rest] = blocks;
        if (!hero) return;

        // Hero intro
        const heroItems = outermost(hero, ITEMS);
        const heroImgs = heroItems.filter((el) => el.tagName === "IMG");
        const heroText = heroItems.filter((el) => el.tagName !== "IMG");
        gsap.set(heroText, { autoAlpha: 0, y: 32 });
        gsap.set(heroImgs, { autoAlpha: 0, scale: 0.9, y: 20 });

        const intro = gsap
          .timeline({ paused: true, defaults: { ease: "power3.out" } })
          .to(heroText, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.09, clearProps: CLEAR })
          .to(heroImgs, { autoAlpha: 1, scale: 1, y: 0, duration: 1, clearProps: CLEAR }, "-=0.6")
          // Gentle float on hero illustrations once they're in
          .add(() => {
            heroImgs.forEach((img) =>
              gsap.to(img, { y: -10, duration: 3, ease: "sine.inOut", yoyo: true, repeat: -1 }),
            );
          });
        afterPreloader(() => intro.play());

        // Scroll reveals
        rest.forEach((block) => {
          const items = outermost(block, ITEMS);
          if (!items.length) return;
          gsap.set(items, { autoAlpha: 0, y: 28 });
          ScrollTrigger.create({
            trigger: block,
            start: "top 85%",
            once: true,
            onEnter: () =>
              gsap.to(items, {
                autoAlpha: 1,
                y: 0,
                duration: 0.7,
                ease: "power3.out",
                stagger: 0.06,
                clearProps: CLEAR,
              }),
          });
        });

        // Layout can shift as images load; keep trigger positions accurate
        const refresh = () => ScrollTrigger.refresh();
        window.addEventListener("load", refresh);
        return () => window.removeEventListener("load", refresh);
      });

      return () => mm.revert();
    },
    { dependencies: [pathname, skip], revertOnUpdate: true },
  );

  return null;
}
