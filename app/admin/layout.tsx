import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin - Resonance Studio",
  description: "Admin portal for Resonance Studio management",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f0f1a] via-[#1a1a2e] to-[#16213e]">
      {children}
    </div>
  );
}
