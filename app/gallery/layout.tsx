import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "View photos of Resonance Jam Room's professional studios in Pune. See our recording equipment, rehearsal spaces, and production facilities.",
  alternates: {
    canonical: "/gallery",
  },
  openGraph: {
    title: "Studio Gallery - Resonance Jam Room",
    description:
      "Take a visual tour of our three professional studios and recording facilities in Pune.",
  },

};

export default function GalleryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
