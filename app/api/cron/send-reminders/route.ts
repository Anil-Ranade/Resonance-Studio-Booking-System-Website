import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { sendBookingReminderEmail } from "@/lib/email";

/**
 * CRON endpoint to process and send pending booking reminders.
 * 
 * This endpoint should be called periodically (e.g., every 15 minutes)
 * by an external CRON service (Vercel Cron, GitHub Actions, etc.)
 * 
 * Security: Protected by CRON_SECRET environment variable.
 * 
 * Query params:
 * - type: 'all' (default) | '24h' | '1h' - filter reminder types to process
 * 
 * Example cron job URL: /api/cron/send-reminders?type=24h
 */

// Verify the CRON secret
function verifyCronSecret(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  
  // If no CRON_SECRET is set, allow requests (for development)
  if (!cronSecret) {
    console.warn("[Cron] CRON_SECRET not configured - endpoint is unprotected!");
    return true;
  }
  
  // Check Authorization header
  const authHeader = request.headers.get("Authorization");
  if (authHeader === `Bearer ${cronSecret}`) {
    return true;
  }
  
  // Also check x-cron-secret header (alternative for some CRON services)
  const secretHeader = request.headers.get("x-cron-secret");
  if (secretHeader === cronSecret) {
    return true;
  }
  
  return false;
}

interface ReminderWithBooking {
  id: string;
  booking_id: string;
  type: string;
  status: string;
  scheduled_at: string;
  bookings: {
    id: string;
    phone_number: string;
    name: string | null;
    email: string | null;
    studio: string;
    session_type: string;
    session_details: string | null;
    date: string;
    start_time: string;
    end_time: string;
    total_amount: number | null;
    status: string;
  };
}

export async function GET(request: NextRequest) {
  // Verify CRON secret
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const reminderType = searchParams.get("type") || "all";

  try {
    console.log(`[Cron] Starting reminder processing - type: ${reminderType}`);
    
    // Get current time in ISO format
    const now = new Date().toISOString();
    
    // Build query for pending reminders that are due
    let query = supabaseServer
      .from("reminders")
      .select(`
        id,
        booking_id,
        type,
        status,
        scheduled_at,
        bookings (
          id,
          phone_number,
          name,
          email,
          studio,
          session_type,
          session_details,
          date,
          start_time,
          end_time,
          total_amount,
          status
        )
      `)
      .eq("status", "pending")
      .lte("scheduled_at", now);

    // Filter by reminder type if specified
    if (reminderType === "24h") {
      query = query.eq("type", "24h_reminder");
    } else if (reminderType === "1h") {
      query = query.eq("type", "1h_reminder");
    } else {
      // Process only 24h reminders by default (1h reminders could be added later)
      query = query.eq("type", "24h_reminder");
    }

    // Limit to prevent overwhelming the system
    query = query.limit(50);

    const { data: reminders, error: fetchError } = await query;

    if (fetchError) {
      console.error("[Cron] Error fetching reminders:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch reminders", details: fetchError.message },
        { status: 500 }
      );
    }

    if (!reminders || reminders.length === 0) {
      console.log("[Cron] No pending reminders to process");
      return NextResponse.json({
        success: true,
        message: "No pending reminders",
        processed: 0,
        sent: 0,
        failed: 0,
      });
    }

    console.log(`[Cron] Found ${reminders.length} pending reminders to process`);

    // Process each reminder
    let sentCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    const results: { id: string; status: string; error?: string }[] = [];

    for (const reminder of reminders as unknown as ReminderWithBooking[]) {
      const booking = reminder.bookings;

      // Skip if booking doesn't exist or is not confirmed
      if (!booking) {
        console.log(`[Cron] Skipping reminder ${reminder.id} - booking not found`);
        await supabaseServer
          .from("reminders")
          .update({ status: "cancelled", error_message: "Booking not found" })
          .eq("id", reminder.id);
        skippedCount++;
        results.push({ id: reminder.id, status: "skipped", error: "Booking not found" });
        continue;
      }

      if (booking.status !== "confirmed") {
        console.log(`[Cron] Skipping reminder ${reminder.id} - booking status is ${booking.status}`);
        await supabaseServer
          .from("reminders")
          .update({ status: "cancelled", error_message: `Booking status: ${booking.status}` })
          .eq("id", reminder.id);
        skippedCount++;
        results.push({ id: reminder.id, status: "skipped", error: `Booking status: ${booking.status}` });
        continue;
      }

      // Get email from booking or user table
      let email = booking.email;
      if (!email) {
        const { data: userData } = await supabaseServer
          .from("users")
          .select("email")
          .eq("phone_number", booking.phone_number)
          .single();
        email = userData?.email || null;
      }

      if (!email) {
        console.log(`[Cron] Skipping reminder ${reminder.id} - no email available`);
        await supabaseServer
          .from("reminders")
          .update({ status: "failed", error_message: "No email address available" })
          .eq("id", reminder.id);
        failedCount++;
        results.push({ id: reminder.id, status: "failed", error: "No email address" });
        continue;
      }

      // Send the reminder email
      try {
        const emailResult = await sendBookingReminderEmail(email, {
          id: booking.id,
          name: booking.name || undefined,
          studio: booking.studio,
          session_type: booking.session_type,
          session_details: booking.session_details || undefined,
          date: booking.date,
          start_time: booking.start_time,
          end_time: booking.end_time,
          total_amount: booking.total_amount || undefined,
        });

        if (emailResult.success) {
          console.log(`[Cron] Reminder ${reminder.id} sent successfully to ${email}`);
          await supabaseServer
            .from("reminders")
            .update({ status: "sent", sent_at: new Date().toISOString() })
            .eq("id", reminder.id);
          sentCount++;
          results.push({ id: reminder.id, status: "sent" });
        } else {
          console.error(`[Cron] Reminder ${reminder.id} failed:`, emailResult.error);
          await supabaseServer
            .from("reminders")
            .update({ status: "failed", error_message: emailResult.error })
            .eq("id", reminder.id);
          failedCount++;
          results.push({ id: reminder.id, status: "failed", error: emailResult.error });
        }
      } catch (emailError) {
        const errorMessage = emailError instanceof Error ? emailError.message : "Unknown error";
        console.error(`[Cron] Error sending reminder ${reminder.id}:`, errorMessage);
        await supabaseServer
          .from("reminders")
          .update({ status: "failed", error_message: errorMessage })
          .eq("id", reminder.id);
        failedCount++;
        results.push({ id: reminder.id, status: "failed", error: errorMessage });
      }
    }

    console.log(`[Cron] Processing complete - Sent: ${sentCount}, Failed: ${failedCount}, Skipped: ${skippedCount}`);

    return NextResponse.json({
      success: true,
      message: "Reminder processing complete",
      processed: reminders.length,
      sent: sentCount,
      failed: failedCount,
      skipped: skippedCount,
      results,
    });
  } catch (error) {
    console.error("[Cron] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Also support POST for CRON services that prefer it
export async function POST(request: NextRequest) {
  return GET(request);
}
