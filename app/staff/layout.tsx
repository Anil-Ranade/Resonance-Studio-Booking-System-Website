import type { Metadata } from "next";
import { NO_INDEX } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Staff",
  robots: NO_INDEX,
  description: "Staff portal for Resonance Studio booking management",
};

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#101c3d] via-[#192a56] to-[#101c3d]">
      {children}
    </div>
  );
}
