import { google } from "googleapis";

// Initialize Google Calendar API client
export const getGoogleCalendarClient = () => {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
    },
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });

  return google.calendar({ version: "v3", auth });
};

// Create a calendar event for a booking
export const createCalendarEvent = async (booking: {
  studioName: string;
  date: string;
  startTime: string;
  endTime: string;
  customerName: string;
  customerEmail: string;
}) => {
  const calendar = getGoogleCalendarClient();
  
  const event = {
    summary: `${booking.studioName} - ${booking.customerName}`,
    description: `Studio booking for ${booking.customerName}`,
    start: {
      dateTime: `${booking.date}T${booking.startTime}:00`,
      timeZone: process.env.CALENDAR_TIMEZONE || "Asia/Kolkata",
    },
    end: {
      dateTime: `${booking.date}T${booking.endTime}:00`,
      timeZone: process.env.CALENDAR_TIMEZONE || "Asia/Kolkata",
    },
    attendees: [{ email: booking.customerEmail }],
  };

  // TODO: Implement actual calendar event creation
  // const response = await calendar.events.insert({
  //   calendarId: process.env.GOOGLE_CALENDAR_ID,
  //   requestBody: event,
  // });
  
  return event;
};
