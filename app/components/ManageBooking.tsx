"use client";

// Shared UI + helpers for the edit-booking and cancel-booking pages.

import Link from "next/link";
import {
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Mail,
  Mic,
  Users,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";

export const SEARCH_FORM_ID = "manage-booking-search";

export interface Booking {
  id: string;
  studio: string;
  session_type: string;
  session_details: string;
  group_size: number;
  date: string;
  start_time: string;
  end_time: string;
  status: "confirmed" | "cancelled" | "completed" | "no_show";
  rate_per_hour: number;
  total_amount: number;
  created_at: string;
  name?: string;
  email?: string;
  phone_number?: string;
}

export async function safeJsonParse(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    console.error("Failed to parse response as JSON:", text.substring(0, 200));
    throw new Error("Server returned an invalid response. Please try again.");
  }
}

export const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

/** Why a booking can't be changed: hidden (invalid/past), locked (<24h), or "" if allowed. */
export function changeBlockReason(booking: Booking) {
  if (booking.status?.toLowerCase() !== "confirmed") return "Invalid status";

  const t = booking.start_time;
  const time = t.includes(":") ? (t.split(":").length === 2 ? `${t}:00` : t) : "00:00:00";
  const start = new Date(`${booking.date}T${time}`);
  if (isNaN(start.getTime())) return "";

  const hoursUntil = (start.getTime() - Date.now()) / 36e5;
  if (hoursUntil < 0) return "Past booking";
  if (hoursUntil < 24) return "Within 24 hours";
  return "";
}

export const formatDate = (dateStr: string) =>
  new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export const formatTime = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHour}:${minutes.toString().padStart(2, "0")} ${period}`;
};

const rupees = (n?: number) => `₹${(n || 0).toLocaleString("en-IN")}`;

export function LoadingCard({ label }: { label: string }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
        <Spinner className="text-primary" /> {label}
      </CardContent>
    </Card>
  );
}

export function ErrorAlert({ message }: { message: string }) {
  return (
    <Alert variant="destructive">
      <AlertDescription className="text-destructive">{message}</AlertDescription>
    </Alert>
  );
}

/** Email lookup; submitted by the footer button via form={SEARCH_FORM_ID}. */
export function EmailSearch({
  email,
  onEmailChange,
  onSubmit,
  error,
  noResults,
}: {
  email: string;
  onEmailChange: (v: string) => void;
  onSubmit: () => void;
  error: string;
  noResults: boolean;
}) {
  return (
    <div className="space-y-4">
      <form
        id={SEARCH_FORM_ID}
        onSubmit={(e) => {
          e.preventDefault();
          if (isValidEmail(email)) onSubmit();
        }}
        className="space-y-1.5"
      >
        <Label htmlFor="manage-email">Email used for your booking</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            id="manage-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="you@example.com"
            className="h-11 pl-10 text-base"
            autoFocus
          />
        </div>
      </form>

      {error && <ErrorAlert message={error} />}

      {noResults && (
        <Card className="text-center">
          <CardContent className="flex flex-col items-center gap-2 py-6">
            <Calendar className="size-12 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold">No bookings found</h3>
            <p className="text-muted-foreground text-sm">
              No upcoming bookings found for this email address.
            </p>
            <Button asChild className="mt-2">
              <Link href="/booking/new">Make a booking</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function BookingDetails({ booking }: { booking: Booking }) {
  const row = "flex items-center gap-2 [&_svg]:size-4 [&_svg]:text-primary";
  return (
    <div className="space-y-1.5 text-sm">
      <p className={`${row} font-semibold text-base`}>
        <Mic /> {booking.session_type}
      </p>
      {booking.session_details && (
        <p className={`${row} text-muted-foreground`}>
          <Users /> {booking.session_details}
        </p>
      )}
      <p className={row}>
        <Building2 /> {booking.studio}
      </p>
      <p className={row}>
        <Calendar /> {formatDate(booking.date)}
      </p>
      <p className={row}>
        <Clock /> {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
      </p>
    </div>
  );
}

/** List of the user's bookings; locked ones (<24h) are shown but not selectable. */
export function BookingPicker({
  bookings,
  lockedMessage,
  onSelect,
}: {
  bookings: Booking[];
  lockedMessage: string;
  onSelect: (b: Booking) => void;
}) {
  return (
    <div>
      <ul className="space-y-3">
        {bookings.map((booking) => {
          const reason = changeBlockReason(booking);
          if (reason === "Invalid status" || reason === "Past booking") return null;
          const locked = reason === "Within 24 hours";

          return (
            <li key={booking.id}>
              <Card className={`p-0 transition-colors ${locked ? "opacity-60" : "hover:ring-primary/50"}`}>
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => onSelect(booking)}
                  className="w-full text-left p-4 space-y-3 rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed"
                >
                  {locked && (
                    <Badge variant="outline" className="border-amber-500/40 text-amber-400">
                      <Clock /> {lockedMessage}
                    </Badge>
                  )}
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="border-emerald-500/40 text-emerald-400">
                      <CheckCircle2 /> Confirmed
                    </Badge>
                    <span className="text-xs text-muted-foreground">ID: {booking.id.slice(0, 8)}</span>
                  </div>
                  <div className="flex items-end justify-between gap-3">
                    <BookingDetails booking={booking} />
                    {!locked && <ChevronRight className="size-5 text-muted-foreground shrink-0" />}
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">Total amount</span>
                    <span className="font-bold text-primary">{rupees(booking.total_amount)}</span>
                  </div>
                </button>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Key/value summary of one booking, used on the confirm screens. */
export function BookingSummary({ booking }: { booking: Booking }) {
  const rows: [string, string | undefined][] = [
    ["Session", booking.session_type],
    ["Details", booking.session_details],
    ["Studio", booking.studio],
    ["Date", formatDate(booking.date)],
    ["Time", `${formatTime(booking.start_time)} - ${formatTime(booking.end_time)}`],
  ];
  return (
    <div className="rounded-xl bg-muted p-4 space-y-2.5 text-sm">
      {rows
        .filter(([, v]) => v)
        .map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4">
            <span className="text-muted-foreground">{k}</span>
            <span className="font-medium text-right">{v}</span>
          </div>
        ))}
      <Separator />
      <div className="flex justify-between">
        <span className="text-muted-foreground">Total amount</span>
        <span className="font-bold text-primary">{rupees(booking.total_amount)}</span>
      </div>
    </div>
  );
}
