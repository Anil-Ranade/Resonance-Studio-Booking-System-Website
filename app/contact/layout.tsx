import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with Resonance Jam Room in Pune. Find our address in Dattawadi, phone numbers, email, and operating hours. Located at 45, Shivprasad Housing Society.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact Resonance Jam Room - Dattawadi, Pune",
    description:
      "Reach out to us for studio bookings, inquiries, or support. We're open 8 AM to 10 PM daily.",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
