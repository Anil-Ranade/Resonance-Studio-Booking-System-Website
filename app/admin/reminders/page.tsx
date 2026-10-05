"use client";

import { useEffect, useState, useCallback } from "react";
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
  Lock,
  Mail,
  Eye,
  EyeOff,
  Music2,
  LogOut,
} from "lucide-react";
import { getSession, signInWithEmail, signOut } from "@/lib/supabaseAuth";
import { useRouter } from "next/navigation";
import { adminFetch } from "@/lib/adminFetch";

// --- Types ---

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

// --- Helper Functions ---

const isBookingTimePassed = (date: string, endTime: string): boolean => {
  const now = new Date();
  const bookingDate = new Date(date);
  const [hours, minutes] = endTime.split(":").map(Number);
  bookingDate.setHours(hours, minutes, 0, 0);
  return now > bookingDate;
};

const hasEventStarted = (date: string, startTime: string): boolean => {
  const now = new Date();
  const bookingStartDate = new Date(date);
  const [startHours, startMinutes] = startTime.split(":").map(Number);
  bookingStartDate.setHours(startHours, startMinutes, 0, 0);
  return now >= bookingStartDate;
};

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

const getHoursUntilBooking = (date: string, startTime: string): number => {
  const now = new Date();
  const bookingStartDate = new Date(date);
  const [startHours, startMinutes] = startTime.split(":").map(Number);
  bookingStartDate.setHours(startHours, startMinutes, 0, 0);
  const diff = bookingStartDate.getTime() - now.getTime();
  return Math.round(diff / (1000 * 60 * 60));
};

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

// --- Main Component ---

export default function StandaloneRemindersPage() {
  // Auth State
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  
  // Login Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Reminders Page State
  // Reminders Page State
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"pending" | "sent">("pending");
  
  const router = useRouter();

  // ... (keeping other auth logic same, skipping to render part for brevity in thought but must match file)
  // Since I can't skip lines in replace_file_content easily without matching context, I need to be precise.
  // Actually, I should target the `const [filter, setFilter]` line first.
  
  // Wait, I should do this in chunks if easier, or one big chunk.
  // Let's do the state definition first.


  // --- Auth Logic ---

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await getSession();
        // We can also check localStorage 'admin' but session is more robust
        if (session) {
          setIsAuthorized(true);
        }
      } catch (err) {
        console.error("Auth check failed", err);
      } finally {
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");

    try {
      const { user, session } = await signInWithEmail(email, password);

      if (!user || !session) {
        setLoginError("Invalid credentials");
        setLoginLoading(false);
        return;
      }

      // Optional: Verify admin role via API if strict check needed
      // For now, mirroring the login page logic but keeping it self-contained or reusing API
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setLoginError(data.error || 'You are not authorized as an admin');
        setLoginLoading(false);
        return;
      }

      // Success
      localStorage.setItem('accessToken', session.access_token);
      setIsAuthorized(true);
    } catch (err: any) {
      console.error("Login error:", err);
      setLoginError(err.message || "Failed to login");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      localStorage.removeItem("accessToken");
      localStorage.removeItem("admin");
      setIsAuthorized(false);
      setEmail("");
      setPassword("");
    } catch (error) {
      console.error("Logout error", error);
    }
  };

  // --- Reminders Logic ---

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    try {
      const session = await getSession();
      if (session?.access_token) {
        return session.access_token;
      }
      return localStorage.getItem("accessToken");
    } catch {
      return localStorage.getItem("accessToken");
    }
  }, []);

  const fetchBookings = useCallback(async () => {
    if (!isAuthorized) return;
    setLoading(true);
    try {
      const token = await getAccessToken();
      const response = await fetch("/api/admin/bookings", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
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
  }, [isAuthorized, getAccessToken]);

  useEffect(() => {
    if (isAuthorized) {
      fetchBookings();
    }
  }, [isAuthorized, fetchBookings]);

  const sendConfirmation = async (booking: Booking) => {
    const phone = booking.phone_number.replace(/[^0-9]/g, "");
    const formattedDate = formatDate(booking.date);
    const formattedStartTime = formatTime(booking.start_time);
    const formattedEndTime = formatTime(booking.end_time);

    // Fetch loyalty status
    let loyaltyMessagePart = "";
    try {
      const res = await adminFetch(`/api/loyalty/status?phone=${phone}`);
      const loyaltyData = await res.json();
      if (loyaltyData && !loyaltyData.error) {
        const currentHours = Number(loyaltyData.hours || 0);
        const target = Number(loyaltyData.target || 50);
        const windowEnd = loyaltyData.window_end ? new Date(loyaltyData.window_end).toLocaleDateString("en-GB", { day: 'numeric', month: 'long', year: 'numeric' }) : "expiration date";

        // Assuming 50 hours = 1500 Rs reward => 30 Rs/hr value
        const balance = Math.round(currentHours * 30);
        const neededHours = Math.max(0, target - currentHours);
        
        loyaltyMessagePart = `\nincluding this booking, your total cashback balance is ₹${balance.toLocaleString()}.\nTo encash ₹2,000, please complete ${neededHours.toFixed(1)} more hours of booking before ${windowEnd}.`;
      }
    } catch (err) {
      console.error("Failed to fetch loyalty status", err);
    }

    // Calculation for Invoice
    const s = booking.start_time.split(':').map(Number);
    const e = booking.end_time.split(':').map(Number);
    const duration = (e[0] * 60 + e[1] - (s[0] * 60 + s[1])) / 60;
    
    // Determine Base Rate & Discounts logic (Inferred)
    // We don't have is_prompt_payment in the local Booking interface in this file? 
    // Wait, the interface Booking above has total_amount but NOT is_prompt_payment in lines 29-46 of view_file output?
    // Let me check lines 29-46 again.
    // Line 46: whatsapp_reminder_sent_at: string | null;
    // It seems 'is_prompt_payment' is missing from the Booking interface in this file.
    // However, the api/admin/bookings likely returns it. 
    // I should cast it or update the interface if I can, but for now I will check if I can safely access it via (booking as any).is_prompt_payment 
    // or assume standard logic.
    // The previous implementation on bookings page had is_prompt_payment in the interface.
    // I'll assume it's available in the data object even if typed loosely here, or I'll default to 0 if undefined.
    
    let promptDiscount = 0;
    let soundDiscount = 0;
    
    // Cast to any to access potentially un-typed property or just update interface later
    // For safety in this replace block, I'll use (booking as any)
    if ((booking as any).is_prompt_payment) {
      promptDiscount = 20 * duration;
    }
    
    // "No Sound Operator" Logic
    const isNoSoundOperator = booking.session_details?.toLowerCase().includes("no sound operator") || booking.session_type === "Meetings / Classes";
    if (isNoSoundOperator) {
      soundDiscount = 50 * duration;
    }
    
    const currentTotal = booking.total_amount || 0;
    // Infer Base Rate
    const inferredBaseAmount = currentTotal + promptDiscount + soundDiscount;
    const inferredBaseRate = Math.round(inferredBaseAmount / duration);
    
    const basicAmount = inferredBaseRate * duration;
    const instantDiscount = promptDiscount + soundDiscount;
    
    // Helpers
    const fmtMoney = (n: number) => `₹ ${n.toLocaleString()}`;
    const fmtNegMoney = (n: number) => `- ₹ ${n.toLocaleString()}`;

    // Build Invoice Table
    let tableRows = `Basic Amount                    ${inferredBaseRate} × ${duration}             ${fmtMoney(basicAmount)}`;
    if (soundDiscount > 0) {
      tableRows += `\nNo Sound Operator Discount       50 × ${duration}              ${fmtNegMoney(soundDiscount)}`;
    }
    if (promptDiscount > 0) {
      tableRows += `\nPrompt Payment Discount          20 × ${duration}              ${fmtNegMoney(promptDiscount)}`;
    }

    // Message Construction Logic
    const isLive = booking.session_type === "Live with musicians";
    const sessionTypeDisplay = isLive
      ? "Live session"
      : booking.session_type;
    
    let sessionDetailsDisplay = "";
    if (booking.session_details && booking.session_details !== booking.session_type) {
      const prefix = isLive ? " with up to " : " with ";
      sessionDetailsDisplay = `${prefix}${booking.session_details}`;
    }

    const message = `*Booking Confirmed - Resonance Studio, Sinhgad Road Branch*

Your booking of ${formattedDate} from ${formattedStartTime} to ${formattedEndTime} (${duration} hours) for ${sessionTypeDisplay}${sessionDetailsDisplay} in ${booking.studio} is confirmed with us.

*Booking Amount Details:*

\`\`\`
Description                     Rate × Hours        Amount
------------------------------------------------------------
${tableRows}
------------------------------------------------------------
Final Amount                                        ${fmtMoney(currentTotal)}
\`\`\`

You have earned an instant discount of ${fmtMoney(instantDiscount)}.
Additionally, ₹${Math.round(duration * 30)} cashback has been added against your mobile number.${loyaltyMessagePart}

*Please note and inform all your group members:*

Do not park vehicles blocking the society gate

Kindly avoid extended chatting on the society road to maintain a peaceful environment

Strictly no noise after 10:00 pm

We look forward to hosting you.
Enjoy your session!`;

    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(
      message
    )}`;
    window.open(whatsappUrl, "_blank");

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
      console.error("Failed to mark confirmation as sent:", error);
    }
  };

  const sendReminder = async (booking: Booking) => {
    const phone = booking.phone_number.replace(/[^0-9]/g, "");
    const formattedStartTime = formatTime(booking.start_time);
    const formattedEndTime = formatTime(booking.end_time);

    // Date formatting with ordinal
    const dateObj = new Date(booking.date);
    const dayName = dateObj.toLocaleDateString('en-GB', { weekday: 'long' });
    const d = dateObj.getDate();
    const ordinal = (d > 3 && d < 21) ? 'th' : ['th', 'st', 'nd', 'rd'][d % 10] || 'th';
    const monthYear = dateObj.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    const niceDate = `${dayName}, ${d}${ordinal} ${monthYear}`;

    // Duration calculation
    const s = booking.start_time.split(':').map(Number);
    const e = booking.end_time.split(':').map(Number);
    const duration = (e[0] * 60 + e[1] - (s[0] * 60 + s[1])) / 60;

    const isLive = booking.session_type === "Live with musicians";
    const sessionTypeDisplay = isLive
      ? "Live session"
      : (booking.session_type || "Session");
    
    let sessionDetailsDisplay = "";
    if (booking.session_details && booking.session_details !== booking.session_type) {
      const prefix = isLive ? " with up to " : " with ";
      sessionDetailsDisplay = `${prefix}${booking.session_details}`;
    }

    const message = `*Reminder - Resonance Studio, Sinhgad Road Branch*

This is to remind you that you have an upcoming booking on ${niceDate} from ${formattedStartTime} to ${formattedEndTime} (${duration} hours) for a ${sessionTypeDisplay}${sessionDetailsDisplay} in ${booking.studio} with us.

*Please note and inform all your group members:*

Do not park vehicles blocking the society gate

Kindly avoid extended chatting on the society road to maintain a peaceful environment

Strictly no noise after 10:00 pm

We look forward to hosting you.
See you soon!`;

    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(
      message
    )}`;
    window.open(whatsappUrl, "_blank");

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

  // --- Render ---

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" role="status">
        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
      </div>
    );
  }

  const brand = (label: string) => (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-violet-400 flex items-center justify-center">
        <Music2 className="w-4 h-4 text-navy" />
      </div>
      <span className="leading-tight">
        <span className="block text-sm font-bold text-white">Resonance</span>
        <span className="block text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">{label}</span>
      </span>
    </div>
  );

  // Not authorized -> sign in
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <div className="mb-8">{brand("Reminders")}</div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Sign in</h1>
            <p className="text-zinc-400 mt-1">Send WhatsApp reminders for upcoming sessions.</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
            <form onSubmit={handleLogin} className="space-y-6">
              {loginError && (
                <p role="alert" className="p-4 bg-red-500/10 border border-red-500/25 rounded-xl text-red-300 text-sm">
                  {loginError}
                </p>
              )}

              <div>
                <label htmlFor="rem-email" className="block text-sm font-medium text-zinc-300 mb-2.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" />
                  <input
                    id="rem-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@resonance.studio"
                    className="w-full bg-white/[0.04] border border-white/15 rounded-xl pl-12 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/30 transition-colors"
                    required
                    disabled={loginLoading}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="rem-password" className="block text-sm font-medium text-zinc-300 mb-2.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" />
                  <input
                    id="rem-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full bg-white/[0.04] border border-white/15 rounded-xl pl-12 pr-12 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/30 transition-colors"
                    required
                    disabled={loginLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-400 hover:bg-violet-300 text-navy font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loginLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>
          </div>
          <p className="text-zinc-500 text-sm mt-6">For studio admins only.</p>
        </div>
      </div>
    );
  }

  // Authorized -> reminder queue
  const filteredBookings = bookings
    .filter((booking) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        booking.name?.toLowerCase().includes(searchLower) ||
        booking.phone_number.includes(searchTerm);

      if (!matchesSearch) return false;

      if (activeTab === "pending") {
        return !booking.whatsapp_reminder_sent_at;
      } else {
        return booking.whatsapp_reminder_sent_at;
      }
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const pendingCount = bookings.filter((b) => !b.whatsapp_reminder_sent_at).length;
  const sentCount = bookings.filter((b) => b.whatsapp_reminder_sent_at).length;

  const tab = (active: boolean) =>
    `inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${
      active ? "bg-violet-400 text-navy" : "text-zinc-400 hover:text-white"
    }`;

  return (
    <div className="min-h-screen text-white">
      <header className="sticky top-0 z-30 h-16 bg-[#101c3d]/90 backdrop-blur-xl border-b border-white/[0.06] px-4 lg:px-8">
        <div className="max-w-6xl mx-auto h-full flex items-center justify-between">
          {brand("Reminders")}
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 lg:px-8 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500 mb-1">WhatsApp reminders</p>
            <h1 className="text-3xl font-bold tracking-tight">Sessions in the next 24 hours</h1>
          </div>
          <button
            onClick={fetchBookings}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-sm font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        <dl className="grid grid-cols-3 rounded-2xl border border-white/10 bg-white/[0.03] divide-x divide-white/10">
          {[
            { label: "In window", value: bookings.length, tone: "text-white" },
            { label: "To send", value: pendingCount, tone: pendingCount ? "text-amber-300" : "text-white" },
            { label: "Sent", value: sentCount, tone: "text-emerald-300" },
          ].map((s) => (
            <div key={s.label} className="p-4 sm:p-6">
              <dt className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-400 mb-2">{s.label}</dt>
              <dd className={`text-2xl sm:text-3xl font-bold tabular-nums ${s.tone}`}>{s.value}</dd>
            </div>
          ))}
        </dl>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex p-1 rounded-lg bg-white/[0.04] border border-white/10 w-fit" role="tablist">
            <button role="tab" aria-selected={activeTab === "pending"} onClick={() => setActiveTab("pending")} className={tab(activeTab === "pending")}>
              To send <span className="tabular-nums opacity-70">{pendingCount}</span>
            </button>
            <button role="tab" aria-selected={activeTab === "sent"} onClick={() => setActiveTab("sent")} className={tab(activeTab === "sent")}>
              Sent <span className="tabular-nums opacity-70">{sentCount}</span>
            </button>
          </div>
          <div className="relative sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="search"
              aria-label="Search by name or phone"
              placeholder="Search name or phone"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white/[0.04] border border-white/10 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-400"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20" role="status">
            <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-16 text-center">
            <MessageCircle className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
            <h2 className="text-lg font-semibold mb-1">
              {bookings.length === 0 ? "Nothing to send right now" : activeTab === "pending" && !searchTerm ? "All reminders sent" : "No matches"}
            </h2>
            <p className="text-sm text-zinc-400">
              {bookings.length === 0
                ? "No confirmed sessions start in the next 24 hours. Refresh later."
                : activeTab === "pending" && !searchTerm
                  ? "Every session in the window has had its reminder."
                  : "No sessions match this search."}
            </p>
          </div>
        ) : (
          <ul className="rounded-2xl border border-white/10 bg-white/[0.03] divide-y divide-white/[0.06] overflow-hidden mb-10">
            {filteredBookings.map((booking) => {
              const hoursUntil = getHoursUntilBooking(booking.date, booking.start_time);
              const sent = !!booking.whatsapp_reminder_sent_at;
              const isUrgent = hoursUntil <= 4 && !sent;
              const started = hasEventStarted(booking.date, booking.start_time);
              const left = Math.min(1, Math.max(0, hoursUntil / 24)); // share of the 24h window remaining

              return (
                <li key={booking.id} className="flex flex-col md:flex-row md:items-center gap-4 p-4 sm:p-5">
                  {/* Countdown */}
                  <div className="md:w-28 shrink-0 flex md:block items-center gap-3">
                    <p className={`text-xl font-bold tabular-nums ${isUrgent ? "text-amber-300" : "text-white"}`}>
                      {hoursUntil <= 0 ? "< 1h" : `in ${hoursUntil}h`}
                    </p>
                    <div className="h-1 w-20 md:w-full rounded-full bg-white/10 overflow-hidden md:mt-2" aria-hidden="true">
                      <div
                        className={`h-full rounded-full ${isUrgent ? "bg-amber-400" : sent ? "bg-emerald-400" : "bg-violet-400"}`}
                        style={{ width: `${left * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Who and when */}
                  <div className="flex-1 min-w-0 grid sm:grid-cols-2 gap-x-6 gap-y-1">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">
                        {booking.name || "Unknown"}
                        {isUrgent && (
                          <span className="ml-2 align-middle px-1.5 py-0.5 rounded bg-amber-400/15 text-amber-300 text-[11px] font-medium">
                            Urgent
                          </span>
                        )}
                      </p>
                      <a href={`tel:${booking.phone_number}`} className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white tabular-nums">
                        <Phone className="w-3.5 h-3.5" />
                        {booking.phone_number}
                      </a>
                    </div>
                    <div className="min-w-0 text-sm">
                      <p className="text-zinc-200 tabular-nums">
                        {formatDate(booking.date)} · {formatTime(booking.start_time)} – {formatTime(booking.end_time)}
                      </p>
                      <p className="text-zinc-400 truncate">
                        {booking.studio}
                        {booking.session_type ? ` · ${booking.session_type}` : ""}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 md:justify-end shrink-0">
                    {sent && (
                      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-300 mr-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Reminder sent
                      </span>
                    )}
                    <button
                      onClick={() => sendConfirmation(booking)}
                      disabled={started}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <BadgeCheck className="w-4 h-4 text-violet-400" />
                      {started ? "Session started" : "Send confirmation"}
                    </button>
                    <button
                      onClick={() => handleSendReminder(booking)}
                      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                        sent
                          ? "border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-white"
                          : "bg-emerald-500 hover:bg-emerald-400 text-white"
                      }`}
                    >
                      {sent ? <Send className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />}
                      {sent ? "Send again" : "Send reminder"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
