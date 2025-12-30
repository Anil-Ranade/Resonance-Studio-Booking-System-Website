import type { Metadata } from "next";
import { FAQPageStructuredData } from "../components/StructuredData";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Frequently asked questions about Resonance Jam Room. Learn about booking, cancellation policy, operating hours, equipment, pricing, and facilities.",
  alternates: {
    canonical: "/faq",
  },
  openGraph: {
    title: "FAQ - Resonance Jam Room",
    description:
      "Get answers to common questions about studio bookings, equipment, payment, recording services, and facilities.",
  },
  twitter: {
    card: "summary",
    title: "FAQ - Resonance Jam Room",
    description:
      "Get answers to common questions about studio bookings, equipment, payment, and recording services.",
  },
};

export default function FAQLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <FAQPageStructuredData />
      {children}
    </>
  );
}
