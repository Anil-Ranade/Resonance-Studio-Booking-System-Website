"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { checkAuthStatus } from "@/lib/authClient";
import SessionTicket from "../components/SessionTicket";

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
import { ArrowLeft, Search, Loader2, AlertCircle, Shield } from "lucide-react";

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

export default function ViewBookingsPage() {
  const [searchQuery, setSearchQuery] = useState("");
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
          setSearchQuery(status.user.email);
          
          // Auto-fetch bookings for authenticated user
          await fetchBookings(status.user.email);
          
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
  const isValidEmail = (str: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str.trim());
  };

  // Validate phone format (10 digits)
  const isValidPhone = (str: string) => {
    return /^\d{10}$/.test(str.trim().replace(/\D/g, ""));
  };

  const fetchBookings = async (query: string) => {
    const trimmedQuery = query.trim();
    const isEmail = isValidEmail(trimmedQuery);
    const isPhone = isValidPhone(trimmedQuery);

    if (!isEmail && !isPhone) {
      setError("Please enter a valid email address or 10-digit phone number");
      return;
    }

    setLoading(true);
    setError("");

    try {
      let url = `/api/bookings/upcoming?`;
      if (isEmail) {
        url += `email=${encodeURIComponent(trimmedQuery)}`;
      } else {
        url += `phone=${encodeURIComponent(trimmedQuery.replace(/\D/g, ""))}`;
      }

      const response = await fetch(url);
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
      } else if (isPhone) {
        // If we searched by phone, we can use that directly
        fetchLoyaltyStatus(trimmedQuery.replace(/\D/g, ""));
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
    await fetchBookings(searchQuery);
  };

  const LOYALTY_SEGMENTS = 25;

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-10"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </Link>

        <header className="mb-10">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-fuchsia-400 mb-4">
            View bookings
          </p>
          <h1 className="text-5xl sm:text-6xl font-bold text-white tracking-tight leading-[1.02]">
            Your upcoming <span className="text-violet-400">sessions.</span>
          </h1>
        </header>

        {/* Auth check */}
        {isCheckingAuth && (
          <div className="flex items-center gap-3 py-6 text-zinc-400" role="status">
            <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
            Checking if you&apos;re signed in…
          </div>
        )}

        {/* Signed in */}
        {!isCheckingAuth && isAuthenticated && authenticatedUser && (
          <p className="flex items-center gap-2 text-zinc-300 mb-10 border-t border-violet-400/60 pt-5">
            <Shield className="w-4 h-4 text-emerald-400" />
            Signed in as <span className="text-white font-medium">{authenticatedUser.name || authenticatedUser.email}</span>
            <span className="text-zinc-500">· showing your bookings</span>
          </p>
        )}

        {/* Search */}
        {!isCheckingAuth && !isAuthenticated && (
          <form onSubmit={handleSubmit} className="mb-10 border-t border-violet-400/60 pt-5">
            <label htmlFor="booking-lookup" className="block text-xs font-medium uppercase tracking-[0.14em] text-zinc-400 mb-3">
              Email or phone number used for booking
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  id="booking-lookup"
                  type="text"
                  inputMode="email"
                  autoComplete="email"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="you@example.com or 98XXXXXXXX"
                  className="w-full py-4 pl-12 pr-4 bg-white/[0.04] border border-white/15 rounded-xl text-lg text-white placeholder-zinc-500 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/30 transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={loading || (!isValidEmail(searchQuery) && !isValidPhone(searchQuery))}
                className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl bg-violet-400 hover:bg-violet-300 text-navy font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Finding bookings…
                  </>
                ) : (
                  "Find my bookings"
                )}
              </button>
            </div>
          </form>
        )}

        {/* Error */}
        {error && (
          <p role="alert" className="flex items-center gap-2 mb-8 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </p>
        )}

        {/* Loyalty */}
        {((isAuthenticated && loyaltyStatus) || (searched && loyaltyStatus)) && (() => {
          const reward = (loyaltyStatus.reward_amount || 2000).toLocaleString('en-IN');
          const lit = Math.min(LOYALTY_SEGMENTS, Math.round((loyaltyStatus.hours / loyaltyStatus.target) * LOYALTY_SEGMENTS));
          return (
            <section aria-labelledby="loyalty-title" className="mb-12 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <div className="flex items-baseline justify-between gap-4 mb-4">
                <h2 id="loyalty-title" className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-400">
                  Cashback progress
                </h2>
                <p className="text-white font-semibold tabular-nums">
                  {loyaltyStatus.hours} <span className="text-zinc-500 font-normal">/ {loyaltyStatus.target} hours</span>
                </p>
              </div>
              <div
                className="flex gap-1 mb-4"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={loyaltyStatus.target}
                aria-valuenow={loyaltyStatus.hours}
                aria-label="Hours completed toward cashback"
              >
                {Array.from({ length: LOYALTY_SEGMENTS }, (_, i) => (
                  <span
                    key={i}
                    className={`h-2.5 flex-1 rounded-[2px] ${
                      i >= lit ? "bg-white/[0.07]" : i >= LOYALTY_SEGMENTS - 3 ? "bg-fuchsia-400" : "bg-violet-400"
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-zinc-300">
                {loyaltyStatus.eligible ? (
                  <><span className="text-violet-400 font-semibold">₹{reward} unlocked.</span> You&apos;ve reached the target.</>
                ) : (
                  <>{loyaltyStatus.target - loyaltyStatus.hours} more hours to unlock <span className="text-white font-semibold">₹{reward}</span>.</>
                )}
              </p>
            </section>
          );
        })()}

        {/* Bookings */}
        {searched && (
          bookings && bookings.length > 0 ? (
            <section aria-label="Upcoming bookings">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-400 mb-4">
                {bookings.length} upcoming {bookings.length === 1 ? "session" : "sessions"}
              </p>
              <ul className="space-y-4 mb-24">
                {bookings.map((booking) => (
                  <li key={booking.id}>
                    <SessionTicket booking={booking} />
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            <section className="mb-24 rounded-3xl border border-white/10 bg-white/[0.03] p-8 sm:p-10">
              <h2 className="text-2xl font-bold text-white mb-2">No upcoming bookings</h2>
              <p className="text-zinc-400 mb-6">
                Nothing is booked under this email or phone number. Check it matches the one you booked with, or book a new session.
              </p>
              <Link
                href="/booking/new"
                className="inline-flex px-6 py-3.5 rounded-xl bg-violet-400 hover:bg-violet-300 text-navy font-semibold transition-colors"
              >
                Book a session
              </Link>
            </section>
          )
        )}
      </div>
    </div>
  );
}
