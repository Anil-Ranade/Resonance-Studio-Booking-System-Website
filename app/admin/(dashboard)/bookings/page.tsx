'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
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
  Plus,
  Music,
  Mic,
  Drum,
  Guitar,
  Radio,
  Users,
  Mail,
  FileText,
} from 'lucide-react';
import { getSession } from '@/lib/supabaseAuth';
import { getStudioSuggestion, getStudioRate } from '@/app/booking/utils/studioSuggestion';
import type { SessionType, KaraokeOption, LiveMusicianOption, BandEquipment, RecordingOption, StudioName } from '@/app/booking/contexts/BookingContext';

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

interface BookingFormData {
  phone: string;
  name: string;
  email: string;
  studio: string;
  session_type: string;
  session_details: string;
  date: string;
  start_time: string;
  end_time: string;
  rate_per_hour: number;
  notes: string;
  send_notification: boolean;
  // Sub-options
  karaoke_option: KaraokeOption | '';
  live_option: LiveMusicianOption | '';
  band_equipment: BandEquipment[];
  recording_option: RecordingOption | '';
}

// Session types matching the app (no Walk-in, as we now have proper flow)
const SESSION_TYPES: { value: SessionType | 'Walk-in'; label: string; icon: React.ComponentType<{className?: string}>; description: string }[] = [
  { value: 'Karaoke', label: 'Karaoke', icon: Mic, description: 'Sing along with friends' },
  { value: 'Live with musicians', label: 'Live with Musicians', icon: Music, description: 'Live performance' },
  { value: 'Only Drum Practice', label: 'Only Drum Practice', icon: Drum, description: 'Drum practice only' },
  { value: 'Band', label: 'Band', icon: Guitar, description: 'Full band rehearsal' },
  { value: 'Recording', label: 'Recording', icon: Radio, description: 'Professional recording' },
  { value: 'Walk-in', label: 'Walk-in', icon: Users, description: 'Walk-in customer' },
];

// Sub-options for each session type
const KARAOKE_OPTIONS: { value: KaraokeOption; label: string }[] = [
  { value: '1_5', label: '1-5 Participants' },
  { value: '6_10', label: '6-10 Participants' },
  { value: '11_20', label: '11-20 Participants' },
  { value: '21_30', label: '21-30 Participants' },
];

const LIVE_OPTIONS: { value: LiveMusicianOption; label: string }[] = [
  { value: '1_2', label: '1-2 Musicians' },
  { value: '3_4', label: '3-4 Musicians' },
  { value: '5', label: '5 Musicians' },
  { value: '6_8', label: '6-8 Musicians' },
  { value: '9_12', label: '9-12 Musicians' },
];

const BAND_EQUIPMENT_OPTIONS: { value: BandEquipment; label: string }[] = [
  { value: 'drum', label: 'Drum' },
  { value: 'amps', label: 'Amps' },
  { value: 'guitars', label: 'Guitars' },
  { value: 'keyboard', label: 'Keyboard' },
];

const RECORDING_OPTIONS: { value: RecordingOption; label: string }[] = [
  { value: 'audio_recording', label: 'Audio Recording' },
  { value: 'video_recording', label: 'Video Recording' },
  { value: 'chroma_key', label: 'Chroma Key (Green Screen)' },
];

const STUDIOS: StudioName[] = ['Studio A', 'Studio B', 'Studio C'];

// Helper function to check if a booking's time has passed
const isBookingTimePassed = (date: string, endTime: string): boolean => {
  const now = new Date();
  const bookingDate = new Date(date);
  const [hours, minutes] = endTime.split(':').map(Number);
  
  // Set the booking end datetime
  bookingDate.setHours(hours, minutes, 0, 0);
  
  return now > bookingDate;
};

// Get effective status - if time has passed and booking is confirmed, treat as completed
const getEffectiveStatus = (booking: Booking): Booking['status'] => {
  if (booking.status === 'confirmed' && isBookingTimePassed(booking.date, booking.end_time)) {
    return 'completed';
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
  
  // New booking form states
  const [showNewBookingModal, setShowNewBookingModal] = useState(false);
  const [creatingBooking, setCreatingBooking] = useState(false);
  const [bookingFormData, setBookingFormData] = useState<BookingFormData>({
    phone: '',
    name: '',
    email: '',
    studio: 'Studio A',
    session_type: 'Walk-in',
    session_details: '',
    date: new Date().toISOString().split('T')[0],
    start_time: '10:00',
    end_time: '11:00',
    rate_per_hour: 400,
    notes: '',
    send_notification: true,
    karaoke_option: '',
    live_option: '',
    band_equipment: [],
    recording_option: '',
  });

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

  // Reset booking form
  const resetBookingForm = () => {
    setBookingFormData({
      phone: '',
      name: '',
      email: '',
      studio: 'Studio A',
      session_type: 'Walk-in',
      session_details: '',
      date: new Date().toISOString().split('T')[0],
      start_time: '10:00',
      end_time: '11:00',
      rate_per_hour: 400,
      notes: '',
      send_notification: true,
      karaoke_option: '',
      live_option: '',
      band_equipment: [],
      recording_option: '',
    });
    setMessage(null);
  };

  // Helper to update studio and rate based on session type and sub-options
  const updateStudioAndRate = (
    sessionType: string,
    karaokeOption: KaraokeOption | '',
    liveOption: LiveMusicianOption | '',
    bandEquipment: BandEquipment[],
    recordingOption: RecordingOption | '',
    currentStudio: string
  ) => {
    // Get studio suggestion based on session type and options
    const suggestion = getStudioSuggestion(sessionType as SessionType, {
      karaokeOption: karaokeOption || undefined,
      liveOption: liveOption || undefined,
      bandEquipment: bandEquipment.length > 0 ? bandEquipment : undefined,
      recordingOption: recordingOption || undefined,
    });

    // Use recommended studio or current if still allowed
    const newStudio = suggestion.allowedStudios.includes(currentStudio as StudioName) 
      ? currentStudio as StudioName
      : suggestion.recommendedStudio;

    // Calculate rate
    const rate = getStudioRate(newStudio, sessionType as SessionType, {
      karaokeOption: karaokeOption || undefined,
      liveOption: liveOption || undefined,
      bandEquipment: bandEquipment.length > 0 ? bandEquipment : undefined,
      recordingOption: recordingOption || undefined,
    });

    return { studio: newStudio, rate, allowedStudios: suggestion.allowedStudios };
  };

  // Handler for session type change
  const handleSessionTypeChange = (newSessionType: string) => {
    // Reset sub-options when session type changes
    const updates: Partial<BookingFormData> = {
      session_type: newSessionType,
      karaoke_option: '',
      live_option: '',
      band_equipment: [],
      recording_option: '',
      session_details: '',
    };

    // For session types that don't need sub-options, update studio/rate immediately
    if (newSessionType === 'Only Drum Practice' || newSessionType === 'Walk-in') {
      const { studio, rate } = updateStudioAndRate(
        newSessionType, '', '', [], '', bookingFormData.studio
      );
      updates.studio = studio;
      updates.rate_per_hour = newSessionType === 'Walk-in' ? 400 : rate;
      updates.session_details = newSessionType === 'Only Drum Practice' ? 'Drum Practice' : 'Walk-in';
    }

    setBookingFormData(prev => ({ ...prev, ...updates }));
  };

  // Handler for sub-option changes
  const handleSubOptionChange = (
    type: 'karaoke' | 'live' | 'band' | 'recording',
    value: string | BandEquipment[]
  ) => {
    let updates: Partial<BookingFormData> = {};
    let newKaraokeOption = bookingFormData.karaoke_option;
    let newLiveOption = bookingFormData.live_option;
    let newBandEquipment = bookingFormData.band_equipment;
    let newRecordingOption = bookingFormData.recording_option;
    let sessionDetails = '';

    if (type === 'karaoke') {
      newKaraokeOption = value as KaraokeOption;
      updates.karaoke_option = newKaraokeOption;
      const option = KARAOKE_OPTIONS.find(o => o.value === value);
      sessionDetails = option?.label || '';
    } else if (type === 'live') {
      newLiveOption = value as LiveMusicianOption;
      updates.live_option = newLiveOption;
      const option = LIVE_OPTIONS.find(o => o.value === value);
      sessionDetails = option?.label || '';
    } else if (type === 'band') {
      newBandEquipment = value as BandEquipment[];
      updates.band_equipment = newBandEquipment;
      sessionDetails = newBandEquipment.map(e => {
        const option = BAND_EQUIPMENT_OPTIONS.find(o => o.value === e);
        return option?.label || e;
      }).join(', ');
    } else if (type === 'recording') {
      newRecordingOption = value as RecordingOption;
      updates.recording_option = newRecordingOption;
      const option = RECORDING_OPTIONS.find(o => o.value === value);
      sessionDetails = option?.label || '';
    }

    updates.session_details = sessionDetails;

    // Update studio and rate
    const { studio, rate } = updateStudioAndRate(
      bookingFormData.session_type,
      newKaraokeOption,
      newLiveOption,
      newBandEquipment,
      newRecordingOption,
      bookingFormData.studio
    );
    updates.studio = studio;
    updates.rate_per_hour = rate;

    setBookingFormData(prev => ({ ...prev, ...updates }));
  };

  // Track allowed studios based on current selection
  const getAllowedStudios = (): StudioName[] => {
    const { session_type, karaoke_option, live_option, band_equipment, recording_option } = bookingFormData;
    if (!session_type || session_type === 'Walk-in') {
      return STUDIOS;
    }
    const suggestion = getStudioSuggestion(session_type as SessionType, {
      karaokeOption: karaoke_option || undefined,
      liveOption: live_option || undefined,
      bandEquipment: band_equipment.length > 0 ? band_equipment : undefined,
      recordingOption: recording_option || undefined,
    });
    return suggestion.allowedStudios;
  };

  // Handler for studio change - update rate
  const handleStudioChange = (newStudio: string) => {
    const rate = getStudioRate(newStudio as StudioName, bookingFormData.session_type as SessionType, {
      karaokeOption: bookingFormData.karaoke_option || undefined,
      liveOption: bookingFormData.live_option || undefined,
      bandEquipment: bookingFormData.band_equipment.length > 0 ? bookingFormData.band_equipment : undefined,
      recordingOption: bookingFormData.recording_option || undefined,
    });
    setBookingFormData(prev => ({ ...prev, studio: newStudio, rate_per_hour: rate }));
  };

  // Handle create new booking
  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingBooking(true);
    setMessage(null);

    try {
      const token = await getAccessToken();
      const response = await fetch('/api/admin/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          phone: bookingFormData.phone,
          name: bookingFormData.name || undefined,
          email: bookingFormData.email || undefined,
          studio: bookingFormData.studio,
          session_type: bookingFormData.session_type,
          session_details: bookingFormData.session_details || bookingFormData.session_type,
          date: bookingFormData.date,
          start_time: bookingFormData.start_time,
          end_time: bookingFormData.end_time,
          rate_per_hour: bookingFormData.rate_per_hour,
          notes: bookingFormData.notes || undefined,
          send_notification: bookingFormData.send_notification,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({ type: 'success', text: 'Booking created successfully!' });
        fetchBookings();
        setTimeout(() => {
          setShowNewBookingModal(false);
          resetBookingForm();
        }, 1500);
      } else {
        throw new Error(data.error || data.message || 'Failed to create booking');
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setCreatingBooking(false);
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
      (statusFilter === 'completed' && effectiveStatus === 'completed');
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-emerald-500/20 text-emerald-400';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400';
      case 'completed':
        return 'bg-blue-500/20 text-blue-400';
      case 'no_show':
        return 'bg-zinc-500/20 text-zinc-400';
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
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
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
        <Link
          href="/admin/booking"
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Booking
        </Link>
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
                          ? `₹${booking.total_amount.toLocaleString('en-IN')}`
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
                        ? `₹${selectedBooking.total_amount.toLocaleString('en-IN')}`
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

      {/* New Booking Modal */}
      <AnimatePresence>
        {showNewBookingModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => { setShowNewBookingModal(false); resetBookingForm(); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl glass rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                    <Plus className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Create New Booking</h2>
                    <p className="text-zinc-400 text-sm">Book on behalf of a customer</p>
                  </div>
                </div>
                <button
                  onClick={() => { setShowNewBookingModal(false); resetBookingForm(); }}
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

              <form onSubmit={handleCreateBooking} className="space-y-5">
                {/* Customer Information */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                    <User className="w-4 h-4" /> Customer Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1.5">Phone Number *</label>
                      <input
                        type="tel"
                        required
                        placeholder="10-digit phone"
                        value={bookingFormData.phone}
                        onChange={(e) => setBookingFormData({ ...bookingFormData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                        className="input"
                        maxLength={10}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1.5">Name</label>
                      <input
                        type="text"
                        placeholder="Customer name"
                        value={bookingFormData.name}
                        onChange={(e) => setBookingFormData({ ...bookingFormData, name: e.target.value })}
                        className="input"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm text-zinc-400 mb-1.5">Email (for confirmation)</label>
                      <input
                        type="email"
                        placeholder="customer@email.com"
                        value={bookingFormData.email}
                        onChange={(e) => setBookingFormData({ ...bookingFormData, email: e.target.value })}
                        className="input"
                      />
                    </div>
                  </div>
                </div>

                {/* Session Details */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                    <Music className="w-4 h-4" /> Session Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1.5">Session Type *</label>
                      <select
                        required
                        value={bookingFormData.session_type}
                        onChange={(e) => handleSessionTypeChange(e.target.value)}
                        className="select"
                      >
                        {SESSION_TYPES.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Sub-options based on session type */}
                    {bookingFormData.session_type === 'Karaoke' && (
                      <div>
                        <label className="block text-sm text-zinc-400 mb-1.5">Number of Participants *</label>
                        <select
                          required
                          value={bookingFormData.karaoke_option}
                          onChange={(e) => handleSubOptionChange('karaoke', e.target.value)}
                          className="select"
                        >
                          <option value="">Select participants</option>
                          {KARAOKE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {bookingFormData.session_type === 'Live with musicians' && (
                      <div>
                        <label className="block text-sm text-zinc-400 mb-1.5">Number of Musicians *</label>
                        <select
                          required
                          value={bookingFormData.live_option}
                          onChange={(e) => handleSubOptionChange('live', e.target.value)}
                          className="select"
                        >
                          <option value="">Select musicians</option>
                          {LIVE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {bookingFormData.session_type === 'Band' && (
                      <div>
                        <label className="block text-sm text-zinc-400 mb-1.5">Equipment Needed *</label>
                        <div className="flex flex-wrap gap-2 p-3 bg-white/5 border border-white/10 rounded-xl">
                          {BAND_EQUIPMENT_OPTIONS.map((opt) => (
                            <label
                              key={opt.value}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                                bookingFormData.band_equipment.includes(opt.value)
                                  ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                                  : 'bg-white/5 text-zinc-400 border border-white/10 hover:bg-white/10'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={bookingFormData.band_equipment.includes(opt.value)}
                                onChange={(e) => {
                                  const newEquipment = e.target.checked
                                    ? [...bookingFormData.band_equipment, opt.value]
                                    : bookingFormData.band_equipment.filter(eq => eq !== opt.value);
                                  handleSubOptionChange('band', newEquipment);
                                }}
                                className="sr-only"
                              />
                              {opt.label}
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {bookingFormData.session_type === 'Recording' && (
                      <div>
                        <label className="block text-sm text-zinc-400 mb-1.5">Recording Type *</label>
                        <select
                          required
                          value={bookingFormData.recording_option}
                          onChange={(e) => handleSubOptionChange('recording', e.target.value)}
                          className="select"
                        >
                          <option value="">Select recording type</option>
                          {RECORDING_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Studio - shows allowed based on selection */}
                    <div className={bookingFormData.session_type === 'Band' ? 'sm:col-span-2' : ''}>
                      <label className="block text-sm text-zinc-400 mb-1.5">
                        Studio * {getAllowedStudios().length < 3 && (
                          <span className="text-xs text-violet-400 ml-2">
                            (Limited based on selection)
                          </span>
                        )}
                      </label>
                      <select
                        required
                        value={bookingFormData.studio}
                        onChange={(e) => handleStudioChange(e.target.value)}
                        className="select"
                      >
                        {STUDIOS.map((studio) => {
                          const isAllowed = getAllowedStudios().includes(studio);
                          return (
                            <option key={studio} value={studio} disabled={!isAllowed}>
                              {studio} {!isAllowed && '(Not available)'}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* Rate Display */}
                    <div className={bookingFormData.session_type === 'Only Drum Practice' || bookingFormData.session_type === 'Walk-in' ? '' : 'sm:col-span-2'}>
                      <label className="block text-sm text-zinc-400 mb-1.5">Rate per Hour</label>
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                        <span className="text-lg font-bold text-emerald-400">
                          ₹{bookingFormData.rate_per_hour.toLocaleString('en-IN')}/hr
                        </span>
                        <span className="text-zinc-500 text-sm ml-2">(Auto-calculated)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Date & Time
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1.5">Date *</label>
                      <input
                        type="date"
                        required
                        value={bookingFormData.date}
                        onChange={(e) => setBookingFormData({ ...bookingFormData, date: e.target.value })}
                        className="input"
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1.5">Start Time *</label>
                      <input
                        type="time"
                        required
                        value={bookingFormData.start_time}
                        onChange={(e) => setBookingFormData({ ...bookingFormData, start_time: e.target.value })}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1.5">End Time *</label>
                      <input
                        type="time"
                        required
                        value={bookingFormData.end_time}
                        onChange={(e) => setBookingFormData({ ...bookingFormData, end_time: e.target.value })}
                        className="input"
                      />
                    </div>
                  </div>
                </div>

                {/* Pricing & Notes */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Pricing & Notes
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1.5">Rate per Hour (₹)</label>
                      <input
                        type="number"
                        placeholder="e.g., 400"
                        value={bookingFormData.rate_per_hour}
                        onChange={(e) => setBookingFormData({ ...bookingFormData, rate_per_hour: parseInt(e.target.value) || 0 })}
                        className="input"
                        min={0}
                      />
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-2 cursor-pointer p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                        <input
                          type="checkbox"
                          checked={bookingFormData.send_notification}
                          onChange={(e) => setBookingFormData({ ...bookingFormData, send_notification: e.target.checked })}
                          className="w-4 h-4 rounded border-zinc-600 text-violet-500 focus:ring-violet-500 bg-zinc-800"
                        />
                        <span className="text-sm text-zinc-300">Send email notification</span>
                      </label>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm text-zinc-400 mb-1.5">Notes</label>
                      <textarea
                        placeholder="Additional notes..."
                        value={bookingFormData.notes}
                        onChange={(e) => setBookingFormData({ ...bookingFormData, notes: e.target.value })}
                        className="input min-h-[80px] resize-none"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => { setShowNewBookingModal(false); resetBookingForm(); }}
                    className="flex-1 py-3 rounded-xl border border-zinc-600 text-zinc-400 hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingBooking || !bookingFormData.phone || bookingFormData.phone.length !== 10}
                    className="flex-1 btn-primary flex items-center justify-center gap-2 py-3 disabled:opacity-50"
                  >
                    {creatingBooking ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <CheckCircle className="w-5 h-5" />
                    )}
                    {creatingBooking ? 'Creating...' : 'Create Booking'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
