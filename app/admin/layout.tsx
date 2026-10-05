import type { Metadata } from "next";
import { NO_INDEX } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Admin",
  robots: NO_INDEX,
  description: "Admin portal for Resonance Studio management",
};

export default function AdminLayout({
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
