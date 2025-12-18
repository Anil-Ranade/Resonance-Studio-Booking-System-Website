"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { getSession } from "@/lib/supabaseAuth";
import {
  ArrowLeft,
  Phone,
  Search,
  Calendar,
  Clock,
  Building2,
  Mic,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Check,
} from "lucide-react";

interface Booking {
  id: string;
  studio: string;
  session_type: string;
  session_details: string;
  group_size: number;
  date: string;
  start_time: string;
  end_time: string;
  status: "confirmed" | "cancelled" | "completed" | "no_show";
  rate_per_hour: number;
  total_amount: number;
  created_at: string;
  name?: string;
  email?: string;
  phone_number?: string;
}

const statusConfig = {
  confirmed: { color: "green", icon: CheckCircle2, label: "Confirmed" },
  cancelled: { color: "red", icon: XCircle, label: "Cancelled" },
  completed: { color: "violet", icon: CheckCircle2, label: "Completed" },
  no_show: { color: "zinc", icon: XCircle, label: "No Show" },
};

export default function StaffCancelBookingPage() {
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [searched, setSearched] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  // Helper to get the current access token
  const getAccessToken = useCallback(async (): Promise<string | null> => {
    try {
      const session = await getSession();
      if (session?.access_token) {
        localStorage.setItem("staffAccessToken", session.access_token);
        return session.access_token;
      }
      return localStorage.getItem("staffAccessToken");
    } catch {
      return localStorage.getItem("staffAccessToken");
    }
  }, []);

  const fetchBookings = async () => {
    if (phone.replace(/\D/g, "").length !== 10) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }

    setIsLoading(true);
    setError("");
    setSearched(true);

    try {
      const token = await getAccessToken();
      const response = await fetch(
        `/api/staff/bookings?phone=${encodeURIComponent(phone.trim())}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch bookings");
      }

      // Filter only confirmed bookings that can be cancelled
      const cancellableBookings = (data.bookings || []).filter(
        (b: Booking) => b.status === "confirmed"
      );

      setBookings(cancellableBookings);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch bookings");
      setBookings(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBookings();
  };

  const handleSelectBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setCancelled(false);
    setError("");
  };

  const confirmCancellation = async () => {
    if (!selectedBooking) return;

    setIsCancelling(true);
    setError("");

    try {
      const token = await getAccessToken();
      const response = await fetch("/api/staff/bookings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: selectedBooking.id,
          status: "cancelled",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to cancel booking");
      }

      setCancelled(true);
      // Update local state
      setBookings(
        (prev) => prev?.filter((b) => b.id !== selectedBooking.id) || null
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel booking");
    } finally {
      setIsCancelling(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHour}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  const resetFlow = () => {
    setSelectedBooking(null);
    setCancelled(false);
    setError("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
            <XCircle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Cancel Booking</h1>
            <p className="text-zinc-400 text-sm">
              Cancel a booking you created
            </p>
          </div>
        </div>
        <Link
          href="/staff/booking"
          className="text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Menu
        </Link>
      </div>

      {/* Cancel Confirmation Modal */}
      <AnimatePresence>
        {selectedBooking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => !isCancelling && resetFlow()}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg glass rounded-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              {cancelled ? (
                // Success State
                <div className="text-center py-4">
                  <motion.div
                    className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                  >
                    <Check className="w-8 h-8 text-green-400" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Booking Cancelled
                  </h3>
                  <p className="text-zinc-400 text-sm mb-6">
                    The booking has been successfully cancelled.
                  </p>

                  <div className="flex gap-3 justify-center">
                    <motion.button
                      onClick={resetFlow}
                      className="btn-primary py-3 px-6"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Cancel Another Booking
                    </motion.button>
                  </div>
                </div>
              ) : (
                // Confirmation State
                <>
                  <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/10">
                    <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                      <XCircle className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        Confirm Cancellation
                      </h3>
                      <p className="text-zinc-400 text-sm">
                        This action cannot be undone
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white/5 mb-6">
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Customer</span>
                        <span className="text-white font-medium">
                          {selectedBooking.name || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Phone</span>
                        <span className="text-white">
                          {selectedBooking.phone_number}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Session</span>
                        <span className="text-white font-medium">
                          {selectedBooking.session_type}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Studio</span>
                        <span className="text-white">
                          {selectedBooking.studio}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Date</span>
                        <span className="text-white">
                          {formatDate(selectedBooking.date)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Time</span>
                        <span className="text-white">
                          {formatTime(selectedBooking.start_time)} -{" "}
                          {formatTime(selectedBooking.end_time)}
                        </span>
                      </div>
                      <div className="flex justify-between pt-3 border-t border-white/10">
                        <span className="text-zinc-400">Total Amount</span>
                        <span className="text-white font-bold">
                          ₹
                          {selectedBooking.total_amount?.toLocaleString(
                            "en-IN"
                          ) || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-400" />
                        <p className="text-red-400 text-sm">{error}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <motion.button
                      onClick={resetFlow}
                      disabled={isCancelling}
                      className="flex-1 py-3 rounded-xl border border-zinc-600 text-zinc-400 hover:bg-white/5 transition-colors disabled:opacity-50"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Go Back
                    </motion.button>
                    <motion.button
                      onClick={confirmCancellation}
                      disabled={isCancelling}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {isCancelling ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Cancelling...
                        </>
                      ) : (
                        "Confirm Cancellation"
                      )}
                    </motion.button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phone Search */}
      <motion.div
        className="glass rounded-2xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="text-zinc-400 text-sm mb-4">
          Enter customer&apos;s phone number to find bookings you&apos;ve
          created
        </p>
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="relative flex-1">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="tel"
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
              }
              placeholder="Enter 10-digit phone number"
              className="w-full py-3 pl-12 pr-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
              maxLength={10}
            />
          </div>
          <motion.button
            type="submit"
            disabled={isLoading || phone.length !== 10}
            className="btn-primary px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            Search
          </motion.button>
        </form>
      </motion.div>

      {/* Error */}
      <AnimatePresence>
        {error && !selectedBooking && (
          <motion.div
            className="p-4 rounded-xl bg-red-500/10 border border-red-500/20"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      {searched && bookings && bookings.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h3 className="text-lg font-medium text-white mb-4">
            Select a booking to cancel
          </h3>
          <div className="space-y-4">
            {bookings.map((booking, index) => {
              const config =
                statusConfig[booking.status] || statusConfig.confirmed;
              const StatusIcon = config.icon;

              return (
                <motion.div
                  key={booking.id}
                  className="glass rounded-2xl p-4 cursor-pointer hover:border-red-500/30 transition-all"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleSelectBooking(booking)}
                >
                  {/* Status Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`flex items-center gap-2 px-3 py-1 rounded-full bg-${config.color}-500/20`}
                    >
                      <StatusIcon
                        className={`w-3.5 h-3.5 text-${config.color}-400`}
                      />
                      <span
                        className={`text-xs font-medium text-${config.color}-400`}
                      >
                        {config.label}
                      </span>
                    </div>
                    <span className="text-xs text-zinc-500">
                      ID: {booking.id.slice(0, 8)}
                    </span>
                  </div>

                  {/* Customer Info */}
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/10">
                    <span className="text-white font-medium">
                      {booking.name || "N/A"}
                    </span>
                    <span className="text-zinc-500">•</span>
                    <span className="text-zinc-400 text-sm">
                      {booking.phone_number}
                    </span>
                  </div>

                  {/* Booking Details */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Mic className="w-4 h-4 text-violet-400" />
                      <span className="text-white">{booking.session_type}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-violet-400" />
                      <span className="text-zinc-300">{booking.studio}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-violet-400" />
                      <span className="text-zinc-300">
                        {formatDate(booking.date)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-violet-400" />
                      <span className="text-zinc-300">
                        {formatTime(booking.start_time)} -{" "}
                        {formatTime(booking.end_time)}
                      </span>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                    <span className="text-zinc-400 text-sm">Total Amount</span>
                    <span className="text-white font-bold">
                      ₹{booking.total_amount?.toLocaleString("en-IN") || 0}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* No Bookings Found */}
      {searched && bookings && bookings.length === 0 && (
        <motion.div
          className="glass rounded-2xl p-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Calendar className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-white mb-1">
            No Cancellable Bookings Found
          </h3>
          <p className="text-zinc-400 text-sm">
            No confirmed bookings that you created found for this phone number.
          </p>
        </motion.div>
      )}
    </div>
  );
}
