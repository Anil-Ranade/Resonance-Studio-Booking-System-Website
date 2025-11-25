import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER;

const client = twilio(accountSid, authToken);

interface BookingDetails {
  customerName: string;
  studioName: string;
  date: string;
  startTime: string;
  endTime: string;
  totalAmount?: number;
  bookingId?: string;
}

export async function sendMessage(
  whatsappNumber: string,
  body: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const message = await client.messages.create({
      from: `whatsapp:${twilioWhatsAppNumber}`,
      to: `whatsapp:${whatsappNumber}`,
      body,
    });

    return { success: true, messageId: message.sid };
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send message',
    };
  }
}

export async function sendBookingConfirmation(
  whatsappNumber: string,
  bookingDetails: BookingDetails
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { customerName, studioName, date, startTime, endTime, totalAmount, bookingId } =
    bookingDetails;

  const message = `
🎵 *Booking Confirmation* 🎵

Hi ${customerName}!

Your studio booking has been confirmed:

📍 *Studio:* ${studioName}
📅 *Date:* ${date}
⏰ *Time:* ${startTime} - ${endTime}
${totalAmount ? `💰 *Total:* ₹${totalAmount.toLocaleString('en-IN')}` : ''}
${bookingId ? `🔖 *Booking ID:* ${bookingId}` : ''}

Thank you for choosing Resonance Studio!

If you have any questions, feel free to reach out.
`.trim();

  return sendMessage(whatsappNumber, message);
}
