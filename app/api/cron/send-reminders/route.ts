import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { send24HourReminderSMS, send1HourReminderSMS } from '@/lib/sms';

interface Reminder {
  id: string;
  booking_id: string;
  scheduled_at: string;
  type: 'confirmation' | '24h_reminder' | '1h_reminder' | 'custom';
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
}

interface Booking {
  id: string;
  phone_number: string;
  name: string | null;
  studio: string;
  session_type: string | null;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
}

// POST /api/cron/send-reminders
//
// This endpoint processes pending SMS reminders for bookings.
// It should be called periodically by a cron job (every 5-15 minutes).
//
// Security: Requires CRON_SECRET header to prevent unauthorized access.
//
// Setup with Vercel Cron - add to vercel.json:
// { "crons": [{ "path": "/api/cron/send-reminders", "schedule": "0,15,30,45 * * * *" }] }

export async function POST(request: NextRequest) {
  // Verify cron secret for security
  const cronSecret = request.headers.get('x-cron-secret') || request.headers.get('authorization');
  const expectedSecret = process.env.CRON_SECRET;

  // Allow requests from Vercel Cron (they set a specific header)
  const isVercelCron = request.headers.get('x-vercel-cron') === '1';

  if (!isVercelCron && expectedSecret && cronSecret !== expectedSecret && cronSecret !== `Bearer ${expectedSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Check if SMS is configured
  const hasTwilioConfig =
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_SMS_NUMBER;

  if (!hasTwilioConfig) {
    return NextResponse.json(
      { error: 'SMS not configured', message: 'Twilio credentials are missing' },
      { status: 503 }
    );
  }

  try {
    const now = new Date();
    const results = {
      processed: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[],
    };

    // Fetch pending reminders that are due (scheduled_at <= now)
    const { data: pendingReminders, error: fetchError } = await supabaseServer
      .from('reminders')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', now.toISOString())
      .in('type', ['24h_reminder', '1h_reminder'])
      .order('scheduled_at', { ascending: true })
      .limit(50); // Process in batches to avoid timeout

    if (fetchError) {
      console.error('[Cron] Failed to fetch reminders:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch reminders', details: fetchError.message },
        { status: 500 }
      );
    }

    if (!pendingReminders || pendingReminders.length === 0) {
      return NextResponse.json({
        message: 'No pending reminders to process',
        ...results,
      });
    }

    // Process each reminder
    for (const reminder of pendingReminders as Reminder[]) {
      results.processed++;

      try {
        // Fetch the associated booking
        const { data: booking, error: bookingError } = await supabaseServer
          .from('bookings')
          .select('id, phone_number, name, studio, session_type, date, start_time, end_time, status')
          .eq('id', reminder.booking_id)
          .single();

        if (bookingError || !booking) {
          console.error(`[Cron] Booking not found for reminder ${reminder.id}:`, bookingError);
          await markReminderFailed(reminder.id, 'Booking not found');
          results.failed++;
          results.errors.push(`Reminder ${reminder.id}: Booking not found`);
          continue;
        }

        const typedBooking = booking as Booking;

        // Skip if booking is cancelled or completed
        if (typedBooking.status === 'cancelled' || typedBooking.status === 'completed' || typedBooking.status === 'no_show') {
          await markReminderCancelled(reminder.id);
          results.skipped++;
          continue;
        }

        // Check if the booking date/time has already passed
        const bookingDateTime = new Date(`${typedBooking.date}T${typedBooking.start_time}`);
        if (bookingDateTime < now) {
          await markReminderCancelled(reminder.id);
          results.skipped++;
          continue;
        }

        // Send the appropriate reminder
        let smsResult: { success: true; sid: string } | { success: false; error: string };

        if (reminder.type === '24h_reminder') {
          smsResult = await send24HourReminderSMS(typedBooking.phone_number, {
            studio: typedBooking.studio,
            date: typedBooking.date,
            startTime: typedBooking.start_time,
            endTime: typedBooking.end_time,
            sessionType: typedBooking.session_type || undefined,
          });
        } else if (reminder.type === '1h_reminder') {
          smsResult = await send1HourReminderSMS(typedBooking.phone_number, {
            studio: typedBooking.studio,
            startTime: typedBooking.start_time,
            endTime: typedBooking.end_time,
            sessionType: typedBooking.session_type || undefined,
          });
        } else {
          // Unknown reminder type, skip
          await markReminderCancelled(reminder.id);
          results.skipped++;
          continue;
        }

        if (smsResult.success) {
          await markReminderSent(reminder.id);
          results.sent++;
          console.log(`[Cron] Reminder ${reminder.id} sent successfully: ${smsResult.sid}`);
        } else {
          await markReminderFailed(reminder.id, smsResult.error);
          results.failed++;
          results.errors.push(`Reminder ${reminder.id}: ${smsResult.error}`);
          console.error(`[Cron] Reminder ${reminder.id} failed:`, smsResult.error);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        await markReminderFailed(reminder.id, errorMsg);
        results.failed++;
        results.errors.push(`Reminder ${reminder.id}: ${errorMsg}`);
        console.error(`[Cron] Error processing reminder ${reminder.id}:`, err);
      }
    }

    return NextResponse.json({
      message: 'Reminders processed',
      ...results,
    });
  } catch (error) {
    console.error('[Cron] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Also support GET for easier testing and Vercel Cron compatibility
export async function GET(request: NextRequest) {
  return POST(request);
}

async function markReminderSent(reminderId: string) {
  const { error } = await supabaseServer
    .from('reminders')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
    })
    .eq('id', reminderId);

  if (error) {
    console.error(`[Cron] Failed to mark reminder ${reminderId} as sent:`, error);
  }
}

async function markReminderFailed(reminderId: string, errorMessage: string) {
  const { error } = await supabaseServer
    .from('reminders')
    .update({
      status: 'failed',
      error_message: errorMessage,
    })
    .eq('id', reminderId);

  if (error) {
    console.error(`[Cron] Failed to mark reminder ${reminderId} as failed:`, error);
  }
}

async function markReminderCancelled(reminderId: string) {
  const { error } = await supabaseServer
    .from('reminders')
    .update({
      status: 'cancelled',
    })
    .eq('id', reminderId);

  if (error) {
    console.error(`[Cron] Failed to mark reminder ${reminderId} as cancelled:`, error);
  }
}
