// Shared SEO settings for resonancejamroom.in.

export const SITE_URL = "https://resonancejamroom.in";
export const SITE_NAME = "Resonance Jam Room";

// Social share image. Next replaces (not merges) a parent's openGraph, so every
// layout that sets its own openGraph spreads OG_BASE to keep these fields.
export const OG_IMAGE = {
  url: "/og-image.png",
  width: 1731,
  height: 909,
  alt: "Resonance Jam Room - Rehearse, record & go live · Sinhgad Road, Pune",
};

export const OG_BASE = {
  type: "website" as const,
  locale: "en_IN",
  siteName: SITE_NAME,
  url: "./", // resolves to the current page's URL
  images: [OG_IMAGE],
};

/** For private / transactional pages: keep out of search, still follow links. */
export const NO_INDEX = { index: false, follow: true };
