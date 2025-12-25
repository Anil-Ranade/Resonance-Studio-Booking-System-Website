import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home",
  description:
    "Welcome to Resonance Jam Room - Pune's premier professional recording studio and jam room. Book online for music recording, mixing, mastering, podcast production, karaoke sessions, and band rehearsals at affordable rates.",
  alternates: {
    canonical: "/home",
  },
  openGraph: {
    title: "Resonance Jam Room - Where Music Comes Alive",
    description:
      "Three state-of-the-art studios dedicated to premium karaoke, live rehearsal sessions, band practices, and professional recording services.",
  },
};

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
