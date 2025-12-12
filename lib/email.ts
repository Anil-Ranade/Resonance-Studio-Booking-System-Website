import { Resend } from 'resend';

/**
 * Email service using Resend API.
 *
 * Environment variables required:
 * - RESEND_API_KEY: Your Resend API key
 * - RESEND_FROM_EMAIL: Sender email address (e.g., noreply@resonancestudio.com)
 */

// Lazy initialization of Resend client
let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      throw new Error('RESEND_API_KEY not configured. Please set the environment variable.');
    }

    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

/**
 * Get the sender email address from environment
 */
function getFromEmail(): string {
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  if (!fromEmail) {
    throw new Error('RESEND_FROM_EMAIL not configured. Please set the environment variable.');
  }
  return fromEmail;
}

/**
 * Base email sending function
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  try {
    const resend = getResendClient();
    const fromEmail = getFromEmail();

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject,
      html,
    });

    if (error) {
      console.error('[Email] Failed to send:', error.message);
      return { success: false, error: error.message };
    }

    console.log('[Email] Message sent successfully to', to, '- ID:', data?.id);
    return { success: true, id: data?.id || '' };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred while sending email';
    console.error('[Email] Failed to send message:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Send an OTP verification email
 */
export async function sendOTPEmail(
  to: string,
  otp: string
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  const subject = 'Your Resonance Studio Login Code';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Login Code</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: linear-gradient(135deg, #18181b 0%, #27272a 100%); border-radius: 16px; padding: 40px; border: 1px solid #3f3f46;">
          <!-- Logo/Header -->
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #a855f7; font-size: 28px; margin: 0; font-weight: 700;">
              🎵 Resonance Studio
            </h1>
          </div>
          
          <!-- Content -->
          <div style="text-align: center;">
            <p style="color: #a1a1aa; font-size: 16px; margin: 0 0 24px 0;">
              Your one-time login code is:
            </p>
            
            <!-- OTP Code -->
            <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); border-radius: 12px; padding: 24px; margin: 0 0 24px 0;">
              <span style="font-size: 36px; font-weight: 700; color: #ffffff; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                ${otp}
              </span>
            </div>
            
            <!-- Expiry Notice -->
            <p style="color: #f59e0b; font-size: 14px; margin: 0 0 24px 0;">
              ⏱️ This code expires in 5 minutes
            </p>
            
            <!-- Security Warning -->
            <div style="background-color: #1f1f23; border-radius: 8px; padding: 16px; border-left: 4px solid #ef4444;">
              <p style="color: #fca5a5; font-size: 13px; margin: 0;">
                🔒 <strong>Security Notice:</strong> Never share this code with anyone. Resonance Studio will never ask for your code.
              </p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #3f3f46; text-align: center;">
            <p style="color: #71717a; font-size: 12px; margin: 0;">
              This email was sent by Resonance Studio.<br>
              If you didn't request this code, please ignore this email.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail(to, subject, html);
}

/**
 * Send a booking confirmation email
 */
export async function sendBookingConfirmationEmail(
  to: string,
  booking: {
    id: string;
    name?: string;
    studio: string;
    session_type: string;
    session_details?: string;
    date: string;
    start_time: string;
    end_time: string;
    total_amount?: number;
  }
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  const subject = '✅ Booking Confirmed - Resonance Studio';
  
  const formattedDate = new Date(booking.date).toLocaleDateString('en-IN', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long',
    year: 'numeric'
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Booking Confirmed</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: linear-gradient(135deg, #18181b 0%, #27272a 100%); border-radius: 16px; padding: 40px; border: 1px solid #3f3f46;">
          <!-- Logo/Header -->
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #a855f7; font-size: 28px; margin: 0; font-weight: 700;">
              🎵 Resonance Studio
            </h1>
          </div>
          
          <!-- Success Banner -->
          <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
            <h2 style="color: #ffffff; font-size: 24px; margin: 0;">✅ Booking Confirmed!</h2>
          </div>
          
          ${booking.name ? `<p style="color: #e4e4e7; font-size: 16px; margin: 0 0 24px 0;">Hi ${booking.name},</p>` : ''}
          
          <p style="color: #a1a1aa; font-size: 16px; margin: 0 0 24px 0;">
            Your studio session has been successfully booked. Here are your booking details:
          </p>
          
          <!-- Booking Details Card -->
          <div style="background-color: #1f1f23; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #3f3f46;">
                  <span style="color: #71717a; font-size: 14px;">Booking ID</span><br>
                  <span style="color: #ffffff; font-size: 16px; font-weight: 600;">${booking.id.slice(0, 8).toUpperCase()}</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #3f3f46;">
                  <span style="color: #71717a; font-size: 14px;">Studio</span><br>
                  <span style="color: #ffffff; font-size: 16px; font-weight: 600;">${booking.studio}</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #3f3f46;">
                  <span style="color: #71717a; font-size: 14px;">Session Type</span><br>
                  <span style="color: #ffffff; font-size: 16px; font-weight: 600;">${booking.session_type}</span>
                  ${booking.session_details ? `<br><span style="color: #a1a1aa; font-size: 14px;">${booking.session_details}</span>` : ''}
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #3f3f46;">
                  <span style="color: #71717a; font-size: 14px;">Date</span><br>
                  <span style="color: #ffffff; font-size: 16px; font-weight: 600;">${formattedDate}</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 0; ${booking.total_amount ? 'border-bottom: 1px solid #3f3f46;' : ''}">
                  <span style="color: #71717a; font-size: 14px;">Time</span><br>
                  <span style="color: #ffffff; font-size: 16px; font-weight: 600;">${booking.start_time} - ${booking.end_time}</span>
                </td>
              </tr>
              ${booking.total_amount ? `
              <tr>
                <td style="padding: 12px 0;">
                  <span style="color: #71717a; font-size: 14px;">Amount</span><br>
                  <span style="color: #10b981; font-size: 20px; font-weight: 700;">₹${booking.total_amount}</span>
                </td>
              </tr>
              ` : ''}
            </table>
          </div>
          
          <!-- Reminder -->
          <div style="background-color: #1f1f23; border-radius: 8px; padding: 16px; border-left: 4px solid #a855f7;">
            <p style="color: #e4e4e7; font-size: 14px; margin: 0;">
              📍 Please arrive 10 minutes before your session time.
            </p>
          </div>
          
          <!-- Footer -->
          <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #3f3f46; text-align: center;">
            <p style="color: #a1a1aa; font-size: 14px; margin: 0 0 8px 0;">
              Thank you for choosing Resonance Studio!
            </p>
            <p style="color: #71717a; font-size: 12px; margin: 0;">
              If you need to modify or cancel your booking, please visit our website.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail(to, subject, html);
}

/**
 * Send a booking update email
 */
export async function sendBookingUpdateEmail(
  to: string,
  booking: {
    id: string;
    name?: string;
    studio: string;
    session_type: string;
    session_details?: string;
    date: string;
    start_time: string;
    end_time: string;
    total_amount?: number;
  }
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  const subject = '📝 Booking Updated - Resonance Studio';
  
  const formattedDate = new Date(booking.date).toLocaleDateString('en-IN', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long',
    year: 'numeric'
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Booking Updated</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: linear-gradient(135deg, #18181b 0%, #27272a 100%); border-radius: 16px; padding: 40px; border: 1px solid #3f3f46;">
          <!-- Logo/Header -->
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #a855f7; font-size: 28px; margin: 0; font-weight: 700;">
              🎵 Resonance Studio
            </h1>
          </div>
          
          <!-- Update Banner -->
          <div style="background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%); border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
            <h2 style="color: #ffffff; font-size: 24px; margin: 0;">📝 Booking Updated!</h2>
          </div>
          
          ${booking.name ? `<p style="color: #e4e4e7; font-size: 16px; margin: 0 0 24px 0;">Hi ${booking.name},</p>` : ''}
          
          <p style="color: #a1a1aa; font-size: 16px; margin: 0 0 24px 0;">
            Your booking has been successfully updated. Here are your new booking details:
          </p>
          
          <!-- Booking Details Card -->
          <div style="background-color: #1f1f23; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #3f3f46;">
                  <span style="color: #71717a; font-size: 14px;">Booking ID</span><br>
                  <span style="color: #ffffff; font-size: 16px; font-weight: 600;">${booking.id.slice(0, 8).toUpperCase()}</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #3f3f46;">
                  <span style="color: #71717a; font-size: 14px;">Studio</span><br>
                  <span style="color: #ffffff; font-size: 16px; font-weight: 600;">${booking.studio}</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #3f3f46;">
                  <span style="color: #71717a; font-size: 14px;">Session Type</span><br>
                  <span style="color: #ffffff; font-size: 16px; font-weight: 600;">${booking.session_type}</span>
                  ${booking.session_details ? `<br><span style="color: #a1a1aa; font-size: 14px;">${booking.session_details}</span>` : ''}
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #3f3f46;">
                  <span style="color: #71717a; font-size: 14px;">Date</span><br>
                  <span style="color: #ffffff; font-size: 16px; font-weight: 600;">${formattedDate}</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 0; ${booking.total_amount ? 'border-bottom: 1px solid #3f3f46;' : ''}">
                  <span style="color: #71717a; font-size: 14px;">Time</span><br>
                  <span style="color: #ffffff; font-size: 16px; font-weight: 600;">${booking.start_time} - ${booking.end_time}</span>
                </td>
              </tr>
              ${booking.total_amount ? `
              <tr>
                <td style="padding: 12px 0;">
                  <span style="color: #71717a; font-size: 14px;">Amount</span><br>
                  <span style="color: #10b981; font-size: 20px; font-weight: 700;">₹${booking.total_amount}</span>
                </td>
              </tr>
              ` : ''}
            </table>
          </div>
          
          <!-- Reminder -->
          <div style="background-color: #1f1f23; border-radius: 8px; padding: 16px; border-left: 4px solid #f59e0b;">
            <p style="color: #e4e4e7; font-size: 14px; margin: 0;">
              📍 Please make note of the updated details and arrive 10 minutes before your session.
            </p>
          </div>
          
          <!-- Footer -->
          <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #3f3f46; text-align: center;">
            <p style="color: #a1a1aa; font-size: 14px; margin: 0 0 8px 0;">
              Thank you for choosing Resonance Studio!
            </p>
            <p style="color: #71717a; font-size: 12px; margin: 0;">
              If you have any questions, please contact us.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail(to, subject, html);
}

/**
 * Send a booking cancellation email
 */
export async function sendBookingCancellationEmail(
  to: string,
  booking: {
    id: string;
    name?: string;
    studio: string;
    session_type: string;
    date: string;
    start_time: string;
    end_time: string;
  }
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  const subject = '❌ Booking Cancelled - Resonance Studio';
  
  const formattedDate = new Date(booking.date).toLocaleDateString('en-IN', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long',
    year: 'numeric'
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Booking Cancelled</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: linear-gradient(135deg, #18181b 0%, #27272a 100%); border-radius: 16px; padding: 40px; border: 1px solid #3f3f46;">
          <!-- Logo/Header -->
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #a855f7; font-size: 28px; margin: 0; font-weight: 700;">
              🎵 Resonance Studio
            </h1>
          </div>
          
          <!-- Cancellation Banner -->
          <div style="background: linear-gradient(135deg, #b91c1c 0%, #ef4444 100%); border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
            <h2 style="color: #ffffff; font-size: 24px; margin: 0;">❌ Booking Cancelled</h2>
          </div>
          
          ${booking.name ? `<p style="color: #e4e4e7; font-size: 16px; margin: 0 0 24px 0;">Hi ${booking.name},</p>` : ''}
          
          <p style="color: #a1a1aa; font-size: 16px; margin: 0 0 24px 0;">
            Your booking has been cancelled. Here are the details of the cancelled booking:
          </p>
          
          <!-- Booking Details Card -->
          <div style="background-color: #1f1f23; border-radius: 12px; padding: 24px; margin-bottom: 24px; opacity: 0.8;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #3f3f46;">
                  <span style="color: #71717a; font-size: 14px;">Booking ID</span><br>
                  <span style="color: #a1a1aa; font-size: 16px; font-weight: 600; text-decoration: line-through;">${booking.id.slice(0, 8).toUpperCase()}</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #3f3f46;">
                  <span style="color: #71717a; font-size: 14px;">Studio</span><br>
                  <span style="color: #a1a1aa; font-size: 16px;">${booking.studio}</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #3f3f46;">
                  <span style="color: #71717a; font-size: 14px;">Session Type</span><br>
                  <span style="color: #a1a1aa; font-size: 16px;">${booking.session_type}</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #3f3f46;">
                  <span style="color: #71717a; font-size: 14px;">Date</span><br>
                  <span style="color: #a1a1aa; font-size: 16px;">${formattedDate}</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 0;">
                  <span style="color: #71717a; font-size: 14px;">Time</span><br>
                  <span style="color: #a1a1aa; font-size: 16px;">${booking.start_time} - ${booking.end_time}</span>
                </td>
              </tr>
            </table>
          </div>
          
          <!-- Rebook Prompt -->
          <div style="background-color: #1f1f23; border-radius: 8px; padding: 16px; border-left: 4px solid #a855f7;">
            <p style="color: #e4e4e7; font-size: 14px; margin: 0;">
              🎵 Changed your mind? Visit our website to make a new booking anytime!
            </p>
          </div>
          
          <!-- Footer -->
          <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #3f3f46; text-align: center;">
            <p style="color: #a1a1aa; font-size: 14px; margin: 0 0 8px 0;">
              We hope to see you at Resonance Studio soon!
            </p>
            <p style="color: #71717a; font-size: 12px; margin: 0;">
              If you have any questions, please contact us.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail(to, subject, html);
}
