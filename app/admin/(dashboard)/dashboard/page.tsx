'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Calendar,
  Clock,
  IndianRupee,
  TrendingUp,
  CheckCircle,
  XCircle,
  Loader2,
  Building2,
  ChevronDown,
  X,
  Phone,
  User,
  FileText,
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
      weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6); // End of week (Saturday)
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


export default function AdminDashboard() {
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
        localStorage.setItem('accessToken', session.access_token);
        return session.access_token;
      }
      return localStorage.getItem('accessToken');
    } catch {
      return localStorage.getItem('accessToken');
    }
  }, []);

  // Fetch current user details
  useEffect(() => {
    const fetchUser = async () => {
      const stored = localStorage.getItem('admin');
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      }
    };
    fetchUser();
  }, []);

  const fetchDashboardData = useCallback(async () => {
    if (!currentUser || currentUser.role === 'investor') return; // Skip fetch for investors

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
      
      // Fetch stats from API with filters
      const statsUrl = `/api/admin/stats${statsParams.toString() ? `?${statsParams.toString()}` : ''}`;
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
      const bookingsResponse = await fetch(`/api/admin/bookings?${bookingsParams.toString()}`, {
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
      
      const todayResponse = await fetch(`/api/admin/bookings?${todayParams.toString()}`, {
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
    { label: 'Total bookings', value: stats.totalBookings.toLocaleString('en-IN') },
    { label: 'Confirmed', value: stats.confirmedBookings.toLocaleString('en-IN') },
    { label: 'Cancelled', value: stats.cancelledBookings.toLocaleString('en-IN') },
    { label: 'Revenue', value: `₹${stats.totalRevenue.toLocaleString('en-IN')}` },
  ];

  const STUDIOS = ['Studio A', 'Studio B', 'Studio C'];
  const studioBlock: Record<string, string> = {
    'Studio A': 'bg-violet-400/90 hover:bg-violet-300 text-navy',
    'Studio B': 'bg-fuchsia-400/90 hover:bg-fuchsia-300 text-navy',
    'Studio C': 'bg-sky-300/90 hover:bg-sky-200 text-navy',
  };
  const statusPill: Record<string, string> = {
    confirmed: 'bg-emerald-400/15 text-emerald-300',
    completed: 'bg-violet-400/15 text-violet-300',
    cancelled: 'bg-red-400/15 text-red-300',
    no_show: 'bg-zinc-500/20 text-zinc-400',
    pending: 'bg-amber-400/15 text-amber-300',
  };

  // Today board: hour range covers opening hours and any booking outside them
  const toHours = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h + (m || 0) / 60;
  };
  const dayStart = Math.min(8, ...todayBookings.map((b) => Math.floor(toHours(b.start_time))));
  const dayEnd = Math.max(22, ...todayBookings.map((b) => Math.ceil(toHours(b.end_time))));
  const span = dayEnd - dayStart;
  const pos = (t: number) => `${((t - dayStart) / span) * 100}%`;
  const now = new Date();
  const nowH = now.getHours() + now.getMinutes() / 60;
  const hourMarks = Array.from({ length: span + 1 }, (_, i) => dayStart + i);
  const hourLabel = (h: number) => `${h % 12 === 0 ? 12 : h % 12}${h < 12 ? 'a' : 'p'}`;

  const filterChip = (active: boolean) =>
    `px-3 py-1.5 rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${
      active ? 'bg-violet-400 text-navy' : 'text-zinc-400 hover:text-white'
    }`;
  const field = 'bg-white/[0.04] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-violet-400';

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Page header + filters */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500 mb-1">Overview</p>
          <h2 className="text-3xl font-bold text-white tracking-tight">
            {currentUser?.name ? `Hello, ${currentUser.name.split(' ')[0]}` : 'Studio overview'}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex p-1 rounded-lg bg-white/[0.04] border border-white/10" role="group" aria-label="Date range">
            {[
              { value: 'today' as DatePreset, label: 'Today' },
              { value: 'week' as DatePreset, label: 'Week' },
              { value: 'month' as DatePreset, label: 'Month' },
              { value: 'all' as DatePreset, label: 'All time' },
            ].map((preset) => (
              <button
                key={preset.value}
                onClick={() => {
                  setDatePreset(preset.value);
                  setUseCustomDates(false);
                }}
                aria-pressed={datePreset === preset.value && !useCustomDates}
                className={filterChip(datePreset === preset.value && !useCustomDates)}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <input
            type="date"
            aria-label="From date"
            value={customStartDate}
            onChange={(e) => {
              setCustomStartDate(e.target.value);
              setUseCustomDates(true);
            }}
            className={field}
          />
          <span className="text-xs text-zinc-500">to</span>
          <input
            type="date"
            aria-label="To date"
            value={customEndDate}
            onChange={(e) => {
              setCustomEndDate(e.target.value);
              setUseCustomDates(true);
            }}
            className={field}
          />
          <div className="relative">
            <select
              aria-label="Studio"
              value={filterStudio}
              onChange={(e) => setFilterStudio(e.target.value)}
              className={`${field} appearance-none pr-7 cursor-pointer`}
            >
              <option value="all" className="bg-zinc-900">All studios</option>
              {STUDIOS.map((s) => (
                <option key={s} value={s} className="bg-zinc-900">{s}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-400 pointer-events-none" />
          </div>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1 px-2 py-1.5 text-xs text-zinc-400 hover:text-white"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* KPI strip */}
      <dl className="grid grid-cols-2 lg:grid-cols-4 rounded-2xl border border-white/10 bg-white/[0.03] divide-white/10 max-lg:[&>*:nth-child(-n+2)]:border-b max-lg:[&>*:nth-child(odd)]:border-r lg:divide-x">
        {statCards.map((stat) => (
          <div key={stat.label} className="p-5 lg:p-6 border-white/10">
            <dt className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-400 mb-2">{stat.label}</dt>
            <dd className="text-2xl lg:text-3xl font-bold text-white tabular-nums">
              {loading ? <Loader2 className="w-6 h-6 animate-spin text-zinc-500" /> : stat.value}
            </dd>
          </div>
        ))}
      </dl>

      {/* Today board */}
      <section aria-labelledby="today-title" className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 lg:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3 mb-6">
          <div>
            <h3 id="today-title" className="text-lg font-semibold text-white">Today in the rooms</h3>
            <p className="text-sm text-zinc-400">
              {now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })} · {todayBookings.length} confirmed{' '}
              {todayBookings.length === 1 ? 'session' : 'sessions'}
            </p>
          </div>
          <div className="relative">
            <select
              aria-label="Show studio"
              value={selectedStudio}
              onChange={(e) => setSelectedStudio(e.target.value)}
              className={`${field} appearance-none pr-7 cursor-pointer`}
            >
              <option value="all" className="bg-zinc-900">All studios</option>
              {STUDIOS.map((s) => (
                <option key={s} value={s} className="bg-zinc-900">{s}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-400 pointer-events-none" />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto -mx-1 px-1">
            <div className="min-w-[640px]">
              {/* Hour scale */}
              <div className="relative h-5 ml-24 mb-2">
                {hourMarks.map((h) => (
                  <span
                    key={h}
                    className="absolute -translate-x-1/2 text-[11px] text-zinc-500 tabular-nums"
                    style={{ left: pos(h) }}
                  >
                    {hourLabel(h)}
                  </span>
                ))}
              </div>

              <div className="space-y-2">
                {STUDIOS.filter((s) => selectedStudio === 'all' || s === selectedStudio).map((studio) => (
                  <div key={studio} className="flex items-center gap-0">
                    <span className="w-24 shrink-0 text-sm font-medium text-zinc-300">{studio}</span>
                    <div className="relative flex-1 h-12 rounded-lg bg-white/[0.03] border border-white/[0.06] overflow-hidden">
                      {hourMarks.slice(1, -1).map((h) => (
                        <span key={h} aria-hidden="true" className="absolute top-0 bottom-0 w-px bg-white/[0.05]" style={{ left: pos(h) }} />
                      ))}
                      {(bookingsByStudio[studio] || []).map((b) => (
                        <button
                          key={b.id}
                          onClick={() => setSelectedBooking(b)}
                          title={`${formatTime(b.start_time)} – ${formatTime(b.end_time)} · ${b.name || 'Guest'}`}
                          className={`absolute top-1 bottom-1 rounded-md px-2 text-left overflow-hidden transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${studioBlock[studio]}`}
                          style={{
                            left: pos(toHours(b.start_time)),
                            width: `calc(${((toHours(b.end_time) - toHours(b.start_time)) / span) * 100}% - 2px)`,
                          }}
                        >
                          <span className="block text-xs font-semibold truncate leading-tight mt-1">{b.name || 'Guest'}</span>
                          <span className="block text-[11px] truncate opacity-75 tabular-nums">{formatTime(b.start_time)}</span>
                        </button>
                      ))}
                      {nowH >= dayStart && nowH <= dayEnd && (
                        <span aria-hidden="true" className="absolute top-0 bottom-0 w-0.5 bg-red-400 z-10" style={{ left: pos(nowH) }} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {todayBookings.length === 0 && (
              <p className="mt-4 text-sm text-zinc-400">No confirmed sessions today. All three rooms are free.</p>
            )}
          </div>
        )}
      </section>

      <div className="grid xl:grid-cols-3 gap-8">
        {/* Recent bookings */}
        <section aria-labelledby="recent-title" className="xl:col-span-2 rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 lg:px-6 py-4 border-b border-white/10">
            <h3 id="recent-title" className="text-lg font-semibold text-white">Recent bookings</h3>
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-zinc-500" />
              <select
                aria-label="Sort by"
                value={sortField}
                onChange={(e) => setSortField(e.target.value as SortField)}
                className={`${field} cursor-pointer`}
              >
                <option value="date" className="bg-zinc-900">Date</option>
                <option value="status" className="bg-zinc-900">Status</option>
                <option value="studio" className="bg-zinc-900">Studio</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className={`${field} hover:bg-white/10`}
              >
                {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
              </button>
            </div>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
            </div>
          ) : sortedRecentBookings.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-zinc-400">No bookings match these filters.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">
                    <th scope="col" className="px-5 lg:px-6 py-3 font-medium">Customer</th>
                    <th scope="col" className="px-3 py-3 font-medium">Studio</th>
                    <th scope="col" className="px-3 py-3 font-medium">Date</th>
                    <th scope="col" className="px-3 py-3 font-medium">Time</th>
                    <th scope="col" className="px-5 lg:px-6 py-3 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {sortedRecentBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-white/[0.03]">
                      <td className="px-5 lg:px-6 py-3">
                        <span className="block text-white font-medium">{booking.name || 'Guest'}</span>
                        <span className="block text-xs text-zinc-500 tabular-nums">{booking.phone_number}</span>
                      </td>
                      <td className="px-3 py-3 text-zinc-300 whitespace-nowrap">{booking.studio}</td>
                      <td className="px-3 py-3 text-zinc-300 whitespace-nowrap tabular-nums">
                        {new Date(`${booking.date}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </td>
                      <td className="px-3 py-3 text-zinc-300 whitespace-nowrap tabular-nums">
                        {formatTime(booking.start_time)} – {formatTime(booking.end_time)}
                      </td>
                      <td className="px-5 lg:px-6 py-3 text-right">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium capitalize ${statusPill[booking.status] || statusPill.pending}`}>
                          {booking.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Shortcuts */}
        <section aria-labelledby="shortcuts-title" className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 lg:p-6">
          <h3 id="shortcuts-title" className="text-lg font-semibold text-white mb-4">Shortcuts</h3>
          <ul className="divide-y divide-white/[0.06]">
            {[
              { href: '/admin/bookings', icon: Calendar, title: 'All bookings', desc: 'Search, edit and cancel' },
              { href: '/admin/availability', icon: Clock, title: 'Availability', desc: 'Block or open time slots' },
              { href: '/admin/settings', icon: TrendingUp, title: 'Settings', desc: 'Hours and booking rules' },
            ].map((a) => (
              <li key={a.href}>
                <a href={a.href} className="group flex items-center gap-3 py-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 rounded">
                  <span className="w-9 h-9 rounded-lg bg-white/[0.05] flex items-center justify-center">
                    <a.icon className="w-4 h-4 text-violet-400" />
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm text-white font-medium">{a.title}</span>
                    <span className="block text-xs text-zinc-500">{a.desc}</span>
                  </span>
                  <span className="text-zinc-500 group-hover:text-violet-400 transition-colors">→</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Booking details */}
      {selectedBooking && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedBooking(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-detail-title"
            className="bg-zinc-900 border border-white/10 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between p-5 border-b border-white/10">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-violet-400 mb-1">{selectedBooking.studio}</p>
                <h3 id="booking-detail-title" className="text-xl font-bold text-white tabular-nums">
                  {formatTime(selectedBooking.start_time)} – {formatTime(selectedBooking.end_time)}
                </h3>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                aria-label="Close"
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>
            <dl className="divide-y divide-white/[0.06] px-5">
              {[
                { icon: User, label: 'Customer', value: selectedBooking.name || 'N/A' },
                { icon: Phone, label: 'Phone', value: selectedBooking.phone_number || 'N/A' },
                { icon: FileText, label: 'Session', value: selectedBooking.session_type || 'N/A' },
                ...(selectedBooking.total_amount
                  ? [{ icon: IndianRupee, label: 'Amount', value: `₹${selectedBooking.total_amount.toLocaleString('en-IN')}` }]
                  : []),
              ].map((row) => (
                <div key={row.label} className="flex items-center gap-3 py-3.5">
                  <row.icon className="w-4 h-4 text-zinc-500" />
                  <dt className="text-sm text-zinc-400 w-20">{row.label}</dt>
                  <dd className="text-sm text-white font-medium">{row.value}</dd>
                </div>
              ))}
            </dl>
            {selectedBooking.phone_number && (
              <div className="p-5 pt-2">
                <a
                  href={`tel:${selectedBooking.phone_number}`}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-violet-400 hover:bg-violet-300 text-navy text-sm font-semibold transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  Call customer
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
