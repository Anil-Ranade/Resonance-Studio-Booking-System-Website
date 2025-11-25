"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Phone,
  Search,
  Calendar,
  Clock,
  Building2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  CalendarX,
} from "lucide-react";

interface Booking {
  id: string;
  studio: string;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
}

const statusConfig: Record<string, { color: string; icon: typeof CheckCircle2; label: string }> = {
  pending: { color: 'amber', icon: Clock, label: 'Pending' },
  confirmed: { color: 'green', icon: CheckCircle2, label: 'Confirmed' },
  cancelled: { color: 'red', icon: XCircle, label: 'Cancelled' },
  completed: { color: 'violet', icon: CheckCircle2, label: 'Completed' },
  no_show: { color: 'zinc', icon: XCircle, label: 'No Show' },
};

export default function ViewBookingsPage() {
  const [whatsapp, setWhatsapp] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBookings([]);
    setSearched(false);

    // Normalize to digits only
    const normalized = whatsapp.replace(/\D/g, "");

    // Validate exactly 10 digits
    if (normalized.length !== 10) {
      setError("Please enter a valid 10-digit WhatsApp number");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/bookings?whatsapp=${normalized}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to fetch bookings");
        return;
      }

      setBookings(data.bookings || []);
      setSearched(true);
    } catch (err) {
      setError("An error occurred while fetching bookings");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link
            href="/home"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </Link>

          <h1 className="text-4xl font-bold text-white mb-2">View My Bookings</h1>
          <p className="text-zinc-400">
            Enter your WhatsApp number to view your bookings
          </p>
        </motion.div>

        {/* Search Card */}
        <motion.div
          className="glass-strong rounded-3xl p-8 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <Phone className="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Find Your Bookings</h2>
              <p className="text-zinc-400 text-sm">
                Enter the phone number used during booking
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="whatsapp" className="block text-sm font-medium text-zinc-400 mb-2">
                WhatsApp Number
              </label>
              <div className="relative flex items-center">
                <Phone className="absolute left-4 w-5 h-5 text-zinc-500 pointer-events-none" />
                <input
                  id="whatsapp"
                  type="tel"
                  placeholder="Enter 10-digit number"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  style={{ paddingLeft: '3rem' }}
                  className="w-full py-3.5 pr-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                  maxLength={12}
                />
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <span className="text-red-400">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={loading}
              className="w-full btn-accent py-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Search Bookings
                </>
              )}
            </motion.button>
          </form>
        </motion.div>

        {/* Results */}
        <AnimatePresence mode="wait">
          {searched && bookings.length === 0 && !error && (
            <motion.div
              className="glass rounded-2xl p-8 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <CalendarX className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Bookings Found</h3>
              <p className="text-zinc-400 mb-6">
                We couldn&apos;t find any bookings associated with this phone number.
              </p>
              <Link
                href="/booking"
                className="inline-flex items-center gap-2 btn-accent px-6 py-3"
              >
                Book Your First Session
              </Link>
            </motion.div>
          )}

          {bookings.length > 0 && (
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <p className="text-zinc-400 mb-4">
                Found {bookings.length} booking{bookings.length !== 1 ? 's' : ''}
              </p>

              {bookings.map((booking, index) => {
                const status = statusConfig[booking.status] || statusConfig.pending;
                const StatusIcon = status.icon;

                return (
                  <motion.div
                    key={booking.id}
                    className="glass rounded-2xl p-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    {/* Header with Status */}
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-violet-400" />
                        </div>
                        <div>
                          <h3 className="text-white font-semibold">{booking.studio}</h3>
                        </div>
                      </div>
                      <div
                        className={`px-3 py-1.5 rounded-full flex items-center gap-2 text-sm font-medium bg-${status.color}-500/10 border border-${status.color}-500/20 text-${status.color}-400`}
                      >
                        <StatusIcon className="w-4 h-4" />
                        {status.label}
                      </div>
                    </div>

                    {/* Booking Details */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-zinc-500" />
                        <div>
                          <p className="text-zinc-500 text-xs">Date</p>
                          <p className="text-white text-sm">{formatDate(booking.date)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-zinc-500" />
                        <div>
                          <p className="text-zinc-500 text-xs">Time</p>
                          <p className="text-white text-sm">
                            {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Booking ID */}
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <p className="text-zinc-600 text-xs font-mono">
                        ID: {booking.id}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
