import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about Resonance Jam Room's story - over a decade of excellence in audio production. Meet our team and discover our passion for music in Pune.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About Resonance Jam Room - 10+ Years of Excellence",
    description:
      "Discover our story, meet our team, and learn about our commitment to providing top-tier audio-video services in Pune.",
  },

};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
