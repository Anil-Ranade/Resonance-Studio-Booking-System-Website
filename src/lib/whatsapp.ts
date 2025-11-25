import twilio from "twilio";

/**
 * WhatsApp messaging service using Twilio API.
 *
 * Environment variables required:
 * - TWILIO_ACCOUNT_SID: Your Twilio Account SID
 * - TWILIO_AUTH_TOKEN: Your Twilio Auth Token
 * - TWILIO_WHATSAPP_NUMBER: Your Twilio WhatsApp-enabled number (e.g., +14155238886)
 */

// Lazy initialization of Twilio client
let twilioClient: ReturnType<typeof twilio> | null = null;

function getTwilioClient() {
  if (!twilioClient) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (!accountSid || !authToken) {
      throw new Error("Twilio credentials not configured");
    }
    
    twilioClient = twilio(accountSid, authToken);
  }
  return twilioClient;
}

/**
 * Send a WhatsApp message via Twilio.
 *
 * @param to - Recipient phone number in E.164 format (e.g., +919876543210)
 *             Note: The 'whatsapp:' prefix will be added automatically.
 * @param body - Message content
 * @returns Object with success status and either sid (on success) or error (on failure)
 */
export async function sendMessage(
  to: string,
  body: string
): Promise<{ success: true; sid: string } | { success: false; error: string }> {
  try {
    let twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER;
    
    if (!twilioWhatsAppNumber) {
      throw new Error("TWILIO_WHATSAPP_NUMBER not configured");
    }
    
    // Handle case where TWILIO_WHATSAPP_NUMBER already includes 'whatsapp:' prefix
    const fromNumber = twilioWhatsAppNumber.startsWith('whatsapp:') 
      ? twilioWhatsAppNumber 
      : `whatsapp:${twilioWhatsAppNumber}`;
    
    // Handle case where 'to' number already includes 'whatsapp:' prefix
    const toNumber = to.startsWith('whatsapp:') 
      ? to 
      : `whatsapp:${to}`;
    
    const client = getTwilioClient();
    const message = await client.messages.create({
      from: fromNumber,
      to: toNumber,
      body,
    });

    console.log("[WhatsApp] Message sent successfully to", to, "- SID:", message.sid);
    return { success: true, sid: message.sid };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("[WhatsApp] Failed to send message:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Send an OTP verification message via WhatsApp.
 *
 * @param to - Recipient phone number in E.164 format (e.g., +919876543210)
 *             Note: The 'whatsapp:' prefix will be added automatically.
 * @param otp - The 6-digit OTP code
 * @returns Object with success status and either sid (on success) or error (on failure)
 */
export async function sendOTP(
  to: string,
  otp: string
): Promise<{ success: true; sid: string } | { success: false; error: string }> {
  const body = `🔐 *Resonance Studio - OTP Verification*

Your OTP is: *${otp}*

This code is valid for 5 minutes. Do not share this code with anyone.

If you didn't request this OTP, please ignore this message.`;

  return sendMessage(to, body);
}

/**
 * Booking details for confirmation message.
 */
export interface BookingDetails {
  bookingId: string;
  studio: string;
  date: string;
  start_time: string;
  end_time: string;
  total_amount?: number;
  user_name?: string;
}

/**
 * Send a booking confirmation message via WhatsApp.
 *
 * @param to - Recipient phone number in E.164 format (e.g., +919876543210)
 *             Note: The 'whatsapp:' prefix will be added automatically.
 * @param booking - Booking details object
 * @returns Object with success status and either sid (on success) or error (on failure)
 */
export async function sendBookingConfirmation(
  to: string,
  booking: BookingDetails
): Promise<{ success: true; sid: string } | { success: false; error: string }> {
  const greeting = booking.user_name ? `Hi ${booking.user_name}! ` : "";
  const amountLine = booking.total_amount
    ? `\n💰 Total: ₹${booking.total_amount.toLocaleString("en-IN")}`
    : "";

  const body = `${greeting}✅ *Booking Confirmed!*

📍 *Studio:* ${booking.studio}
📅 *Date:* ${booking.date}
🕐 *Time:* ${booking.start_time} - ${booking.end_time}${amountLine}

🔖 *Booking ID:* ${booking.bookingId}

Thank you for booking with Resonance Studio! See you soon. 🎵`;

  return sendMessage(to, body);
}
