import type { Metadata } from "next";
import { OG_BASE } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Policies",
  description:
    "Read Resonance Jam Room's booking and cancellation policies. Free cancellation or rescheduling more than 24 hours before a session. No advance payment required.",
  alternates: {
    canonical: "/policies",
  },
  openGraph: {
    ...OG_BASE,
    title: "Booking Policies - Resonance Jam Room",
    description:
      "Understand our cancellation policy, payment terms, and booking guidelines before your session.",
  },

};

export default function PoliciesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
