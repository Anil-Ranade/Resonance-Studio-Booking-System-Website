import { google } from "googleapis";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

const calendar = google.calendar({ version: "v3", auth: oauth2Client });

interface CreateEventParams {
  summary: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
}

export async function createEvent({
  summary,
  description,
  startDateTime,
  endDateTime,
}: CreateEventParams): Promise<string> {
  try {
    // Use IST timezone to match the booking times displayed to users
    const timeZone = process.env.CALENDAR_TIMEZONE || "Asia/Kolkata";
    
    const response = await calendar.events.insert({
      calendarId: process.env.OWNER_CALENDAR_ID,
      requestBody: {
        summary,
        description,
        start: {
          dateTime: startDateTime,
          timeZone,
        },
        end: {
          dateTime: endDateTime,
          timeZone,
        },
      },
    });

    if (!response.data.id) {
      throw new Error("Failed to create event: No event ID returned");
    }

    return response.data.id;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    throw new Error(`Failed to create Google Calendar event: ${message}`);
  }
}

export async function deleteEvent(eventId: string): Promise<void> {
  try {
    await calendar.events.delete({
      calendarId: process.env.OWNER_CALENDAR_ID,
      eventId,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    throw new Error(`Failed to delete Google Calendar event: ${message}`);
  }
}
