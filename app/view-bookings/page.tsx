"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { checkAuthStatus } from "@/lib/authClient";

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
  Shield,
  Award,
  TrendingUp,
} from "lucide-react";

interface LoyaltyStatus {
  hours: number;
  target: number;
  eligible: boolean;
  window_start: string | null;
  window_end: string | null;
  reward_amount?: number;
  first_booking_bonus?: boolean;
}

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
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authenticatedUser, setAuthenticatedUser] = useState<{ name: string; email: string } | null>(null);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [loyaltyStatus, setLoyaltyStatus] = useState<LoyaltyStatus | null>(null);

  const fetchLoyaltyStatus = async (phone: string) => {
    try {
      const response = await fetch(`/api/loyalty/status?phone=${phone}`);
      const data = await safeJsonParse(response);
      if (response.ok) {
        setLoyaltyStatus(data);
      }
    } catch (err) {
      console.error('Failed to fetch loyalty status:', err);
    }
  };

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const status = await checkAuthStatus();
        if (status.authenticated && status.user && status.user.email) {
          setIsAuthenticated(true);
          setAuthenticatedUser({ name: status.user.name, email: status.user.email });
          setEmail(status.user.email);
          
          // Auto-fetch bookings for authenticated user
          await fetchBookingsForEmail(status.user.email);
          
          if (status.user.phone) {
            fetchLoyaltyStatus(status.user.phone);
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    
    checkAuth();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Validate email format
  const isValidEmail = (emailStr: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr.trim());
  };

  const fetchBookingsForEmail = async (emailToFetch: string) => {
    if (!isValidEmail(emailToFetch)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/bookings/upcoming?email=${encodeURIComponent(emailToFetch.trim())}`);
      const data = await safeJsonParse(response);

      if (!response.ok) {
        setError(data.error || "Failed to fetch bookings");
        return;
      }

      setBookings(data.bookings || []);
      setSearched(true);

      // If phone number is returned from search, fetch loyalty status
      if (data.phone) {
        fetchLoyaltyStatus(data.phone);
      }
    } catch {
      setError("An error occurred while fetching bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookings([]);
    setSearched(false);
    await fetchBookingsForEmail(email);
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
    const [hours, minutes] = timeString.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
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

        {/* Loading Auth State */}
        {isCheckingAuth && (
          <motion.div 
            className="glass-strong rounded-2xl p-6 mb-6 flex items-center justify-center gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
            <span className="text-zinc-300">Checking authentication...</span>
          </motion.div>
        )}

        {/* Authenticated User Banner */}
        {!isCheckingAuth && isAuthenticated && authenticatedUser && (
          <motion.div 
            className="glass-strong rounded-2xl p-4 mb-6 border border-green-500/20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-white font-medium">Welcome back{authenticatedUser.name ? `, ${authenticatedUser.name}` : ''}!</p>
                <p className="text-zinc-400 text-sm">Your bookings are loaded automatically</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Email Search - Only show if not authenticated */}
        {!isCheckingAuth && !isAuthenticated && (
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
        )}

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

        {((isAuthenticated && loyaltyStatus) || (searched && loyaltyStatus)) && (
          <motion.div 
            className="glass-strong rounded-2xl p-6 mb-6 relative overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-bold text-white">Loyalty Status</h3>
                </div>
                {loyaltyStatus.eligible && (
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/20 animate-pulse">
                    Reward Available!
                  </span>
                )}
              </div>
              
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-zinc-400">Progress</span>
                <span className="text-white font-medium">
                  {loyaltyStatus.hours} / {loyaltyStatus.target} hours
                </span>
              </div>

              <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-4">
                <motion.div 
                  className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((loyaltyStatus.hours / loyaltyStatus.target) * 100, 100)}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>

              <div className="flex items-start gap-2 text-xs text-zinc-400">
                <TrendingUp className="w-3.5 h-3.5 mt-0.5 text-zinc-500" />
                <p>
                  {loyaltyStatus.eligible 
                    ? `Congratulations! You've unlocked a ₹${(loyaltyStatus.reward_amount || 2000).toLocaleString('en-IN')} discount on your next booking.`
                    : `Complete ${loyaltyStatus.target - loyaltyStatus.hours} more hours to unlock a ₹${(loyaltyStatus.reward_amount || 2000).toLocaleString('en-IN')} reward.`
                  }
                </p>
              </div>
            </div>
          </motion.div>
        )}

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
