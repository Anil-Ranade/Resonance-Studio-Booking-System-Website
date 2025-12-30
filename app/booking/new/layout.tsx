import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "New Booking",
  description:
    "Create a new studio booking at Resonance Jam Room. Select your session type, preferred studio, date and time. Quick online booking with instant confirmation.",
  alternates: {
    canonical: "/booking/new",
  },
  openGraph: {
    title: "New Booking - Resonance Jam Room",
    description:
      "Start your studio booking. Select session type, studio, date and time. No advance payment required.",
  },
  twitter: {
    card: "summary",
    title: "New Booking - Resonance Jam Room",
    description:
      "Create a new studio booking. Select session type, studio, date and time online.",
  },
};

export default function NewBookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
