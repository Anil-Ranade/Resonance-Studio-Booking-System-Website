import { google } from "googleapis";

// Reuse the same OAuth2 client configuration as Google Calendar
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

const sheets = google.sheets({ version: "v4", auth: oauth2Client });

// Sheet headers for the booking log
const SHEET_HEADERS = [
  "Booking ID",
  "Timestamp",
  "Action",
  "Date",
  "Studio",
  "Session Type",
  "Session Details",
  "Start Time",
  "End Time",
  "Customer Name",
  "Phone",
  "Email",
  "Total Amount",
  "Status",
  "Notes",
];

export interface BookingLogEntry {
  bookingId: string;
  action: "NEW" | "UPDATED" | "CANCELLED" | "COMPLETED" | "ORIGINAL";
  date: string;
  studio: string;
  sessionType: string;
  sessionDetails?: string;
  startTime: string;
  endTime: string;
  customerName?: string;
  phone: string;
  email?: string;
  totalAmount?: number;
  status: string;
  notes?: string;
  timestamp?: string; // Optional custom timestamp (e.g., for ORIGINAL entries to use created_at)
}

/**
 * Ensures the sheet has headers in the first row
 */
async function ensureSheetHeaders(): Promise<void> {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) return;

  try {
    // Check if headers exist
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Sheet1!A1:O1",
    });

    const existingHeaders = response.data.values?.[0];

    // If no headers or empty, add them
    if (!existingHeaders || existingHeaders.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: "Sheet1!A1:O1",
        valueInputOption: "RAW",
        requestBody: {
          values: [SHEET_HEADERS],
        },
      });
      console.log("[Google Sheets] Headers added to sheet");
    }
  } catch (error) {
    console.error("[Google Sheets] Error ensuring headers:", error);
  }
}

/**
 * Appends a booking entry to the Google Sheet
 */
export async function appendBookingToSheet(
  entry: BookingLogEntry
): Promise<boolean> {
  const sheetId = process.env.GOOGLE_SHEET_ID;

  if (!sheetId) {
    console.log("[Google Sheets] GOOGLE_SHEET_ID not configured, skipping logging");
    return false;
  }

  try {
    // Ensure headers exist
    await ensureSheetHeaders();

    // Use provided timestamp or current time
    const timestamp = entry.timestamp || new Date().toISOString();

    const row = [
      entry.bookingId,
      timestamp,
      entry.action,
      entry.date,
      entry.studio,
      entry.sessionType,
      entry.sessionDetails || "",
      entry.startTime,
      entry.endTime,
      entry.customerName || "",
      entry.phone,
      entry.email || "",
      entry.totalAmount ? `₹${entry.totalAmount}` : "",
      entry.status,
      entry.notes || "",
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: "Sheet1!A:O",
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [row],
      },
    });

    console.log(`[Google Sheets] Logged booking ${entry.bookingId} (${entry.action})`);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[Google Sheets] Failed to log booking: ${message}`);
    return false;
  }
}

/**
 * Helper to log a new booking
 */
export async function logNewBooking(booking: {
  id: string;
  date: string;
  studio: string;
  session_type: string;
  session_details?: string;
  start_time: string;
  end_time: string;
  name?: string;
  phone_number: string;
  email?: string;
  total_amount?: number;
  status: string;
  notes?: string;
}): Promise<boolean> {
  return appendBookingToSheet({
    bookingId: booking.id,
    action: "NEW",
    date: booking.date,
    studio: booking.studio,
    sessionType: booking.session_type,
    sessionDetails: booking.session_details,
    startTime: booking.start_time,
    endTime: booking.end_time,
    customerName: booking.name,
    phone: booking.phone_number,
    email: booking.email,
    totalAmount: booking.total_amount,
    status: booking.status,
    notes: booking.notes,
  });
}

/**
 * Helper to log a booking update
 */
export async function logBookingUpdate(booking: {
  id: string;
  date: string;
  studio: string;
  session_type: string;
  session_details?: string;
  start_time: string;
  end_time: string;
  name?: string;
  phone_number: string;
  email?: string;
  total_amount?: number;
  status: string;
  notes?: string;
}): Promise<boolean> {
  return appendBookingToSheet({
    bookingId: booking.id,
    action: "UPDATED",
    date: booking.date,
    studio: booking.studio,
    sessionType: booking.session_type,
    sessionDetails: booking.session_details,
    startTime: booking.start_time,
    endTime: booking.end_time,
    customerName: booking.name,
    phone: booking.phone_number,
    email: booking.email,
    totalAmount: booking.total_amount,
    status: booking.status,
    notes: booking.notes,
  });
}

/**
 * Helper to log a booking cancellation
 */
export async function logBookingCancellation(booking: {
  id: string;
  date: string;
  studio: string;
  session_type: string;
  session_details?: string;
  start_time: string;
  end_time: string;
  name?: string;
  phone_number: string;
  email?: string;
  total_amount?: number;
  cancellation_reason?: string;
}): Promise<boolean> {
  return appendBookingToSheet({
    bookingId: booking.id,
    action: "CANCELLED",
    date: booking.date,
    studio: booking.studio,
    sessionType: booking.session_type,
    sessionDetails: booking.session_details,
    startTime: booking.start_time,
    endTime: booking.end_time,
    customerName: booking.name,
    phone: booking.phone_number,
    email: booking.email,
    totalAmount: booking.total_amount,
    status: "cancelled",
    notes: booking.cancellation_reason || "",
  });
}

/**
 * Helper to log the original state of a booking before update/cancellation (for audit)
 */
export async function logOriginalBooking(booking: {
  id: string;
  date: string;
  studio: string;
  session_type: string;
  session_details?: string;
  start_time: string;
  end_time: string;
  name?: string;
  phone_number: string;
  email?: string;
  total_amount?: number;
  status: string;
  notes?: string;
  created_at?: string; // Original booking creation timestamp
}): Promise<boolean> {
  return appendBookingToSheet({
    bookingId: booking.id,
    action: "ORIGINAL",
    date: booking.date,
    studio: booking.studio,
    sessionType: booking.session_type,
    sessionDetails: booking.session_details,
    startTime: booking.start_time,
    endTime: booking.end_time,
    customerName: booking.name,
    phone: booking.phone_number,
    email: booking.email,
    totalAmount: booking.total_amount,
    status: booking.status,
    notes: booking.notes || "Original booking before modification",
    timestamp: booking.created_at, // Use original creation timestamp
  });
}

