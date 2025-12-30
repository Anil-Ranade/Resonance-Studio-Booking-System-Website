import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Services & Pricing",
  description:
    "Transparent pricing at Resonance Jam Room. Rehearsal studios from ₹200/hr, audio recording at ₹700/song, video recording at ₹800/song. No hidden fees, pay at studio.",
  alternates: {
    canonical: "/rate-card",
  },
  openGraph: {
    title: "Studio Pricing & Services - Resonance Jam Room",
    description:
      "Affordable rates for jam room, karaoke, recording, mixing, mastering, and video production. No advance payment required.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Studio Pricing & Services - Resonance Jam Room",
    description:
      "Affordable rates for jam room, karaoke, recording, mixing, mastering, and video production.",
  },
};

export default function RateCardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
