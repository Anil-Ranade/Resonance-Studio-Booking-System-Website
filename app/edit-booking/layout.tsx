import type { Metadata } from "next";
import BookingClientWrapper from "../booking/BookingClientWrapper";
import { NO_INDEX } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Modify Booking",
  description: "Change the session, studio, date or time of your upcoming Resonance Jam Room booking.",
  robots: NO_INDEX,
};

// Same full-screen frame as the booking flow (hides site nav/footer).
export default function Layout({ children }: { children: React.ReactNode }) {
  return <BookingClientWrapper>{children}</BookingClientWrapper>;
}
