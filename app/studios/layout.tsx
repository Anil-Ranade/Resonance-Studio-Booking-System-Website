import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Studios",
  description:
    "Explore Resonance Jam Room's three unique studios in Pune. Studio A for large groups, Studio B for medium sessions, Studio C for recording. Professional equipment included.",
  alternates: {
    canonical: "/studios",
  },
  openGraph: {
    title: "Three Professional Studios in Pune - Resonance Jam Room",
    description:
      "State-of-the-art recording facilities with drums, guitars, keyboards, professional sound systems, and video recording equipment.",
  },

};

export default function StudiosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
