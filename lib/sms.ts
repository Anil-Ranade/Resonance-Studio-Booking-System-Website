import twilio from 'twilio';

/**
 * SMS messaging service using Twilio API.
 *
 * Environment variables required:
 * - TWILIO_ACCOUNT_SID: Your Twilio Account SID
 * - TWILIO_AUTH_TOKEN: Your Twilio Auth Token
 * - TWILIO_SMS_NUMBER: Your Twilio SMS-enabled phone number (e.g., +1234567890)
 */

// Lazy initialization of Twilio client
let twilioClient: ReturnType<typeof twilio> | null = null;

function getTwilioClient() {
  if (!twilioClient) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not configured. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables.');
    }

    twilioClient = twilio(accountSid, authToken);
  }
  return twilioClient;
}

/**
 * Format phone number to E.164 format for India (+91XXXXXXXXXX)
 * @param phone - Phone number (10 digits)
 * @returns Formatted phone number with +91 prefix
 */
function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');

  // If already has country code (12 digits starting with 91), add +
  if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
    return `+${digitsOnly}`;
  }

  // If 10 digits, add +91 prefix
  if (digitsOnly.length === 10) {
    return `+91${digitsOnly}`;
  }

  // If already formatted with +91, return as is
  if (phone.startsWith('+91') && digitsOnly.length === 12) {
    return phone;
  }

  // Return with +91 prefix for other cases
  return `+91${digitsOnly.slice(-10)}`;
}

/**
 * Send an SMS message via Twilio.
 *
 * @param to - Recipient phone number (10 digits or E.164 format)
 * @param body - Message content
 * @returns Object with success status and either sid (on success) or error (on failure)
 */
export async function sendSMS(
  to: string,
  body: string
): Promise<{ success: true; sid: string } | { success: false; error: string }> {
  try {
    const twilioSmsNumber = process.env.TWILIO_SMS_NUMBER;

    if (!twilioSmsNumber) {
      throw new Error('TWILIO_SMS_NUMBER not configured. Please set the environment variable.');
    }

    const formattedTo = formatPhoneNumber(to);
    const client = getTwilioClient();

    const message = await client.messages.create({
      from: twilioSmsNumber,
      to: formattedTo,
      body,
    });

    console.log('[SMS] Message sent successfully to', formattedTo, '- SID:', message.sid);
    return { success: true, sid: message.sid };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred while sending SMS';
    console.error('[SMS] Failed to send message:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Send an OTP verification SMS.
 *
 * @param to - Recipient phone number (10 digits or E.164 format)
 * @param otp - The 6-digit OTP code
 * @returns Object with success status and either sid (on success) or error (on failure)
 */
export async function sendOTPSMS(
  to: string,
  otp: string
): Promise<{ success: true; sid: string } | { success: false; error: string }> {
  const body = `Your Resonance Studio one-time login code is: ${otp}. This code expires in 5 minutes. Do not share this code with anyone.`;
  return sendSMS(to, body);
}

/**
 * Send a 24-hour reminder SMS before a booking.
 *
 * @param to - Recipient phone number (10 digits or E.164 format)
 * @param bookingDetails - Details of the booking
 * @returns Object with success status and either sid (on success) or error (on failure)
 */
export async function send24HourReminderSMS(
  to: string,
  bookingDetails: {
    studio: string;
    date: string;
    startTime: string;
    endTime: string;
    sessionType?: string;
  }
): Promise<{ success: true; sid: string } | { success: false; error: string }> {
  const formattedDate = new Date(bookingDetails.date).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  
  const body = `Reminder: Your session at Resonance Studio is tomorrow!\n\n📍 ${bookingDetails.studio}\n📅 ${formattedDate}\n⏰ ${bookingDetails.startTime} - ${bookingDetails.endTime}${bookingDetails.sessionType ? `\n🎵 ${bookingDetails.sessionType}` : ''}\n\nSee you soon!`;
  return sendSMS(to, body);
}

/**
 * Send a 1-hour reminder SMS before a booking.
 *
 * @param to - Recipient phone number (10 digits or E.164 format)
 * @param bookingDetails - Details of the booking
 * @returns Object with success status and either sid (on success) or error (on failure)
 */
export async function send1HourReminderSMS(
  to: string,
  bookingDetails: {
    studio: string;
    startTime: string;
    endTime: string;
    sessionType?: string;
  }
): Promise<{ success: true; sid: string } | { success: false; error: string }> {
  const body = `Your session at Resonance Studio starts in 1 hour!\n\n📍 ${bookingDetails.studio}\n⏰ ${bookingDetails.startTime} - ${bookingDetails.endTime}${bookingDetails.sessionType ? `\n🎵 ${bookingDetails.sessionType}` : ''}\n\nWe're excited to see you!`;
  return sendSMS(to, body);
}
