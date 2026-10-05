import type { Metadata } from "next";
import BookingClientWrapper from "../booking/BookingClientWrapper";
import { NO_INDEX } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Cancel Booking",
  description: "Cancel an upcoming Resonance Jam Room booking.",
  robots: NO_INDEX,
};

// Same full-screen frame as the booking flow (hides site nav/footer).
export default function Layout({ children }: { children: React.ReactNode }) {
  return <BookingClientWrapper>{children}</BookingClientWrapper>;
}
