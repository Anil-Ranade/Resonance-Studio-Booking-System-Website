"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  Building2, 
  Calendar, 
  CheckCircle, 
  Clock, 
  IndianRupee, 
  TrendingUp,
  Loader2,
  FileText,
  Plus,
  Edit2,
  XCircle,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/supabaseAuth";
import type { AdminUser } from "@/types";

interface InvestorDashboardProps {
  user: AdminUser;
}

export default function InvestorDashboard({ user }: InvestorDashboardProps) {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    try {
      const session = await getSession();
      if (session?.access_token) return session.access_token;
      return localStorage.getItem("staffAccessToken");
    } catch {
      return localStorage.getItem("staffAccessToken");
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = await getAccessToken();
        
        // Fetch full investor details to get updated account stats
        const invResponse = await fetch(`/api/admin/investors/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (invResponse.ok) {
          const data = await invResponse.json();
          setStats(data.investor.investor_accounts);
        }

        // Fetch assigned bookings
        const bookingsResponse = await fetch(`/api/admin/bookings?investorId=${user.id}&limit=10`, {
           headers: { Authorization: `Bearer ${token}` }
        });

        if (bookingsResponse.ok) {
           const data = await bookingsResponse.json();
           setBookings(data.bookings || []);
        }

      } catch (error) {
        console.error("Error fetching investor data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user.id, getAccessToken]);

  if (loading) {
     return (
        <div className="flex items-center justify-center h-64">
           <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
        </div>
     );
  }

  const handleEdit = (booking: any) => {
    // Store booking data in sessionStorage for the booking flow
    const editData = {
      editMode: true,
      originalBookingId: booking.id,
      sessionType: booking.session_type,
      sessionDetails: booking.session_details,
      studio: booking.studio,
      date: booking.date,
      start_time: booking.start_time,
      end_time: booking.end_time,
      phone_number: booking.phone_number || "",
      name: booking.name || "",
      email: booking.email || "",
      total_amount: booking.total_amount,
      group_size: 1, // Default or mock
      otpVerified: true,
    };

    sessionStorage.setItem("editBookingData", JSON.stringify(editData));
    router.push("/staff/booking/new");
  };

  const handleCancel = async (bookingId: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    
    setActionLoading(bookingId);
    try {
      const token = await getAccessToken();
      const response = await fetch('/api/staff/bookings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: bookingId,
          status: 'cancelled'
        })
      });

      if (!response.ok) throw new Error('Failed to cancel booking');

      // Refresh bookings
      const updatedBookings = bookings.map(b => 
        b.id === bookingId ? { ...b, status: 'cancelled' } : b
      );
      setBookings(updatedBookings);
      
      // Ideally refresh stats too, but UI update is faster
    } catch (error) {
      console.error("Error cancelling booking:", error);
      alert("Failed to cancel booking");
    } finally {
      setActionLoading(null);
    }
  };

  const progress = stats ? (stats.current_revenue / stats.target_revenue) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 border border-violet-500/20 rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-white mb-2">Welcome Back, {user.name}</h1>
        <p className="text-zinc-400">Track your investment growth and assigned bookings.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Deposit Card */}
        <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
           <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                 <Building2 className="w-6 h-6" />
              </div>
              <div>
                 <p className="text-sm text-zinc-400">Initial Deposit</p>
                 <h3 className="text-xl font-bold text-white">₹{stats?.deposit_amount?.toLocaleString() || 0}</h3>
              </div>
           </div>
        </div>

        {/* Revenue Card */}
        <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden">
           <div className="flex items-center gap-4 mb-4 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                 <IndianRupee className="w-6 h-6" />
              </div>
              <div>
                 <p className="text-sm text-zinc-400">Current Revenue</p>
                 <h3 className="text-xl font-bold text-white">₹{stats?.current_revenue?.toLocaleString() || 0}</h3>
              </div>
           </div>
           {/* Progress Bar */}
           <div className="mt-4 relative z-10">
              <div className="flex justify-between text-xs mb-2">
                 <span className="text-zinc-400">Target: ₹{stats?.target_revenue?.toLocaleString() || 45000}</span>
                 <span className="text-emerald-400 font-medium">{progress.toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                 <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                 />
              </div>
           </div>
        </div>

        {/* Profit Check */}
        <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                 <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                 <p className="text-sm text-zinc-400">projected Return</p>
                 <h3 className="text-xl font-bold text-white">50%</h3>
              </div>
           </div>
           <p className="text-xs text-zinc-500">
             You will receive ₹{stats?.target_revenue?.toLocaleString()} upon completion.
           </p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-8 mb-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
           <Calendar className="w-5 h-5 text-violet-400" />
           Your Bookings
        </h2>
        <Link 
          href="/staff/booking/new"
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Booking
        </Link>
      </div>

      <div className="bg-zinc-900/50 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
         {bookings.length === 0 ? (
            <div className="p-8 text-center text-zinc-500">
               No bookings assigned yet.
            </div>
         ) : (
            <div className="overflow-x-auto">
               <table className="w-full">
                  <thead className="bg-white/5">
                     <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Date & Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Studio</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Session</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                     {bookings.map((booking) => (
                        <tr key={booking.id} className="hover:bg-white/5 transition-colors">
                           <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-white">{new Date(booking.date).toLocaleDateString()}</div>
                              <div className="text-xs text-zinc-400">
                                 {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                              </div>
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-zinc-300">{booking.studio}</span>
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-zinc-300">{booking.session_type || '-'}</div>
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm font-medium text-emerald-400">₹{booking.total_amount?.toLocaleString()}</span>
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                 booking.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400' :
                                 booking.status === 'completed' ? 'bg-blue-500/10 text-blue-400' :
                                 'bg-zinc-500/10 text-zinc-400'
                              }`}>
                                 {booking.status}
                              </span>
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              {booking.status === 'confirmed' && (
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleEdit(booking)}
                                    className="p-1.5 hover:bg-white/10 rounded-lg text-blue-400 transition-colors"
                                    title="Edit Booking"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleCancel(booking.id)}
                                    disabled={actionLoading === booking.id}
                                    className="p-1.5 hover:bg-white/10 rounded-lg text-red-400 transition-colors disabled:opacity-50"
                                    title="Cancel Booking"
                                  >
                                    {actionLoading === booking.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <XCircle className="w-4 h-4" />
                                    )}
                                  </button>
                                </div>
                              )}
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         )}
      </div>

    </div>
  );
}
