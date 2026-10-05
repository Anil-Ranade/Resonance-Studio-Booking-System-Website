import type { Metadata } from "next";
import { NO_INDEX } from "@/lib/seo";

export const metadata: Metadata = {
  title: "My Bookings",
  robots: NO_INDEX,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
