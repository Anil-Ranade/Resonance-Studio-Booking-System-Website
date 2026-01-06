import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Policies",
  description:
    "Read Resonance Jam Room's booking and cancellation policies. Free cancellation with 24+ hours notice. No advance payment required.",
  alternates: {
    canonical: "/policies",
  },
  openGraph: {
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
