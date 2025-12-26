import type { Metadata } from "next";
import BookingClientWrapper from "./BookingClientWrapper";

export const metadata: Metadata = {
  title: "Book Online",
  description:
    "Book your studio session online at Resonance Jam Room. Easy booking for jam room, karaoke, recording, and podcast sessions. No advance payment required.",
  alternates: {
    canonical: "/booking",
  },
  openGraph: {
    title: "Book Online - Resonance Jam Room",
    description:
      "Book your studio session online. Choose from jam room, karaoke, recording, and podcast sessions. Instant booking confirmation.",
  },
  twitter: {
    card: "summary",
    title: "Book Online - Resonance Jam Room",
    description:
      "Book your studio session online. Choose from jam room, karaoke, recording, and podcast sessions.",
  },
};

export default function BookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <BookingClientWrapper>{children}</BookingClientWrapper>;
}
