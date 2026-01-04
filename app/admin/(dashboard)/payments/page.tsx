"use strict";
"use client";

import { useState, useEffect } from "react";

import {
  Search,
  CheckCircle,
  XCircle,
  Loader2,
  Calendar,
  CreditCard,
  MapPin,
  Clock,
  User,
  Phone,
  AlertCircle,
} from "lucide-react";
import { getSession } from "@/lib/supabaseAuth";
import { motion, AnimatePresence } from "framer-motion";

interface Booking {
  id: string;
  name: string;
  phone_number: string;
  email: string | null;
  studio: string;
  date: string;
  start_time: string;
  end_time: string;
  session_type: string;
  total_amount: number | null;
  status: "pending" | "confirmed" | "cancelled" | "completed" | "no_show";
  is_prompt_payment: boolean;
  payment_status: "pending" | "verified" | "failed";
  created_at: string;
}

export default function PaymentsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"pending" | "verified">("pending");
  const [updating, setUpdating] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const getAccessToken = async () => {
    const session = await getSession();
    if (!session?.access_token) {
      throw new Error("No active session");
    }
    return session.access_token;
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const token = await getAccessToken();
      const response = await fetch("/api/admin/bookings?limit=100", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.bookings) {
        // Filter for prompt payment bookings only
        const promptBookings = data.bookings.filter(
          (b: Booking) => b.is_prompt_payment
        );
        setBookings(promptBookings);
      }
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const updatePaymentStatus = async (
    bookingId: string,
    newStatus: "verified" | "pending" | "failed"
  ) => {
    setUpdating(bookingId);
    setMessage(null);

    try {
      const token = await getAccessToken();
      const response = await fetch("/api/admin/bookings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: bookingId, payment_status: newStatus }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({
          type: "success",
          text: `Payment marked as ${newStatus}!`,
        });
        setBookings((prev) =>
          prev.map((b) =>
            b.id === bookingId ? { ...b, payment_status: newStatus } : b
          )
        );
      } else {
        throw new Error(data.error || "Failed to update payment status");
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setUpdating(null);
    }
  };

  const filteredBookings = bookings
    .filter((b) => {
      // Tab filter
      if (activeTab === "pending") {
        return b.payment_status !== "verified"; // Show all not verified (pending/failed)
      } else {
        return b.payment_status === "verified";
      }
    })
    .filter((b) => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      return (
        b.name?.toLowerCase().includes(searchLower) ||
        b.phone_number?.includes(searchLower) ||
        b.email?.toLowerCase().includes(searchLower) ||
        b.id.toLowerCase().includes(searchLower)
      );
    });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Payment Verification</h1>
          <p className="text-zinc-400 mt-1">
            Manage payments for prompt payment bookings
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="glass rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <p className="text-zinc-400 text-sm">Pending Verification</p>
            <p className="text-2xl font-bold text-white">
              {bookings.filter((b) => b.payment_status !== "verified").length}
            </p>
          </div>
        </div>
        <div className="glass rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-zinc-400 text-sm">Verified Payments</p>
            <p className="text-2xl font-bold text-white">
              {bookings.filter((b) => b.payment_status === "verified").length}
            </p>
          </div>
        </div>
        <div className="glass rounded-xl p-4 flex items-center gap-4">
           <div className="w-12 h-12 rounded-full bg-violet-500/20 flex items-center justify-center">
            <Calendar className="w-6 h-6 text-violet-400" />
          </div>
          <div>
            <p className="text-zinc-400 text-sm">Total Prompt Pay</p>
            <p className="text-2xl font-bold text-white">{bookings.length}</p>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="glass rounded-2xl p-4 space-y-4">
         {/* Tabs */}
        <div className="flex p-1 bg-white/5 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "pending"
                ? "bg-violet-500 text-white shadow-lg shadow-violet-500/20"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
          >
            Pending Verification
          </button>
          <button
            onClick={() => setActiveTab("verified")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "verified"
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
          >
            Verified Payments
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search bookings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 pl-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
          />
        </div>
      </div>

      {/* Feedback Message */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-xl flex items-center gap-3 ${
              message.type === "success"
                ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                : "bg-red-500/10 border border-red-500/20 text-red-400"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <p className="font-medium">{message.text}</p>
            <button 
              onClick={() => setMessage(null)}
              className="ml-auto p-1 hover:bg-white/10 rounded-lg"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bookings List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 text-violet-400 animate-spin mx-auto mb-4" />
            <p className="text-zinc-400">Loading bookings...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="p-12 text-center glass rounded-2xl">
            <CreditCard className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400">No {activeTab} payments found</p>
          </div>
        ) : (
          filteredBookings.map((booking) => (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-xl p-6 transition-colors hover:bg-white/5 border border-white/5 hover:border-violet-500/30"
            >
              <div className="flex flex-col lg:flex-row gap-6 lg:items-center">
                
                {/* Info Section */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        {booking.name || "N/A"}
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 text-xs font-bold uppercase border border-amber-500/30">
                          Prompt Pay
                        </span>
                      </h3>
                      <p className="text-zinc-400 text-sm flex items-center gap-1 mt-1">
                        <Phone className="w-3 h-3" /> {booking.phone_number}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <p className="text-2xl font-bold text-white">
                        ₹{booking.total_amount?.toLocaleString("en-IN")}
                      </p>
                       <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${
                            booking.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-400' :
                            booking.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                            'bg-zinc-500/20 text-zinc-400'
                       }`}>
                         Booking: {booking.status}
                       </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-zinc-300 bg-white/5 p-2 rounded-lg">
                      <MapPin className="w-4 h-4 text-violet-400" />
                      {booking.studio}
                    </div>
                    <div className="flex items-center gap-2 text-zinc-300 bg-white/5 p-2 rounded-lg">
                      <Calendar className="w-4 h-4 text-violet-400" />
                      {formatDate(booking.date)}
                    </div>
                    <div className="flex items-center gap-2 text-zinc-300 bg-white/5 p-2 rounded-lg">
                      <Clock className="w-4 h-4 text-violet-400" />
                      {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                    </div>
                  </div>
                </div>

                {/* Actions Section */}
                <div className="flex items-center gap-3 lg:border-l lg:border-white/10 lg:pl-6">
                  {booking.payment_status === "verified" ? (
                    <div className="flex flex-col items-center gap-2 text-emerald-400 px-4">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <CheckCircle className="w-6 h-6" />
                      </div>
                      <span className="text-sm font-bold">Verified</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => updatePaymentStatus(booking.id, "verified")}
                      disabled={updating === booking.id}
                      className="flex-1 lg:flex-none btn-primary bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center gap-2 py-3 px-6 whitespace-nowrap"
                    >
                      {updating === booking.id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <CheckCircle className="w-5 h-5" />
                      )}
                      Mark Verified
                    </button>
                  )}
                  {booking.payment_status !== 'verified' && (
                     <button
                      onClick={() => updatePaymentStatus(booking.id, "failed")}
                      disabled={updating === booking.id}
                      className="p-3 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Mark as Failed"
                    >
                       <XCircle className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
