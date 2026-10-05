import type { Metadata } from "next";
import DisplayChrome from "./DisplayChrome";
import { NO_INDEX } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Studio Display",
  robots: NO_INDEX,
};

export default function DisplayLayout({ children }: { children: React.ReactNode }) {
  return <DisplayChrome>{children}</DisplayChrome>;
}
