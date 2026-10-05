// Booking shown as a session ticket: date stub, perforated edge, details.
// Used by view-bookings, edit-booking and cancel-booking.

export const ticketStatus = {
  pending: { label: "Pending", dot: "bg-amber-400", text: "text-amber-300" },
  confirmed: { label: "Confirmed", dot: "bg-emerald-400", text: "text-emerald-300" },
  cancelled: { label: "Cancelled", dot: "bg-red-400", text: "text-red-300" },
  completed: { label: "Completed", dot: "bg-violet-400", text: "text-violet-300" },
  no_show: { label: "No show", dot: "bg-zinc-500", text: "text-zinc-400" },
} as const;

type Status = keyof typeof ticketStatus;

export interface TicketBooking {
  id: string;
  studio: string;
  session_type: string;
  session_details?: string;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  total_amount: number;
}

function formatTime(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHour}:${minutes.toString().padStart(2, "0")} ${period}`;
}

export default function SessionTicket({
  booking,
  note,
  muted = false,
}: {
  booking: TicketBooking;
  note?: React.ReactNode;
  muted?: boolean;
}) {
  // T00:00 keeps the date in local time so the day doesn't shift
  const d = new Date(`${booking.date.slice(0, 10)}T00:00:00`);
  const status = ticketStatus[booking.status as Status] ?? ticketStatus.pending;

  return (
    <div
      className={`flex w-full text-left rounded-3xl border border-white/10 bg-white/[0.04] overflow-hidden ${
        muted ? "opacity-55" : ""
      }`}
    >
      <div className="relative w-28 sm:w-36 shrink-0 flex flex-col items-center justify-center text-center py-6 px-3 bg-violet-400/[0.08]">
        <span className="text-xs font-medium uppercase tracking-[0.14em] text-violet-300">
          {d.toLocaleDateString("en-IN", { weekday: "short" })}
        </span>
        <span className="text-5xl sm:text-6xl font-bold text-white leading-none my-1 tabular-nums">{d.getDate()}</span>
        <span className="text-xs text-zinc-400">{d.toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</span>
        <span className={`mt-4 inline-flex items-center gap-1.5 text-xs font-medium ${status.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
          {status.label}
        </span>
        {/* Perforation: notches top and bottom, dashed edge */}
        <span aria-hidden="true" className="absolute -right-3 -top-3 w-6 h-6 rounded-full bg-navy border border-white/10" />
        <span aria-hidden="true" className="absolute -right-3 -bottom-3 w-6 h-6 rounded-full bg-navy border border-white/10" />
        <span aria-hidden="true" className="absolute right-0 top-4 bottom-4 border-r-2 border-dashed border-white/15" />
      </div>

      <div className="flex-1 min-w-0 p-5 sm:p-6">
        <p className="text-xl sm:text-2xl font-bold text-white tabular-nums mb-1">
          {formatTime(booking.start_time)} <span className="text-zinc-500 font-normal">-</span>{" "}
          {formatTime(booking.end_time)}
        </p>
        <p className="text-violet-400 font-semibold mb-3">{booking.studio}</p>
        <p className="text-zinc-200">{booking.session_type}</p>
        {booking.session_details && <p className="text-sm text-zinc-400">{booking.session_details}</p>}
        {note && <div className="mt-3">{note}</div>}
        <div className="mt-4 pt-4 border-t border-white/10 flex items-baseline justify-between gap-4">
          <span className="text-xs text-zinc-500">Booking {booking.id.slice(0, 8)}</span>
          <span className="text-lg font-bold text-white tabular-nums">
            ₹{booking.total_amount?.toLocaleString("en-IN") || 0}
          </span>
        </div>
      </div>
    </div>
  );
}
