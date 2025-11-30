'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Search,
  Eye,
  X,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Phone,
  User,
  MapPin,
  AlertCircle,
  Ban,
  UserX,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { getSession } from '@/lib/supabaseAuth';

interface Booking {
  id: string;
  phone_number: string;
  name: string | null;
  studio: string;
  session_type: string | null;
  group_size: number;
  date: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  total_amount: number | null;
  notes: string | null;
  created_at: string;
}

// Helper function to check if a booking's time has passed
const isBookingTimePassed = (date: string, endTime: string): boolean => {
  const now = new Date();
  const bookingDate = new Date(date);
  const [hours, minutes] = endTime.split(':').map(Number);
  
  // Set the booking end datetime
  bookingDate.setHours(hours, minutes, 0, 0);
  
  return now > bookingDate;
};

// Get effective status - if time has passed and booking is confirmed/pending, treat as needing completion
const getEffectiveStatus = (booking: Booking): Booking['status'] | 'needs_completion' => {
  if ((booking.status === 'confirmed' || booking.status === 'pending') && 
      isBookingTimePassed(booking.date, booking.end_time)) {
    return 'needs_completion';
  }
  return booking.status;
};

export default function BookingsManagementPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getAccessToken();
      const response = await fetch('/api/admin/bookings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings || []);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const updateBookingStatus = async (bookingId: string, newStatus: string, closeModal = true) => {
    setUpdating(true);
    setMessage(null);

    try {
      const token = await getAccessToken();
      const response = await fetch('/api/admin/bookings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: bookingId, status: newStatus }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({ type: 'success', text: `Booking ${newStatus} successfully!` });
        // Update local state
        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus as Booking['status'] } : b))
        );
        if (selectedBooking?.id === bookingId) {
          setSelectedBooking({ ...selectedBooking, status: newStatus as Booking['status'] });
        }
        if (closeModal) {
          setTimeout(() => setSelectedBooking(null), 1000);
        }
      } else {
        throw new Error(data.error || 'Failed to update booking');
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setUpdating(false);
    }
  };

  const handleConfirm = (bookingId: string) => updateBookingStatus(bookingId, 'confirmed');
  const handleCancel = (bookingId: string) => {
    if (confirm('Are you sure you want to cancel this booking?')) {
      updateBookingStatus(bookingId, 'cancelled');
    }
  };
  const handleComplete = (bookingId: string) => updateBookingStatus(bookingId, 'completed');
  const handleNoShow = (bookingId: string) => {
    if (confirm('Mark this booking as No Show?')) {
      updateBookingStatus(bookingId, 'no_show');
    }
  };
  const handleRestore = (bookingId: string) => updateBookingStatus(bookingId, 'confirmed');
  
  const handleDelete = async (bookingId: string) => {
    if (!confirm('Are you sure you want to permanently delete this booking? This action cannot be undone.')) {
      return;
    }

    setUpdating(true);
    setMessage(null);

    try {
      const token = await getAccessToken();
      const response = await fetch(`/api/admin/bookings?id=${bookingId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({ type: 'success', text: 'Booking deleted permanently!' });
        // Remove from local state
        setBookings((prev) => prev.filter((b) => b.id !== bookingId));
        setTimeout(() => setSelectedBooking(null), 1000);
      } else {
        throw new Error(data.error || 'Failed to delete booking');
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setUpdating(false);
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.phone_number.includes(searchTerm) ||
      booking.studio.toLowerCase().includes(searchTerm.toLowerCase());
    
    const effectiveStatus = getEffectiveStatus(booking);
    const matchesStatus =
      statusFilter === 'all' || 
      booking.status === statusFilter ||
      (statusFilter === 'needs_completion' && effectiveStatus === 'needs_completion');
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-emerald-500/20 text-emerald-400';
      case 'pending':
        return 'bg-amber-500/20 text-amber-400';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400';
      case 'completed':
        return 'bg-blue-500/20 text-blue-400';
      case 'no_show':
        return 'bg-zinc-500/20 text-zinc-400';
      case 'needs_completion':
        return 'bg-orange-500/20 text-orange-400';
      default:
        return 'bg-zinc-500/20 text-zinc-400';
    }
  };

  const getStatusLabel = (status: string) => {
    if (status === 'needs_completion') {
      return 'Needs Action';
    }
    return status.replace('_', ' ');
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5); // Returns "HH:MM" format (24-hour)
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Bookings</h1>
          <p className="text-zinc-400 mt-1">View and manage all bookings</p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass rounded-2xl p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 min-w-0 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, phone, or studio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 pl-12 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
            />
          </div>
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="select"
            >
              <option value="all">All Status</option>
              <option value="needs_completion">Needs Action</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="no_show">No Show</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="glass rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400">No bookings found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-zinc-400">
                    Customer
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-zinc-400">
                    Studio
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-zinc-400">
                    Date & Time
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-zinc-400">
                    Amount
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-zinc-400">
                    Status
                  </th>
                  <th className="text-right p-4 text-sm font-medium text-zinc-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredBookings.map((booking) => (
                  <motion.tr
                    key={booking.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="p-4">
                      <div>
                        <p className="text-white font-medium">
                          {booking.name || 'N/A'}
                        </p>
                        <p className="text-zinc-500 text-sm">
                          {booking.phone_number}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="text-white">{booking.studio}</p>
                        <p className="text-zinc-500 text-sm">
                          {booking.session_type}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="text-white">{formatDate(booking.date)}</p>
                        <p className="text-zinc-500 text-sm">
                          {formatTime(booking.start_time)} -{' '}
                          {formatTime(booking.end_time)}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-white">
                        {booking.total_amount
                          ? `₹${booking.total_amount.toLocaleString()}`
                          : 'N/A'}
                      </p>
                    </td>
                    <td className="p-4">
                      {(() => {
                        const effectiveStatus = getEffectiveStatus(booking);
                        return (
                          <span
                            className={`px-3 py-1 rounded-lg text-xs font-medium capitalize ${getStatusColor(
                              effectiveStatus
                            )}`}
                          >
                            {getStatusLabel(effectiveStatus)}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedBooking(booking)}
                        className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Booking Detail Modal */}
      <AnimatePresence>
        {selectedBooking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedBooking(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg glass rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Booking Details</h2>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Message */}
              <AnimatePresence>
                {message && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`mb-4 p-3 rounded-xl flex items-center gap-2 ${
                      message.type === 'success'
                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                        : 'bg-red-500/10 border border-red-500/20 text-red-400'
                    }`}
                  >
                    {message.type === 'success' ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                    <span className="text-sm">{message.text}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                  <div className="w-12 h-12 rounded-full bg-violet-500/20 flex items-center justify-center">
                    <User className="w-6 h-6 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">
                      {selectedBooking.name || 'N/A'}
                    </p>
                    <p className="text-zinc-400 text-sm flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {selectedBooking.phone_number}
                    </p>
                  </div>
                  {(() => {
                    const effectiveStatus = getEffectiveStatus(selectedBooking);
                    return (
                      <span
                        className={`ml-auto px-3 py-1 rounded-lg text-xs font-medium capitalize ${getStatusColor(
                          effectiveStatus
                        )}`}
                      >
                        {getStatusLabel(effectiveStatus)}
                      </span>
                    );
                  })()}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white/5 rounded-xl">
                    <p className="text-zinc-400 text-sm mb-1">Studio</p>
                    <p className="text-white font-medium flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-violet-400" />
                      {selectedBooking.studio}
                    </p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl">
                    <p className="text-zinc-400 text-sm mb-1">Session Type</p>
                    <p className="text-white font-medium">
                      {selectedBooking.session_type || 'N/A'}
                    </p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl">
                    <p className="text-zinc-400 text-sm mb-1">Date</p>
                    <p className="text-white font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-violet-400" />
                      {formatDate(selectedBooking.date)}
                    </p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl">
                    <p className="text-zinc-400 text-sm mb-1">Time</p>
                    <p className="text-white font-medium flex items-center gap-2">
                      <Clock className="w-4 h-4 text-violet-400" />
                      {formatTime(selectedBooking.start_time)} -{' '}
                      {formatTime(selectedBooking.end_time)}
                    </p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl">
                    <p className="text-zinc-400 text-sm mb-1">Group Size</p>
                    <p className="text-white font-medium">
                      {selectedBooking.group_size}{' '}
                      {selectedBooking.group_size === 1 ? 'person' : 'people'}
                    </p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl">
                    <p className="text-zinc-400 text-sm mb-1">Amount</p>
                    <p className="text-white font-medium">
                      {selectedBooking.total_amount
                        ? `₹${selectedBooking.total_amount.toLocaleString()}`
                        : 'N/A'}
                    </p>
                  </div>
                </div>

                {selectedBooking.notes && (
                  <div className="p-4 bg-white/5 rounded-xl">
                    <p className="text-zinc-400 text-sm mb-1">Notes</p>
                    <p className="text-white">{selectedBooking.notes}</p>
                  </div>
                )}

                {/* Action Buttons based on status */}
                <div className="pt-4 border-t border-white/10">
                  <p className="text-zinc-400 text-sm mb-3">Actions</p>
                  <div className="flex flex-wrap gap-2">
                    {/* Pending bookings (time not passed) */}
                    {selectedBooking.status === 'pending' && !isBookingTimePassed(selectedBooking.date, selectedBooking.end_time) && (
                      <>
                        <button
                          onClick={() => handleConfirm(selectedBooking.id)}
                          disabled={updating}
                          className="flex-1 btn-primary flex items-center justify-center gap-2 py-3 disabled:opacity-50"
                        >
                          {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                          Confirm
                        </button>
                        <button
                          onClick={() => handleCancel(selectedBooking.id)}
                          disabled={updating}
                          className="flex-1 py-3 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                          Cancel
                        </button>
                      </>
                    )}

                    {/* Confirmed bookings (time not passed) */}
                    {selectedBooking.status === 'confirmed' && !isBookingTimePassed(selectedBooking.date, selectedBooking.end_time) && (
                      <>
                        <button
                          onClick={() => handleComplete(selectedBooking.id)}
                          disabled={updating}
                          className="flex-1 py-3 rounded-xl bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                          Mark Complete
                        </button>
                        <button
                          onClick={() => handleNoShow(selectedBooking.id)}
                          disabled={updating}
                          className="flex-1 py-3 rounded-xl bg-zinc-500/20 text-zinc-400 hover:bg-zinc-500/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserX className="w-4 h-4" />}
                          No Show
                        </button>
                        <button
                          onClick={() => handleCancel(selectedBooking.id)}
                          disabled={updating}
                          className="flex-1 py-3 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                          Cancel
                        </button>
                      </>
                    )}

                    {/* Bookings where time has passed (needs completion) - pending or confirmed */}
                    {(selectedBooking.status === 'pending' || selectedBooking.status === 'confirmed') && 
                     isBookingTimePassed(selectedBooking.date, selectedBooking.end_time) && (
                      <>
                        <p className="w-full text-orange-400 text-sm mb-2 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          Session time has passed. Please update the status.
                        </p>
                        <button
                          onClick={() => handleComplete(selectedBooking.id)}
                          disabled={updating}
                          className="flex-1 py-3 rounded-xl bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                          Mark Complete
                        </button>
                        <button
                          onClick={() => handleNoShow(selectedBooking.id)}
                          disabled={updating}
                          className="flex-1 py-3 rounded-xl bg-zinc-500/20 text-zinc-400 hover:bg-zinc-500/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserX className="w-4 h-4" />}
                          No Show
                        </button>
                        <button
                          onClick={() => handleCancel(selectedBooking.id)}
                          disabled={updating}
                          className="flex-1 py-3 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                          Cancel
                        </button>
                      </>
                    )}

                    {/* Cancelled or No Show bookings - can restore or delete */}
                    {(selectedBooking.status === 'cancelled' || selectedBooking.status === 'no_show') && (
                      <>
                        <button
                          onClick={() => handleRestore(selectedBooking.id)}
                          disabled={updating}
                          className="flex-1 py-3 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                          Restore
                        </button>
                        <button
                          onClick={() => handleDelete(selectedBooking.id)}
                          disabled={updating}
                          className="flex-1 py-3 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          Delete Permanently
                        </button>
                      </>
                    )}

                    {/* Completed bookings - can mark as no show, not complete, or cancel */}
                    {selectedBooking.status === 'completed' && (
                      <>
                        <button
                          onClick={() => handleRestore(selectedBooking.id)}
                          disabled={updating}
                          className="flex-1 py-3 rounded-xl bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                          Not Complete
                        </button>
                        <button
                          onClick={() => handleNoShow(selectedBooking.id)}
                          disabled={updating}
                          className="flex-1 py-3 rounded-xl bg-zinc-500/20 text-zinc-400 hover:bg-zinc-500/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserX className="w-4 h-4" />}
                          No Show
                        </button>
                        <button
                          onClick={() => handleCancel(selectedBooking.id)}
                          disabled={updating}
                          className="flex-1 py-3 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
