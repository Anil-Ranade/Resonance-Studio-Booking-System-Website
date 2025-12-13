'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Plus,
} from 'lucide-react';
import { getSession } from '@/lib/supabaseAuth';

interface DashboardStats {
  totalBookings: number;
  confirmedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  todayBookings: number;
  availableSlots: number;
}

interface RecentBooking {
  id: string;
  studio: string;
  date: string;
  start_time: string;
  end_time: string;
  name: string | null;
  phone_number: string;
  status: string;
}

export default function StaffDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    confirmedBookings: 0,
    pendingBookings: 0,
    cancelledBookings: 0,
    totalRevenue: 0,
    todayBookings: 0,
    availableSlots: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);

  // Helper to get the current access token
  const getAccessToken = useCallback(async (): Promise<string | null> => {
    try {
      const session = await getSession();
      if (session?.access_token) {
        localStorage.setItem('staffAccessToken', session.access_token);
        return session.access_token;
      }
      return localStorage.getItem('staffAccessToken');
    } catch {
      return localStorage.getItem('staffAccessToken');
    }
  }, []);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getAccessToken();
      
      // Fetch stats from staff API
      const statsResponse = await fetch('/api/staff/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Fetch recent bookings (staff's own only)
      const bookingsResponse = await fetch('/api/staff/bookings?limit=5', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json();
        setRecentBookings(bookingsData.bookings || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const formatTime = (time: string) => {
    return time.slice(0, 5); // Returns "HH:MM" format (24-hour)
  };

  const statCards = [
    {
      label: 'Your Bookings',
      value: stats.totalBookings.toLocaleString('en-IN'),
      icon: Calendar,
      color: 'from-teal-500 to-cyan-600',
      bgColor: 'bg-teal-500/10',
      iconColor: 'text-teal-400',
    },
    {
      label: 'Confirmed',
      value: stats.confirmedBookings.toLocaleString('en-IN'),
      icon: CheckCircle,
      color: 'from-emerald-500 to-green-600',
      bgColor: 'bg-emerald-500/10',
      iconColor: 'text-emerald-400',
    },
    {
      label: 'Pending',
      value: stats.pendingBookings.toLocaleString('en-IN'),
      icon: AlertCircle,
      color: 'from-amber-500 to-orange-600',
      bgColor: 'bg-amber-500/10',
      iconColor: 'text-amber-400',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6"
      >
        <h2 className="text-xl font-bold text-white mb-2">Welcome to Staff Portal</h2>
        <p className="text-zinc-400">
          Here you can manage bookings you&apos;ve created. Your bookings are tracked separately from other staff members.
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}
                >
                  <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                </div>
              </div>
              <p className="text-zinc-400 text-sm mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-white">
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  stat.value
                )}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-2xl p-6"
        >
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-teal-400" />
            Today&apos;s Overview
          </h2>
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-zinc-400 text-sm">Your Bookings Today</p>
            <p className="text-2xl font-bold text-white">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : stats.todayBookings}
            </p>
          </div>
        </motion.div>

        {/* Recent Bookings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass rounded-2xl p-6"
        >
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-teal-400" />
            Your Recent Bookings
          </h2>
          <div className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-teal-400 animate-spin" />
              </div>
            ) : recentBookings.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
                <p className="text-zinc-500 text-sm">No bookings yet</p>
              </div>
            ) : (
              recentBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between bg-white/5 rounded-xl p-3"
                >
                  <div>
                    <p className="text-white font-medium">{booking.studio}</p>
                    <p className="text-zinc-400 text-sm">
                      {booking.date} • {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-lg text-xs font-medium ${
                      booking.status === 'confirmed'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : booking.status === 'pending'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {booking.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="glass rounded-2xl p-6"
      >
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a
            href="/staff/bookings"
            className="flex items-center gap-3 p-4 bg-teal-500/10 border border-teal-500/20 rounded-xl hover:bg-teal-500/20 transition-colors"
          >
            <Calendar className="w-6 h-6 text-teal-400" />
            <div>
              <p className="text-white font-medium">View My Bookings</p>
              <p className="text-zinc-400 text-sm">Manage your created bookings</p>
            </div>
          </a>
          <a
            href="/staff/bookings"
            className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/20 transition-colors"
          >
            <Plus className="w-6 h-6 text-emerald-400" />
            <div>
              <p className="text-white font-medium">Create Booking</p>
              <p className="text-zinc-400 text-sm">Add a new booking for a customer</p>
            </div>
          </a>
        </div>
      </motion.div>
    </div>
  );
}
