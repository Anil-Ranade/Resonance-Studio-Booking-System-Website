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
 * Format time to 12-hour format with AM/PM
 */
function formatTime12Hour(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Base email template wrapper - minimal dark theme
 */
function emailWrapper(content: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #09090b;">
      <div style="max-width: 480px; margin: 0 auto; padding: 32px 16px;">
        ${content}
        <p style="color: #52525b; font-size: 11px; text-align: center; margin-top: 32px;">
          © ${new Date().getFullYear()} Resonance Studio, Sinhgad Road, Pune
        </p>
      </div>
    </body>
    </html>
  `;
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
  const subject = 'Your Resonance Studio Verification Code';
  
  const content = `
    <div style="background-color: #18181b; border-radius: 12px; padding: 32px; border: 1px solid #27272a;">
      <h1 style="color: #a855f7; font-size: 20px; margin: 0 0 24px 0; text-align: center; font-weight: 600;">
        Resonance Studio
      </h1>
      
      <p style="color: #a1a1aa; font-size: 14px; margin: 0 0 24px 0; text-align: center;">
        Your verification code is:
      </p>
      
      <div style="background-color: #27272a; border-radius: 8px; padding: 20px; text-align: center; margin: 0 0 24px 0;">
        <span style="font-size: 32px; font-weight: 700; color: #ffffff; letter-spacing: 6px; font-family: monospace;">
          ${otp}
        </span>
      </div>
      
      <p style="color: #71717a; font-size: 12px; margin: 0; text-align: center;">
        This code expires in 5 minutes. Don't share it with anyone.
      </p>
    </div>
  `;
  
  return sendEmail(to, subject, emailWrapper(content));
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
  const subject = 'Booking Confirmed – Resonance Studio';
  
  const formattedDate = new Date(booking.date).toLocaleDateString('en-IN', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long',
    year: 'numeric'
  });

  const content = `
    <div style="background-color: #18181b; border-radius: 12px; padding: 32px; border: 1px solid #27272a;">
      <h1 style="color: #a855f7; font-size: 20px; margin: 0 0 8px 0; text-align: center; font-weight: 600;">
        Resonance Studio
      </h1>
      <p style="color: #22c55e; font-size: 14px; margin: 0 0 24px 0; text-align: center; font-weight: 500;">
        ✓ Booking Confirmed
      </p>
      
      ${booking.name ? `<p style="color: #e4e4e7; font-size: 14px; margin: 0 0 20px 0;">Hi ${booking.name},</p>` : ''}
      
      <p style="color: #a1a1aa; font-size: 14px; margin: 0 0 20px 0;">
        Your session is booked. Details below:
      </p>
      
      <div style="background-color: #27272a; border-radius: 8px; padding: 16px; margin: 0 0 20px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #71717a; font-size: 13px;">Booking ID</td>
            <td style="padding: 8px 0; color: #ffffff; font-size: 13px; text-align: right; font-weight: 500;">${booking.id.slice(0, 8).toUpperCase()}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #71717a; font-size: 13px;">Session</td>
            <td style="padding: 8px 0; color: #ffffff; font-size: 13px; text-align: right;">${booking.session_type}</td>
          </tr>
          ${booking.session_details && booking.session_details !== booking.session_type ? `
          <tr>
            <td style="padding: 8px 0; color: #71717a; font-size: 13px;">Details</td>
            <td style="padding: 8px 0; color: #a1a1aa; font-size: 13px; text-align: right;">${booking.session_details}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 8px 0; color: #71717a; font-size: 13px;">Studio</td>
            <td style="padding: 8px 0; color: #ffffff; font-size: 13px; text-align: right;">${booking.studio}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #71717a; font-size: 13px;">Date</td>
            <td style="padding: 8px 0; color: #ffffff; font-size: 13px; text-align: right;">${formattedDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #71717a; font-size: 13px;">Time</td>
            <td style="padding: 8px 0; color: #ffffff; font-size: 13px; text-align: right;">${formatTime12Hour(booking.start_time)} – ${formatTime12Hour(booking.end_time)}</td>
          </tr>
          ${booking.total_amount ? `
          <tr>
            <td style="padding: 12px 0 0 0; border-top: 1px solid #3f3f46; color: #71717a; font-size: 13px;">Amount</td>
            <td style="padding: 12px 0 0 0; border-top: 1px solid #3f3f46; color: #a855f7; font-size: 16px; text-align: right; font-weight: 600;">₹${booking.total_amount.toLocaleString('en-IN')}</td>
          </tr>
          ` : ''}
        </table>
      </div>
      
      <p style="color: #71717a; font-size: 12px; margin: 0; text-align: center;">
        Please arrive 10 minutes before your session.
      </p>
    </div>
  `;
  
  return sendEmail(to, subject, emailWrapper(content));
}

/**
 * Send a booking confirmation email for admin-created bookings
 */
export async function sendAdminBookingConfirmationEmail(
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
  const subject = 'Booking Confirmed – Resonance Studio';
  
  const formattedDate = new Date(booking.date).toLocaleDateString('en-IN', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long',
    year: 'numeric'
  });

  const content = `
    <div style="background-color: #18181b; border-radius: 12px; padding: 32px; border: 1px solid #27272a;">
      <h1 style="color: #a855f7; font-size: 20px; margin: 0 0 8px 0; text-align: center; font-weight: 600;">
        Resonance Studio
      </h1>
      <p style="color: #22c55e; font-size: 14px; margin: 0 0 24px 0; text-align: center; font-weight: 500;">
        ✓ Booking Confirmed
      </p>
      
      ${booking.name ? `<p style="color: #e4e4e7; font-size: 14px; margin: 0 0 20px 0;">Hi ${booking.name},</p>` : ''}
      
      <div style="background-color: #1e3a5f; border-radius: 6px; padding: 12px; margin: 0 0 20px 0;">
        <p style="color: #93c5fd; font-size: 13px; margin: 0;">
          This booking was created by the Resonance Studio team on your behalf.
        </p>
      </div>
      
      <p style="color: #a1a1aa; font-size: 14px; margin: 0 0 20px 0;">
        Your session is booked. Details below:
      </p>
      
      <div style="background-color: #27272a; border-radius: 8px; padding: 16px; margin: 0 0 20px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #71717a; font-size: 13px;">Booking ID</td>
            <td style="padding: 8px 0; color: #ffffff; font-size: 13px; text-align: right; font-weight: 500;">${booking.id.slice(0, 8).toUpperCase()}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #71717a; font-size: 13px;">Session</td>
            <td style="padding: 8px 0; color: #ffffff; font-size: 13px; text-align: right;">${booking.session_type}</td>
          </tr>
          ${booking.session_details && booking.session_details !== booking.session_type ? `
          <tr>
            <td style="padding: 8px 0; color: #71717a; font-size: 13px;">Details</td>
            <td style="padding: 8px 0; color: #a1a1aa; font-size: 13px; text-align: right;">${booking.session_details}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 8px 0; color: #71717a; font-size: 13px;">Studio</td>
            <td style="padding: 8px 0; color: #ffffff; font-size: 13px; text-align: right;">${booking.studio}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #71717a; font-size: 13px;">Date</td>
            <td style="padding: 8px 0; color: #ffffff; font-size: 13px; text-align: right;">${formattedDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #71717a; font-size: 13px;">Time</td>
            <td style="padding: 8px 0; color: #ffffff; font-size: 13px; text-align: right;">${formatTime12Hour(booking.start_time)} – ${formatTime12Hour(booking.end_time)}</td>
          </tr>
          ${booking.total_amount ? `
          <tr>
            <td style="padding: 12px 0 0 0; border-top: 1px solid #3f3f46; color: #71717a; font-size: 13px;">Amount</td>
            <td style="padding: 12px 0 0 0; border-top: 1px solid #3f3f46; color: #a855f7; font-size: 16px; text-align: right; font-weight: 600;">₹${booking.total_amount.toLocaleString('en-IN')}</td>
          </tr>
          ` : ''}
        </table>
      </div>
      
      <p style="color: #71717a; font-size: 12px; margin: 0; text-align: center;">
        Please arrive 10 minutes before your session.
      </p>
    </div>
  `;
  
  return sendEmail(to, subject, emailWrapper(content));
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
  const subject = 'Booking Updated – Resonance Studio';
  
  const formattedDate = new Date(booking.date).toLocaleDateString('en-IN', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long',
    year: 'numeric'
  });

  const content = `
    <div style="background-color: #18181b; border-radius: 12px; padding: 32px; border: 1px solid #27272a;">
      <h1 style="color: #a855f7; font-size: 20px; margin: 0 0 8px 0; text-align: center; font-weight: 600;">
        Resonance Studio
      </h1>
      <p style="color: #f59e0b; font-size: 14px; margin: 0 0 24px 0; text-align: center; font-weight: 500;">
        ✎ Booking Updated
      </p>
      
      ${booking.name ? `<p style="color: #e4e4e7; font-size: 14px; margin: 0 0 20px 0;">Hi ${booking.name},</p>` : ''}
      
      <p style="color: #a1a1aa; font-size: 14px; margin: 0 0 20px 0;">
        Your booking has been updated. New details:
      </p>
      
      <div style="background-color: #27272a; border-radius: 8px; padding: 16px; margin: 0 0 20px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #71717a; font-size: 13px;">Booking ID</td>
            <td style="padding: 8px 0; color: #ffffff; font-size: 13px; text-align: right; font-weight: 500;">${booking.id.slice(0, 8).toUpperCase()}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #71717a; font-size: 13px;">Session</td>
            <td style="padding: 8px 0; color: #ffffff; font-size: 13px; text-align: right;">${booking.session_type}</td>
          </tr>
          ${booking.session_details && booking.session_details !== booking.session_type ? `
          <tr>
            <td style="padding: 8px 0; color: #71717a; font-size: 13px;">Details</td>
            <td style="padding: 8px 0; color: #a1a1aa; font-size: 13px; text-align: right;">${booking.session_details}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 8px 0; color: #71717a; font-size: 13px;">Studio</td>
            <td style="padding: 8px 0; color: #ffffff; font-size: 13px; text-align: right;">${booking.studio}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #71717a; font-size: 13px;">Date</td>
            <td style="padding: 8px 0; color: #ffffff; font-size: 13px; text-align: right;">${formattedDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #71717a; font-size: 13px;">Time</td>
            <td style="padding: 8px 0; color: #ffffff; font-size: 13px; text-align: right;">${formatTime12Hour(booking.start_time)} – ${formatTime12Hour(booking.end_time)}</td>
          </tr>
          ${booking.total_amount ? `
          <tr>
            <td style="padding: 12px 0 0 0; border-top: 1px solid #3f3f46; color: #71717a; font-size: 13px;">Amount</td>
            <td style="padding: 12px 0 0 0; border-top: 1px solid #3f3f46; color: #a855f7; font-size: 16px; text-align: right; font-weight: 600;">₹${booking.total_amount.toLocaleString('en-IN')}</td>
          </tr>
          ` : ''}
        </table>
      </div>
      
      <p style="color: #71717a; font-size: 12px; margin: 0; text-align: center;">
        Please note the updated details above.
      </p>
    </div>
  `;
  
  return sendEmail(to, subject, emailWrapper(content));
}

/**
 * Send a booking reminder email (24h before session)
 */
export async function sendBookingReminderEmail(
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
  const subject = 'Reminder: Your Session Tomorrow – Resonance Studio';
  
  const formattedDate = new Date(booking.date).toLocaleDateString('en-IN', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long',
    year: 'numeric'
  });

  const content = `
    <div style="background-color: #18181b; border-radius: 12px; padding: 32px; border: 1px solid #27272a;">
      <h1 style="color: #a855f7; font-size: 20px; margin: 0 0 8px 0; text-align: center; font-weight: 600;">
        Resonance Studio
      </h1>
      <p style="color: #38bdf8; font-size: 14px; margin: 0 0 24px 0; text-align: center; font-weight: 500;">
        🔔 Session Reminder
      </p>
      
      ${booking.name ? `<p style="color: #e4e4e7; font-size: 14px; margin: 0 0 20px 0;">Hi ${booking.name},</p>` : ''}
      
      <p style="color: #a1a1aa; font-size: 14px; margin: 0 0 20px 0;">
        Just a friendly reminder – your session is <strong style="color: #fbbf24;">tomorrow</strong>! Here are the details:
      </p>
      
      <div style="background-color: #27272a; border-radius: 8px; padding: 16px; margin: 0 0 20px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #71717a; font-size: 13px;">Booking ID</td>
            <td style="padding: 8px 0; color: #ffffff; font-size: 13px; text-align: right; font-weight: 500;">${booking.id.slice(0, 8).toUpperCase()}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #71717a; font-size: 13px;">Session</td>
            <td style="padding: 8px 0; color: #ffffff; font-size: 13px; text-align: right;">${booking.session_type}</td>
          </tr>
          ${booking.session_details && booking.session_details !== booking.session_type ? `
          <tr>
            <td style="padding: 8px 0; color: #71717a; font-size: 13px;">Details</td>
            <td style="padding: 8px 0; color: #a1a1aa; font-size: 13px; text-align: right;">${booking.session_details}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 8px 0; color: #71717a; font-size: 13px;">Studio</td>
            <td style="padding: 8px 0; color: #ffffff; font-size: 13px; text-align: right;">${booking.studio}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #71717a; font-size: 13px;">Date</td>
            <td style="padding: 8px 0; color: #fbbf24; font-size: 13px; text-align: right; font-weight: 500;">${formattedDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #71717a; font-size: 13px;">Time</td>
            <td style="padding: 8px 0; color: #fbbf24; font-size: 13px; text-align: right; font-weight: 500;">${formatTime12Hour(booking.start_time)} – ${formatTime12Hour(booking.end_time)}</td>
          </tr>
          ${booking.total_amount ? `
          <tr>
            <td style="padding: 12px 0 0 0; border-top: 1px solid #3f3f46; color: #71717a; font-size: 13px;">Amount</td>
            <td style="padding: 12px 0 0 0; border-top: 1px solid #3f3f46; color: #a855f7; font-size: 16px; text-align: right; font-weight: 600;">₹${booking.total_amount.toLocaleString('en-IN')}</td>
          </tr>
          ` : ''}
        </table>
      </div>
      
      <p style="color: #71717a; font-size: 12px; margin: 0; text-align: center;">
        Please arrive 10 minutes before your session. See you soon! 🎵
      </p>
    </div>
  `;
  
  return sendEmail(to, subject, emailWrapper(content));
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
  const subject = 'Booking Cancelled – Resonance Studio';
  
  const formattedDate = new Date(booking.date).toLocaleDateString('en-IN', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long',
    year: 'numeric'
  });

  const content = `
    <div style="background-color: #18181b; border-radius: 12px; padding: 32px; border: 1px solid #27272a;">
      <h1 style="color: #a855f7; font-size: 20px; margin: 0 0 8px 0; text-align: center; font-weight: 600;">
        Resonance Studio
      </h1>
      <p style="color: #ef4444; font-size: 14px; margin: 0 0 24px 0; text-align: center; font-weight: 500;">
        ✕ Booking Cancelled
      </p>
      
      ${booking.name ? `<p style="color: #e4e4e7; font-size: 14px; margin: 0 0 20px 0;">Hi ${booking.name},</p>` : ''}
      
      <p style="color: #a1a1aa; font-size: 14px; margin: 0 0 20px 0;">
        Your booking has been cancelled:
      </p>
      
      <div style="background-color: #27272a; border-radius: 8px; padding: 16px; margin: 0 0 20px 0; opacity: 0.7;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #71717a; font-size: 13px;">Booking ID</td>
            <td style="padding: 8px 0; color: #a1a1aa; font-size: 13px; text-align: right; text-decoration: line-through;">${booking.id.slice(0, 8).toUpperCase()}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #71717a; font-size: 13px;">Session</td>
            <td style="padding: 8px 0; color: #a1a1aa; font-size: 13px; text-align: right;">${booking.session_type}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #71717a; font-size: 13px;">Studio</td>
            <td style="padding: 8px 0; color: #a1a1aa; font-size: 13px; text-align: right;">${booking.studio}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #71717a; font-size: 13px;">Date</td>
            <td style="padding: 8px 0; color: #a1a1aa; font-size: 13px; text-align: right;">${formattedDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #71717a; font-size: 13px;">Time</td>
            <td style="padding: 8px 0; color: #a1a1aa; font-size: 13px; text-align: right;">${formatTime12Hour(booking.start_time)} – ${formatTime12Hour(booking.end_time)}</td>
          </tr>
        </table>
      </div>
      
      <p style="color: #71717a; font-size: 12px; margin: 0; text-align: center;">
        You can book a new session anytime on our website.
      </p>
    </div>
  `;
  
  return sendEmail(to, subject, emailWrapper(content));
}
