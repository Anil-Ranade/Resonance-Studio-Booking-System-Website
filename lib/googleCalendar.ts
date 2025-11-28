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
  studioName?: string;
}

// Google Calendar color IDs for different studios
// Reference: https://developers.google.com/calendar/api/v3/reference/colors
function getStudioColorId(studioName?: string): string | undefined {
  if (!studioName) return undefined;
  
  const studioLower = studioName.toLowerCase();
  
  if (studioLower.includes("studio a") || studioLower === "a") {
    return "9"; // Blueberry (Dark Blue)
  } else if (studioLower.includes("studio b") || studioLower === "b") {
    return "6"; // Tangerine (Dark Orange/Brown)
  } else if (studioLower.includes("studio c") || studioLower === "c") {
    return "10"; // Basil (Dark Green)
  }
  
  return undefined;
}

export async function createEvent({
  summary,
  description,
  startDateTime,
  endDateTime,
  studioName,
}: CreateEventParams): Promise<string> {
  try {
    // Use IST timezone to match the booking times displayed to users
    const timeZone = process.env.CALENDAR_TIMEZONE || "Asia/Kolkata";
    const colorId = getStudioColorId(studioName);
    
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
        ...(colorId && { colorId }),
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

interface UpdateEventParams {
  eventId: string;
  summary?: string;
  description?: string;
  startDateTime?: string;
  endDateTime?: string;
}

export async function updateEvent({
  eventId,
  summary,
  description,
  startDateTime,
  endDateTime,
}: UpdateEventParams): Promise<void> {
  try {
    const timeZone = process.env.CALENDAR_TIMEZONE || "Asia/Kolkata";
    
    // Build the update payload with only provided fields
    const requestBody: {
      summary?: string;
      description?: string;
      start?: { dateTime: string; timeZone: string };
      end?: { dateTime: string; timeZone: string };
    } = {};

    if (summary !== undefined) {
      requestBody.summary = summary;
    }
    if (description !== undefined) {
      requestBody.description = description;
    }
    if (startDateTime !== undefined) {
      requestBody.start = { dateTime: startDateTime, timeZone };
    }
    if (endDateTime !== undefined) {
      requestBody.end = { dateTime: endDateTime, timeZone };
    }

    await calendar.events.patch({
      calendarId: process.env.OWNER_CALENDAR_ID,
      eventId,
      requestBody,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    throw new Error(`Failed to update Google Calendar event: ${message}`);
  }
}
