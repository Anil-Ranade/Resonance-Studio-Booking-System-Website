// All studio times are Asia/Kolkata, regardless of the viewer's or server's timezone.
export const IST = "Asia/Kolkata";

const fmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: IST,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** Current IST wall clock: date "YYYY-MM-DD", time "HH:MM", minutes since midnight. */
export function istNow(d: Date = new Date()) {
  const p = Object.fromEntries(fmt.formatToParts(d).map((x) => [x.type, x.value]));
  const hour = p.hour === "24" ? "00" : p.hour;
  return {
    date: `${p.year}-${p.month}-${p.day}`,
    time: `${hour}:${p.minute}`,
    minutes: Number(hour) * 60 + Number(p.minute),
  };
}

export const todayIST = () => istNow().date;

/** Add days to a "YYYY-MM-DD" string (calendar math, no timezone involved). */
export function addDaysYMD(ymd: string, days: number): string {
  const d = new Date(`${ymd.slice(0, 10)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Day of week (0=Sun) of a "YYYY-MM-DD" string. */
export const dayOfWeekYMD = (ymd: string) => new Date(`${ymd.slice(0, 10)}T00:00:00Z`).getUTCDay();

/** Absolute instant for an IST date + "HH:MM[:SS]" time. */
export const istDateTime = (date: string, time = "00:00") =>
  new Date(`${date.slice(0, 10)}T${time.slice(0, 5)}:00+05:30`);

/** Format a "YYYY-MM-DD" date or ISO timestamp in IST. */
export function formatIST(
  value: string | Date,
  options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" },
  locale = "en-IN"
) {
  const d =
    typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.slice(0, 10)) && value.length <= 10
      ? istDateTime(value)
      : new Date(value);
  return d.toLocaleDateString(locale, { timeZone: IST, ...options });
}
