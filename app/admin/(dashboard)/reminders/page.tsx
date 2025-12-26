"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  MessageCircle,
  Search,
  Loader2,
  Clock,
  Phone,
  User,
  Calendar,
  CheckCircle,
  RefreshCw,
  Send,
  BadgeCheck,
} from "lucide-react";
import { getSession } from "@/lib/supabaseAuth";

interface Booking {
  id: string;
  phone_number: string;
  name: string | null;
  email: string | null;
  studio: string;
  session_type: string | null;
  session_details: string | null;
  group_size: number;
  date: string;
  start_time: string;
  end_time: string;
  status: "pending" | "confirmed" | "cancelled" | "completed" | "no_show";
  total_amount: number | null;
  notes: string | null;
  created_at: string;
  whatsapp_reminder_sent_at: string | null;
}

// Helper function to check if a booking's time has passed
const isBookingTimePassed = (date: string, endTime: string): boolean => {
  const now = new Date();
  const bookingDate = new Date(date);
  const [hours, minutes] = endTime.split(":").map(Number);
  bookingDate.setHours(hours, minutes, 0, 0);
  return now > bookingDate;
};

// Helper function to check if booking is within 24 hours before start time
const isWithin24HoursBeforeBooking = (
  date: string,
  startTime: string,
  endTime: string
): boolean => {
  const now = new Date();
  if (isBookingTimePassed(date, endTime)) {
    return false;
  }
  const bookingStartDate = new Date(date);
  const [startHours, startMinutes] = startTime.split(":").map(Number);
  bookingStartDate.setHours(startHours, startMinutes, 0, 0);
  const twentyFourHoursBefore = new Date(
    bookingStartDate.getTime() - 24 * 60 * 60 * 1000
  );
  return now >= twentyFourHoursBefore && now <= bookingStartDate;
};

// Get hours until booking
const getHoursUntilBooking = (date: string, startTime: string): number => {
  const now = new Date();
  const bookingStartDate = new Date(date);
  const [startHours, startMinutes] = startTime.split(":").map(Number);
  bookingStartDate.setHours(startHours, startMinutes, 0, 0);
  const diff = bookingStartDate.getTime() - now.getTime();
  return Math.round(diff / (1000 * 60 * 60));
};

export default function WhatsAppRemindersPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "sent">("all");

  // Helper to get the current access token
  const getAccessToken = useCallback(async (): Promise<string | null> => {
    try {
      const session = await getSession();
      if (session?.access_token) {
        localStorage.setItem("accessToken", session.access_token);
        return session.access_token;
      }
      return localStorage.getItem("accessToken");
    } catch {
      return localStorage.getItem("accessToken");
    }
  }, []);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getAccessToken();
      const response = await fetch("/api/admin/bookings", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        // Filter only confirmed bookings within 24 hours
        const eligibleBookings = (data.bookings || []).filter(
          (booking: Booking) =>
            booking.status === "confirmed" &&
            isWithin24HoursBeforeBooking(
              booking.date,
              booking.start_time,
              booking.end_time
            )
        );
        setBookings(eligibleBookings);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHour}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const sendConfirmation = (booking: Booking) => {
    const phone = booking.phone_number.replace(/[^0-9]/g, "");
    const formattedDate = formatDate(booking.date);
    const formattedStartTime = formatTime(booking.start_time);
    const formattedEndTime = formatTime(booking.end_time);

    const message = `*Booking Confirmed - Resonance Studio, Sinhgad Road Branch*

Hi ${booking.name || "there"},

Your booking at our studio has been confirmed.

Date: ${formattedDate}
Time: ${formattedStartTime} – ${formattedEndTime}
*${booking.session_type || "Session"}${
      booking.session_details ? ` with ${booking.session_details}` : ""
    }*
*${booking.studio}*

Enjoy your session!
See you soon!`;

    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(
      message
    )}`;
    window.open(whatsappUrl, "_blank");
  };

  const sendReminder = async (booking: Booking) => {
    const phone = booking.phone_number.replace(/[^0-9]/g, "");
    const formattedDate = formatDate(booking.date);
    const formattedStartTime = formatTime(booking.start_time);
    const formattedEndTime = formatTime(booking.end_time);

    const message = `*Reminder from Resonance Studio, Sinhgad Road Branch*

Hi ${booking.name || "there"},

This is a reminder for your upcoming booking at our studio.

Date: ${formattedDate}
Time: ${formattedStartTime} – ${formattedEndTime}
*${booking.session_type || "Session"}${
      booking.session_details ? ` with ${booking.session_details}` : ""
    }*
*${booking.studio}*

Enjoy your session!
See you soon!`;

    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(
      message
    )}`;
    window.open(whatsappUrl, "_blank");

    // Mark reminder as sent in database
    try {
      const token = await getAccessToken();
      const response = await fetch("/api/admin/whatsapp-reminder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ booking_id: booking.id }),
      });

      if (response.ok) {
        const data = await response.json();
        setBookings((prev) =>
          prev.map((b) =>
            b.id === booking.id
              ? {
                  ...b,
                  whatsapp_reminder_sent_at: data.whatsapp_reminder_sent_at,
                }
              : b
          )
        );
      }
    } catch (error) {
      console.error("Failed to mark reminder as sent:", error);
    }
  };

  const handleSendReminder = async (booking: Booking) => {
    if (booking.whatsapp_reminder_sent_at) {
      if (
        confirm(
          "You have already sent a reminder for this booking. Do you want to send it again?"
        )
      ) {
        await sendReminder(booking);
      }
    } else {
      await sendReminder(booking);
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      booking.name?.toLowerCase().includes(searchLower) ||
      booking.phone_number.includes(searchTerm);

    if (filter === "pending") {
      return matchesSearch && !booking.whatsapp_reminder_sent_at;
    } else if (filter === "sent") {
      return matchesSearch && booking.whatsapp_reminder_sent_at;
    }
    return matchesSearch;
  });

  const pendingCount = bookings.filter(
    (b) => !b.whatsapp_reminder_sent_at
  ).length;
  const sentCount = bookings.filter((b) => b.whatsapp_reminder_sent_at).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <MessageCircle className="w-7 h-7 text-emerald-400" />
            WhatsApp Reminders
          </h1>
          <p className="text-zinc-400 mt-1">
            Send booking reminders to customers (within 24 hours of their
            session)
          </p>
        </div>

        <button
          onClick={fetchBookings}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{bookings.length}</p>
              <p className="text-zinc-400 text-sm">Total Eligible</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{pendingCount}</p>
              <p className="text-zinc-400 text-sm">Pending Reminders</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{sentCount}</p>
              <p className="text-zinc-400 text-sm">Reminders Sent</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "all"
                ? "bg-violet-500/20 text-violet-400"
                : "bg-white/5 text-zinc-400 hover:bg-white/10"
            }`}
          >
            All ({bookings.length})
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "pending"
                ? "bg-amber-500/20 text-amber-400"
                : "bg-white/5 text-zinc-400 hover:bg-white/10"
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setFilter("sent")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "sent"
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-white/5 text-zinc-400 hover:bg-white/10"
            }`}
          >
            Sent ({sentCount})
          </button>
        </div>
      </div>

      {/* Reminders List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-20">
          <MessageCircle className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            No Reminders to Send
          </h3>
          <p className="text-zinc-400">
            {bookings.length === 0
              ? "There are no confirmed bookings within the 24-hour reminder window."
              : "No bookings match your current filter."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredBookings.map((booking) => {
            const hoursUntil = getHoursUntilBooking(
              booking.date,
              booking.start_time
            );
            const isUrgent = hoursUntil <= 4;

            return (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white/5 backdrop-blur-xl rounded-xl border overflow-hidden ${
                  isUrgent && !booking.whatsapp_reminder_sent_at
                    ? "border-amber-500/30"
                    : "border-white/10"
                }`}
              >
                <div className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    {/* Booking Info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold">
                          {booking.name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <h3 className="text-white font-medium">
                            {booking.name || "Unknown"}
                          </h3>
                          <p className="text-zinc-400 text-sm flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {booking.phone_number}
                          </p>
                        </div>
                        {isUrgent && !booking.whatsapp_reminder_sent_at && (
                          <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs font-medium rounded-lg">
                            Urgent
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2 text-zinc-300">
                          <Calendar className="w-4 h-4 text-zinc-500" />
                          {formatDate(booking.date)}
                        </div>
                        <div className="flex items-center gap-2 text-zinc-300">
                          <Clock className="w-4 h-4 text-zinc-500" />
                          {formatTime(booking.start_time)} -{" "}
                          {formatTime(booking.end_time)}
                        </div>
                        <div className="flex items-center gap-2 text-zinc-300">
                          <User className="w-4 h-4 text-zinc-500" />
                          {booking.studio} • {booking.session_type}
                        </div>
                      </div>

                      {/* Time until booking */}
                      <p className="text-zinc-500 text-sm">
                        Session starts in{" "}
                        <span
                          className={
                            isUrgent ? "text-amber-400" : "text-violet-400"
                          }
                        >
                          {hoursUntil <= 0
                            ? "less than an hour"
                            : `${hoursUntil} hour${
                                hoursUntil !== 1 ? "s" : ""
                              }`}
                        </span>
                      </p>
                    </div>

                    {/* Action */}
                    <div className="flex flex-col items-end justify-center gap-2">
                      {/* Confirmation Button */}
                      <button
                        onClick={() => sendConfirmation(booking)}
                        className="flex items-center gap-2 px-4 py-2 bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 rounded-lg transition-colors text-sm font-medium"
                      >
                        <BadgeCheck className="w-4 h-4" />
                        Send Confirmation
                      </button>

                      {/* Reminder Button */}
                      {booking.whatsapp_reminder_sent_at ? (
                        <>
                          <span className="flex items-center gap-2 text-emerald-400 text-xs">
                            <CheckCircle className="w-3 h-3" />
                            Reminder Sent
                          </span>
                          <button
                            onClick={() => handleSendReminder(booking)}
                            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm"
                          >
                            <Send className="w-4 h-4" />
                            Send Again
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleSendReminder(booking)}
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors font-medium text-sm"
                        >
                          <MessageCircle className="w-4 h-4" />
                          Send Reminder
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
