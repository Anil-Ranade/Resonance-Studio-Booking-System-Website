// Set by the display page so the booking flow sends admin/staff back there when done or exited.
const KEY = "bookingReturnTo";

export function takeReturnTo(): string | null {
  try {
    const to = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    return to;
  } catch {
    return null;
  }
}
