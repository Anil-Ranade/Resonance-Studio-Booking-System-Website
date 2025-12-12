"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

// Helper function to safely parse JSON responses
async function safeJsonParse(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    console.error('Failed to parse response as JSON:', text.substring(0, 200));
    throw new Error('Server returned an invalid response. Please try again.');
  }
}
import {
  ArrowLeft,
  Mail,
  Search,
  Calendar,
  Clock,
  Building2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  CalendarX,
  Mic,
  Users,
} from "lucide-react";

interface Booking {
  id: string;
  studio: string;
  session_type: string;
  session_details?: string;
  group_size: number;
  date: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  rate_per_hour: number;
  total_amount: number;
  created_at: string;
}

const statusConfig: Record<string, { color: string; icon: typeof CheckCircle2; label: string }> = {
  pending: { color: 'amber', icon: Clock, label: 'Pending' },
  confirmed: { color: 'green', icon: CheckCircle2, label: 'Confirmed' },
  cancelled: { color: 'red', icon: XCircle, label: 'Cancelled' },
  completed: { color: 'violet', icon: CheckCircle2, label: 'Completed' },
  no_show: { color: 'zinc', icon: XCircle, label: 'No Show' },
};

export default function ViewBookingsPage() {
  const [email, setEmail] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  // Validate email format
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBookings([]);
    setSearched(false);

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      // Fetch only upcoming bookings
      const response = await fetch(`/api/bookings/upcoming?email=${encodeURIComponent(email.trim())}`);
      const data = await safeJsonParse(response);

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
    return timeString.slice(0, 5); // Returns "HH:MM" format (24-hour)
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-900 to-black py-6 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-4 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          
          <h1 className="text-2xl font-bold text-white">View Bookings</h1>
          <p className="text-zinc-400 text-sm mt-1">Check your upcoming bookings</p>
        </motion.div>

        {/* Email Search */}
        <motion.div 
          className="glass-strong rounded-2xl p-4 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full py-3 pl-12 pr-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                />
              </div>
              <motion.button
                type="submit"
                disabled={loading || !isValidEmail(email)}
                className="btn-accent py-3 px-6 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Search
                  </>
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div 
              className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20"
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

        {/* Bookings List */}
        {searched && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {bookings && bookings.length > 0 ? (
              <div className="space-y-4">
                {bookings.map((booking, index) => {
                  const config = statusConfig[booking.status] || statusConfig.pending;
                  const StatusIcon = config.icon;

                  return (
                    <motion.div
                      key={booking.id}
                      className="glass-strong rounded-2xl p-4 overflow-hidden"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      {/* Status Badge */}
                      <div className="flex items-center justify-between mb-3">
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full bg-${config.color}-500/20`}>
                          <StatusIcon className={`w-3.5 h-3.5 text-${config.color}-400`} />
                          <span className={`text-xs font-medium text-${config.color}-400`}>{config.label}</span>
                        </div>
                        <span className="text-xs text-zinc-500">ID: {booking.id.slice(0, 8)}</span>
                      </div>

                      {/* Booking Details */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Mic className="w-4 h-4 text-violet-400" />
                          <span className="text-white font-medium">{booking.session_type}</span>
                        </div>
                        {booking.session_details && (
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-violet-400" />
                            <span className="text-zinc-300 text-sm">{booking.session_details}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-violet-400" />
                          <span className="text-zinc-300 text-sm">{booking.studio}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-violet-400" />
                          <span className="text-zinc-300 text-sm">{formatDate(booking.date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-violet-400" />
                          <span className="text-zinc-300 text-sm">
                            {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                          </span>
                        </div>
                      </div>

                      {/* Total */}
                      <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                        <span className="text-zinc-400 text-sm">Total Amount</span>
                        <span className="text-white font-bold">₹{booking.total_amount?.toLocaleString('en-IN') || 0}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <motion.div 
                className="glass-strong rounded-2xl p-8 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <CalendarX className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-white mb-1">No Upcoming Bookings</h3>
                <p className="text-zinc-400 text-sm">No upcoming bookings found for this email address.</p>
                <Link 
                  href="/booking/new"
                  className="inline-block mt-4 btn-accent py-2 px-6 text-sm"
                >
                  Make a Booking
                </Link>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
