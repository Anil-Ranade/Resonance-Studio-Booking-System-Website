import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Check Availability",
  description:
    "Check real-time studio availability at Resonance Jam Room. View open slots for Studio A, B, and C. Book your preferred time instantly.",
  alternates: {
    canonical: "/availability",
  },
  openGraph: {
    title: "Studio Availability - Resonance Jam Room",
    description:
      "See available time slots for all three studios and book your session online.",
  },
  twitter: {
    card: "summary",
    title: "Studio Availability - Resonance Jam Room",
    description:
      "Check real-time availability for all three studios and book your session online.",
  },
};

export default function AvailabilityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
