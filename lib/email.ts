import { Resend } from 'resend';
import { SITE_URL } from './seo';

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

/** Escape user-provided text (names, session details) before it goes into HTML. */
function esc(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

// Site palette: Midnight Navy, Champagne, Dusty Rose, Pearl White
const C = {
  page: '#101c3d',
  card: '#192a56',
  line: '#2a3d70',
  stub: '#22335f',
  champagne: '#f7d794',
  rose: '#eda6a3',
  pearl: '#fcfbfb',
  muted: '#a8b1cc',
  faint: '#7682a6',
};
const FONT = "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

/**
 * Base email template wrapper - site navy theme, email-safe tables + inline styles
 */
function emailWrapper(content: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="color-scheme" content="dark">
    </head>
    <body style="margin: 0; padding: 0; background-color: ${C.page}; font-family: ${FONT};">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: ${C.page};">
        <tr>
          <td align="center" style="padding: 32px 16px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px;">
              <tr>
                <td style="padding: 0 4px 20px 4px;">
                  <span style="display: inline-block; width: 28px; height: 28px; line-height: 28px; text-align: center; border-radius: 7px; background-color: ${C.champagne}; color: ${C.card}; font-size: 15px; font-weight: 700; vertical-align: middle;">&#9835;</span>
                  <span style="color: ${C.pearl}; font-size: 15px; font-weight: 700; vertical-align: middle; margin-left: 8px;">Resonance Studio</span>
                </td>
              </tr>
              <tr>
                <td style="background-color: ${C.card}; border: 1px solid ${C.line}; border-radius: 16px; padding: 28px;">
                  ${content}
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 4px 0 4px; color: ${C.faint}; font-size: 12px; line-height: 18px;">
                  Resonance Studio · 45, Shivprasad Housing Society, Dattawadi, Pune 411030<br>
                  <a href="${SITE_URL}/contact" style="color: ${C.muted}; text-decoration: underline;">Contact us</a> ·
                  <a href="${SITE_URL}/policies" style="color: ${C.muted}; text-decoration: underline;">Studio policies</a><br>
                  © ${new Date().getFullYear()} Resonance Studio
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
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

    // Email sent successfully - ID: ${data?.id}
    return { success: true, id: data?.id || '' };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred while sending email';
    console.error('[Email] Failed to send message:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

type EmailBooking = {
  id: string;
  name?: string;
  studio: string;
  session_type: string;
  session_details?: string;
  date: string;
  start_time: string;
  end_time: string;
  total_amount?: number;
};

/** Small coloured status line above the heading. */
function statusLine(color: string, label: string): string {
  return `<p style="margin: 0 0 6px 0; color: ${color}; font-size: 12px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase;">&#9679; ${label}</p>`;
}

/** Booking details as label/value rows (same rows and order as the original emails). */
function details(booking: EmailBooking, opts: { muted?: boolean; highlightWhen?: boolean } = {}): string {
  const formattedDate = new Date(`${booking.date.slice(0, 10)}T00:00:00`).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const value = opts.muted ? C.muted : C.pearl;
  const when = opts.highlightWhen ? `color: ${C.champagne}; font-weight: 600;` : `color: ${value};`;
  const row = (label: string, val: string, style = `color: ${value};`) => `
          <tr>
            <td style="padding: 8px 0; color: ${C.faint}; font-size: 13px;">${label}</td>
            <td style="padding: 8px 0; ${style} font-size: 13px; text-align: right;">${val}</td>
          </tr>`;

  return `
    <div style="background-color: ${C.stub}; border: 1px solid ${C.line}; border-radius: 12px; padding: 16px; ${opts.muted ? 'opacity: 0.7;' : ''}">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
        ${row('Booking ID', booking.id.slice(0, 8).toUpperCase(), `color: ${value}; font-weight: 600; ${opts.muted ? 'text-decoration: line-through;' : ''}`)}
        ${row('Session', esc(booking.session_type))}
        ${booking.session_details && booking.session_details !== booking.session_type ? row('Details', esc(booking.session_details), `color: ${C.muted};`) : ''}
        ${row('Studio', esc(booking.studio))}
        ${row('Date', formattedDate, when)}
        ${row('Time', `${formatTime12Hour(booking.start_time)} - ${formatTime12Hour(booking.end_time)}`, when)}
        ${booking.total_amount ? `
          <tr>
            <td style="padding: 12px 0 0 0; border-top: 1px solid ${C.line}; color: ${C.faint}; font-size: 13px;">Amount</td>
            <td style="padding: 12px 0 0 0; border-top: 1px solid ${C.line}; color: ${C.champagne}; font-size: 16px; text-align: right; font-weight: 700;">₹${booking.total_amount.toLocaleString('en-IN')}</td>
          </tr>` : ''}
      </table>
    </div>
  `;
}

/** Champagne call-to-action button (table-based so Outlook renders it). */
function button(href: string, label: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top: 24px;">
      <tr>
        <td style="background-color: ${C.champagne}; border-radius: 10px;">
          <a href="${href}" style="display: inline-block; padding: 12px 22px; color: ${C.card}; font-size: 14px; font-weight: 700; text-decoration: none;">${label}</a>
        </td>
      </tr>
    </table>
  `;
}

/** Shared layout for every booking email. */
function bookingEmail(opts: {
  status: { color: string; label: string };
  heading: string;
  intro: string;
  booking: EmailBooking;
  note?: string;
  muted?: boolean;
  highlightWhen?: boolean;
  footnote: string;
  cta: { href: string; label: string };
}): string {
  const { booking } = opts;
  return emailWrapper(`
    ${statusLine(opts.status.color, opts.status.label)}
    <h1 style="margin: 0 0 12px 0; color: ${C.pearl}; font-size: 24px; font-weight: 700; line-height: 30px;">${opts.heading}</h1>
    <p style="margin: 0 0 20px 0; color: ${C.muted}; font-size: 15px; line-height: 22px;">
      ${booking.name ? `Hi ${esc(booking.name)}, ` : ''}${opts.intro}
    </p>
    ${opts.note ? `<p style="margin: 0 0 20px 0; padding: 12px 14px; border-left: 3px solid ${C.champagne}; background-color: ${C.stub}; color: ${C.pearl}; font-size: 13px; line-height: 19px; border-radius: 0 8px 8px 0;">${opts.note}</p>` : ''}
    ${details(booking, { muted: opts.muted, highlightWhen: opts.highlightWhen })}
    <p style="margin: 20px 0 0 0; color: ${C.muted}; font-size: 13px; line-height: 20px;">${opts.footnote}</p>
    ${button(opts.cta.href, opts.cta.label)}
  `);
}

const STATUS = {
  confirmed: { color: '#6ee7b7', label: 'Booking confirmed' },
  updated: { color: '#fcd34d', label: 'Booking updated' },
  reminder: { color: C.champagne, label: 'Session reminder' },
  cancelled: { color: '#fca5a5', label: 'Booking cancelled' },
};
const ARRIVE = 'Please arrive 10 minutes before your session. Park inside the building and keep the society gate clear.';
const VIEW = { href: `${SITE_URL}/view-bookings`, label: 'View your bookings' };

/**
 * Send an OTP verification email
 */
export async function sendOTPEmail(
  to: string,
  otp: string
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  const subject = 'Your Resonance Studio Verification Code';

  const content = `
    ${statusLine(C.champagne, 'Verification code')}
    <h1 style="margin: 0 0 12px 0; color: ${C.pearl}; font-size: 24px; font-weight: 700; line-height: 30px;">Your code</h1>
    <p style="margin: 0 0 20px 0; color: ${C.muted}; font-size: 15px; line-height: 22px;">Enter this code to continue.</p>
    <div style="background-color: ${C.stub}; border: 1px solid ${C.line}; border-radius: 12px; padding: 22px; text-align: center;">
      <span style="font-size: 34px; font-weight: 700; color: ${C.champagne}; letter-spacing: 10px;">${esc(otp)}</span>
    </div>
    <p style="margin: 20px 0 0 0; color: ${C.muted}; font-size: 13px; line-height: 20px;">
      This code expires in 5 minutes. Don't share it with anyone. If you didn't ask for it, you can ignore this email.
    </p>
  `;

  return sendEmail(to, subject, emailWrapper(content));
}

/**
 * Send a booking confirmation email
 */
export async function sendBookingConfirmationEmail(
  to: string,
  booking: EmailBooking
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  return sendEmail(
    to,
    'Booking Confirmed - Resonance Studio',
    bookingEmail({
      status: STATUS.confirmed,
      heading: "You're booked in.",
      intro: 'your session is confirmed. Here are the details.',
      booking,
      footnote: ARRIVE,
      cta: VIEW,
    }),
  );
}

/**
 * Send a booking confirmation email for admin-created bookings
 */
export async function sendAdminBookingConfirmationEmail(
  to: string,
  booking: EmailBooking
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  return sendEmail(
    to,
    'Booking Confirmed - Resonance Studio',
    bookingEmail({
      status: STATUS.confirmed,
      heading: "You're booked in.",
      intro: 'your session is confirmed. Here are the details.',
      note: 'The Resonance Studio team created this booking for you.',
      booking,
      footnote: ARRIVE,
      cta: VIEW,
    }),
  );
}

/**
 * Send a booking update email
 */
export async function sendBookingUpdateEmail(
  to: string,
  booking: EmailBooking
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  return sendEmail(
    to,
    'Booking Updated - Resonance Studio',
    bookingEmail({
      status: STATUS.updated,
      heading: 'Your booking has changed.',
      intro: 'here are the updated details. Please use these from now on.',
      booking,
      footnote: ARRIVE,
      cta: VIEW,
    }),
  );
}

/**
 * Send a booking reminder email (24h before session)
 */
export async function sendBookingReminderEmail(
  to: string,
  booking: EmailBooking
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  return sendEmail(
    to,
    'Reminder: Your Session Tomorrow - Resonance Studio',
    bookingEmail({
      status: STATUS.reminder,
      heading: 'See you soon.',
      intro: 'this is a reminder that your session is coming up.',
      booking,
      highlightWhen: true,
      footnote: `${ARRIVE} Please keep noise down after 10 PM.`,
      cta: VIEW,
    }),
  );
}

/**
 * Send a booking cancellation email
 */
export async function sendBookingCancellationEmail(
  to: string,
  booking: Omit<EmailBooking, 'session_details' | 'total_amount'>
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  return sendEmail(
    to,
    'Booking Cancelled - Resonance Studio',
    bookingEmail({
      status: STATUS.cancelled,
      heading: 'Your booking is cancelled.',
      intro: 'this session has been cancelled and the slot released.',
      booking,
      muted: true,
      footnote: 'Want a different time? You can book a new session any time.',
      cta: { href: `${SITE_URL}/booking`, label: 'Book a session' },
    }),
  );
}
