'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Plus,
  Building2,
  ChevronDown,
  X,
  Phone,
  User,
  FileText,
  IndianRupee,
  Filter,
  ArrowUpDown,
  RotateCcw,
} from 'lucide-react';
import { getSession } from '@/lib/supabaseAuth';

type DatePreset = 'today' | 'week' | 'month' | 'all';
type SortField = 'date' | 'status' | 'studio';
type SortOrder = 'asc' | 'desc';

interface DashboardStats {
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  completedBookings: number;
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

interface TodayBooking {
  id: string;
  studio: string;
  date: string;
  start_time: string;
  end_time: string;
  name: string | null;
  phone_number: string;
  session_type: string | null;
  session_details: string | null;
  total_amount: number | null;
  status: string;
}

// Helper functions for date calculations
const getDateRange = (preset: DatePreset): { startDate: string; endDate: string } | null => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  switch (preset) {
    case 'today':
      const todayStr = today.toISOString().split('T')[0];
      return { startDate: todayStr, endDate: todayStr };
    case 'week':
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return { 
        startDate: weekStart.toISOString().split('T')[0], 
        endDate: weekEnd.toISOString().split('T')[0] 
      };
    case 'month':
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return { 
        startDate: monthStart.toISOString().split('T')[0], 
        endDate: monthEnd.toISOString().split('T')[0] 
      };
    case 'all':
    default:
      return null;
  }
};

import InvestorDashboard from './InvestorDashboard';

// ... (other imports)

export default function StaffDashboard() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    confirmedBookings: 0,
    cancelledBookings: 0,
    completedBookings: 0,
    totalRevenue: 0,
    todayBookings: 0,
    availableSlots: 0,
  });
  // ... (other state)

  useEffect(() => {
    const fetchUser = async () => {
      const stored = localStorage.getItem('staff');
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      }
    };
    fetchUser();
  }, []);

  const [loading, setLoading] = useState(true);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [todayBookings, setTodayBookings] = useState<TodayBooking[]>([]);
  const [selectedStudio, setSelectedStudio] = useState<string>('all');
  const [selectedBooking, setSelectedBooking] = useState<TodayBooking | null>(null);
  
  // Filter states
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [filterStudio, setFilterStudio] = useState<string>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [useCustomDates, setUseCustomDates] = useState(false);
  
  // Sort states
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

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
    // Wait for user to be loaded
    if (!currentUser) return;
    
    // Skip if not staff (e.g. investor)
    if (currentUser.role !== 'staff') return;

    setLoading(true);
    try {
      const token = await getAccessToken();
      const today = new Date().toISOString().split('T')[0];
      
      // Build query params for stats
      const statsParams = new URLSearchParams();
      if (filterStudio !== 'all') {
        statsParams.set('studio', filterStudio);
      }
      
      // Date range handling
      if (useCustomDates && customStartDate) {
        statsParams.set('startDate', customStartDate);
        if (customEndDate) {
          statsParams.set('endDate', customEndDate);
        }
      } else if (datePreset !== 'all') {
        const range = getDateRange(datePreset);
        if (range) {
          statsParams.set('startDate', range.startDate);
          statsParams.set('endDate', range.endDate);
        }
      }
      
      // Fetch stats from staff API with filters
      const statsUrl = `/api/staff/stats${statsParams.toString() ? `?${statsParams.toString()}` : ''}`;
      const statsResponse = await fetch(statsUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Build query params for recent bookings
      const bookingsParams = new URLSearchParams();
      bookingsParams.set('limit', '10');
      if (filterStudio !== 'all') {
        bookingsParams.set('studio', filterStudio);
      }
      if (useCustomDates && customStartDate) {
        bookingsParams.set('startDate', customStartDate);
        if (customEndDate) {
          bookingsParams.set('endDate', customEndDate);
        }
      } else if (datePreset !== 'all') {
        const range = getDateRange(datePreset);
        if (range) {
          bookingsParams.set('startDate', range.startDate);
          bookingsParams.set('endDate', range.endDate);
        }
      }
      
      // Fetch recent bookings with filters
      const bookingsResponse = await fetch(`/api/staff/bookings?${bookingsParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json();
        setRecentBookings(bookingsData.bookings || []);
      }

      // Fetch today's bookings for the overview (always today)
      const todayParams = new URLSearchParams();
      todayParams.set('date', today);
      todayParams.set('status', 'confirmed');
      if (filterStudio !== 'all') {
        todayParams.set('studio', filterStudio);
      }
      
      const todayResponse = await fetch(`/api/staff/bookings?${todayParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (todayResponse.ok) {
        const todayData = await todayResponse.json();
        setTodayBookings(todayData.bookings || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, datePreset, filterStudio, customStartDate, customEndDate, useCustomDates, currentUser]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Group today's bookings by studio
  const getBookingsByStudio = () => {
    const grouped: Record<string, TodayBooking[]> = {};
    todayBookings.forEach((booking) => {
      if (!grouped[booking.studio]) {
        grouped[booking.studio] = [];
      }
      grouped[booking.studio].push(booking);
    });
    // Sort each group by time
    Object.keys(grouped).forEach((studio) => {
      grouped[studio].sort((a, b) => a.start_time.localeCompare(b.start_time));
    });
    return grouped;
  };

  // Group today's bookings by time
  const getBookingsByTime = () => {
    const sorted = [...todayBookings].sort((a, b) => a.start_time.localeCompare(b.start_time));
    return sorted;
  };

  // Sort recent bookings
  const getSortedRecentBookings = () => {
    const sorted = [...recentBookings].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'date':
          comparison = a.date.localeCompare(b.date);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'studio':
          comparison = a.studio.localeCompare(b.studio);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    return sorted;
  };

  // Reset all filters
  const resetFilters = () => {
    setDatePreset('all');
    setFilterStudio('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setUseCustomDates(false);
    setSortField('date');
    setSortOrder('desc');
  };

  // Check if any filters are active
  const hasActiveFilters = datePreset !== 'all' || filterStudio !== 'all' || useCustomDates;

  const bookingsByStudio = getBookingsByStudio();
  const bookingsByTime = getBookingsByTime();
  const sortedRecentBookings = getSortedRecentBookings();

  const statCards = [
    {
      label: 'Your Bookings',
      value: stats.totalBookings.toLocaleString('en-IN'),
      icon: Calendar,
      bgColor: 'bg-teal-500/10',
      iconColor: 'text-teal-400',
    },
    {
      label: 'Confirmed',
      value: stats.confirmedBookings.toLocaleString('en-IN'),
      icon: CheckCircle,
      bgColor: 'bg-emerald-500/10',
      iconColor: 'text-emerald-400',
    },
    {
      label: 'Cancelled',
      value: stats.cancelledBookings.toLocaleString('en-IN'),
      icon: XCircle,
      bgColor: 'bg-red-500/10',
      iconColor: 'text-red-400',
    },
    {
      label: 'Completed',
      value: (stats.completedBookings || 0).toLocaleString('en-IN'),
      icon: CheckCircle,
      bgColor: 'bg-blue-500/10',
      iconColor: 'text-blue-400',
    },
  ];

  const studioColors: Record<string, string> = {
    'Studio A': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    'Studio B': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'Studio C': 'bg-green-500/20 text-green-400 border-green-500/30',
  };

  if (currentUser?.role === 'investor') {
    return <InvestorDashboard user={currentUser} />;
  }

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

      {/* Analytics Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-2xl p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-teal-400" />
          <h3 className="text-sm font-medium text-white">Filter Analytics</h3>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="ml-auto flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          )}
        </div>
        
        <div className="flex flex-wrap gap-3">
          {/* Date Presets */}
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'today' as DatePreset, label: 'Today' },
              { value: 'week' as DatePreset, label: 'This Week' },
              { value: 'month' as DatePreset, label: 'This Month' },
              { value: 'all' as DatePreset, label: 'All Time' },
            ].map((preset) => (
              <button
                key={preset.value}
                onClick={() => {
                  setDatePreset(preset.value);
                  setUseCustomDates(false);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  datePreset === preset.value && !useCustomDates
                    ? 'bg-teal-500 text-white'
                    : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Custom Date Range */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">or</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => {
                setCustomStartDate(e.target.value);
                setUseCustomDates(true);
              }}
              className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
            />
            <span className="text-xs text-zinc-500">to</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => {
                setCustomEndDate(e.target.value);
                setUseCustomDates(true);
              }}
              className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Studio Filter */}
          <div className="relative ml-auto">
            <select
              value={filterStudio}
              onChange={(e) => setFilterStudio(e.target.value)}
              className="appearance-none bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 pr-8 text-xs text-white focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              <option value="all" className="bg-zinc-900">All Studios</option>
              <option value="Studio A" className="bg-zinc-900">Studio A</option>
              <option value="Studio B" className="bg-zinc-900">Studio B</option>
              <option value="Studio C" className="bg-zinc-900">Studio C</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-400 pointer-events-none" />
          </div>
        </div>

        {/* Active Filter Indicator */}
        {hasActiveFilters && (
          <div className="mt-3 flex items-center gap-2 text-xs text-teal-400">
            <span>Showing:</span>
            {useCustomDates && customStartDate && (
              <span className="bg-teal-500/20 px-2 py-0.5 rounded">
                {customStartDate} {customEndDate && `to ${customEndDate}`}
              </span>
            )}
            {!useCustomDates && datePreset !== 'all' && (
              <span className="bg-teal-500/20 px-2 py-0.5 rounded capitalize">{datePreset}</span>
            )}
            {filterStudio !== 'all' && (
              <span className="bg-teal-500/20 px-2 py-0.5 rounded">{filterStudio}</span>
            )}
          </div>
        )}
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* Today's Overview - Two Column Layout */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass rounded-2xl p-6"
      >
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2 flex-wrap">
          <Clock className="w-5 h-5 text-teal-400" />
          Today&apos;s Overview
          <span className="text-sm font-normal text-teal-400 ml-1">
            — {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
          <span className="text-sm font-normal text-zinc-400 ml-auto">
            ({stats.todayBookings} bookings)
          </span>
        </h2>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-teal-400 animate-spin" />
          </div>
        ) : todayBookings.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
            <p className="text-zinc-400 text-sm">No bookings for today</p>
          </div>
        ) : (
          <div>
            {/* Studio + Time View */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    By Studio
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">Grouped by studio</p>
                </div>
                <div className="relative">
                  <select
                    value={selectedStudio}
                    onChange={(e) => setSelectedStudio(e.target.value)}
                    className="appearance-none bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 pr-8 text-sm text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                  >
                    <option value="all" className="bg-zinc-900">All Studios</option>
                    <option value="Studio A" className="bg-zinc-900">Studio A</option>
                    <option value="Studio B" className="bg-zinc-900">Studio B</option>
                    <option value="Studio C" className="bg-zinc-900">Studio C</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-3">
                {Object.entries(bookingsByStudio)
                  .filter(([studio]) => selectedStudio === 'all' || studio === selectedStudio)
                  .map(([studio, bookings]) => (
                  <div key={studio} className="bg-white/5 rounded-xl p-3">
                    <div className={`inline-block px-2 py-1 rounded-lg text-xs font-medium mb-2 border ${studioColors[studio] || 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'}`}>
                      {studio}
                    </div>
                    <div className="space-y-2">
                      {bookings.map((booking) => (
                        <div 
                          key={booking.id} 
                          className="flex items-center justify-between text-sm p-2 -m-2 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
                          onClick={() => setSelectedBooking(booking)}
                        >
                          <span className="text-zinc-300">
                            {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                          </span>
                          <span className="text-zinc-400 text-xs truncate ml-2 max-w-[100px]">
                            {booking.name || 'N/A'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {Object.entries(bookingsByStudio).filter(([studio]) => selectedStudio === 'all' || studio === selectedStudio).length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-zinc-400 text-sm">No bookings for this studio</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Recent Bookings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-teal-400" />
            Your Recent Bookings
          </h2>
          
          {/* Sorting Controls */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-zinc-500" />
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="appearance-none bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              <option value="date" className="bg-zinc-900">Date</option>
              <option value="status" className="bg-zinc-900">Status</option>
              <option value="studio" className="bg-zinc-900">Studio</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white hover:bg-white/10 transition-colors"
            >
              {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
            </button>
          </div>
        </div>
        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-teal-400 animate-spin" />
            </div>
          ) : sortedRecentBookings.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
              <p className="text-zinc-400 text-sm">No bookings found</p>
            </div>
          ) : (
            sortedRecentBookings.map((booking) => (
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
                      : booking.status === 'completed'
                      ? 'bg-blue-500/20 text-blue-400'
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

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedBooking(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Booking Details</h3>
              <button
                onClick={() => setSelectedBooking(null)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            {/* Studio Badge */}
            <div className={`inline-block px-3 py-1.5 rounded-lg text-sm font-medium mb-4 border ${studioColors[selectedBooking.studio] || 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'}`}>
              {selectedBooking.studio}
            </div>

            {/* Details Grid */}
            <div className="space-y-3">
              {/* Time */}
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                <Clock className="w-5 h-5 text-teal-400" />
                <div>
                  <p className="text-xs text-zinc-400">Time</p>
                  <p className="text-white font-medium">
                    {formatTime(selectedBooking.start_time)} - {formatTime(selectedBooking.end_time)}
                  </p>
                </div>
              </div>

              {/* Customer Name */}
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                <User className="w-5 h-5 text-emerald-400" />
                <div>
                  <p className="text-xs text-zinc-400">Customer</p>
                  <p className="text-white font-medium">{selectedBooking.name || 'N/A'}</p>
                </div>
              </div>

              {/* Phone Number */}
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                <Phone className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-xs text-zinc-400">Phone</p>
                  <p className="text-white font-medium">{selectedBooking.phone_number || 'N/A'}</p>
                </div>
              </div>

              {/* Session Type */}
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                <FileText className="w-5 h-5 text-amber-400" />
                <div>
                  <p className="text-xs text-zinc-400">Session Type</p>
                  <p className="text-white font-medium">{selectedBooking.session_type || 'N/A'}</p>
                </div>
              </div>

              {/* Amount */}
              {selectedBooking.total_amount && (
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                  <IndianRupee className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-xs text-zinc-400">Amount</p>
                    <p className="text-white font-medium">₹{selectedBooking.total_amount.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
