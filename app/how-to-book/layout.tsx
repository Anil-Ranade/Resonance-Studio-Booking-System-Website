import type { Metadata } from "next";
import { OG_BASE } from "@/lib/seo";

export const metadata: Metadata = {
  title: "How to Book",
  description:
    "Step-by-step guide to booking a jam room, karaoke room or recording session at Resonance Jam Room, Pune. Book online, manage or cancel bookings, and earn cashback.",
  openGraph: {
    ...OG_BASE,
    title: "How to Book a Session - Resonance Jam Room",
    description:
      "Book a studio online in a few steps, then manage, change or cancel your booking any time.",
  },
};

export default function HowToBookLayout({ children }: { children: React.ReactNode }) {
  return children;
}
