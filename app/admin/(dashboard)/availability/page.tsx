'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Save,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  Copy,
  User,
  Phone,
} from 'lucide-react';
import { getSession } from '@/lib/supabaseAuth';

interface SlotBooking {
  id: string;
  name: string | null;
  whatsapp_number: string;
  start_time: string;
  end_time: string;
  status: string;
  session_type: string | null;
}

interface AvailabilitySlot {
  id: string;
  studio: string;
  date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  created_at: string;
  bookings?: SlotBooking[];
}

interface SlotFormData {
  studio: string;
  date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

const studios = ['Studio A', 'Studio B', 'Studio C'];
const timeOptions = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
  '20:00', '21:00', '22:00',
];

export default function AvailabilityManagementPage() {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudio, setSelectedStudio] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek.toISOString().split('T')[0];
  });

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<AvailabilitySlot | null>(null);
  const [formData, setFormData] = useState<SlotFormData>({
    studio: 'Studio A',
    date: new Date().toISOString().split('T')[0],
    start_time: '08:00',
    end_time: '22:00',
    is_available: true,
  });

  // Bulk add states
  const [bulkDates, setBulkDates] = useState<string[]>([]);
  const [bulkFormData, setBulkFormData] = useState({
    studio: 'Studio A',
    start_time: '08:00',
    end_time: '22:00',
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Helper to get the current access token
  const getAccessToken = useCallback(async (): Promise<string | null> => {
    try {
      const session = await getSession();
      if (session?.access_token) {
        // Update localStorage with fresh token
        localStorage.setItem('accessToken', session.access_token);
        return session.access_token;
      }
      return localStorage.getItem('accessToken');
    } catch {
      return localStorage.getItem('accessToken');
    }
  }, []);

  // Fetch slots with bookings
  const fetchSlots = async () => {
    setLoading(true);
    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error('Not authenticated. Please log in again.');
      }
      
      const params = new URLSearchParams();
      if (selectedStudio !== 'all') params.set('studio', selectedStudio);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const response = await fetch(`/api/admin/availability/with-bookings?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (response.ok) {
        setSlots(data.slots || []);
      } else {
        throw new Error(data.error || `Failed to fetch slots (${response.status})`);
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load availability slots';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, [selectedStudio, startDate, endDate]);

  // Create slot
  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const token = await getAccessToken();
      const response = await fetch('/api/admin/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Slot created successfully!' });
        setShowAddModal(false);
        fetchSlots();
        resetForm();
      } else {
        throw new Error(data.error || 'Failed to create slot');
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  // Update slot
  const handleUpdateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlot) return;

    setSaving(true);
    setMessage(null);

    try {
      const token = await getAccessToken();
      const response = await fetch('/api/admin/availability', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: editingSlot.id,
          ...formData,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Slot updated successfully!' });
        setShowEditModal(false);
        setEditingSlot(null);
        fetchSlots();
        resetForm();
      } else {
        throw new Error(data.error || 'Failed to update slot');
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  // Delete slot
  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm('Are you sure you want to delete this slot?')) return;

    try {
      const token = await getAccessToken();
      const response = await fetch(`/api/admin/availability?id=${slotId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Slot deleted successfully!' });
        fetchSlots();
      } else {
        throw new Error('Failed to delete slot');
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  // Bulk create slots
  const handleBulkCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bulkDates.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one date' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const token = await getAccessToken();
      const response = await fetch('/api/admin/availability/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          studio: bulkFormData.studio,
          dates: bulkDates,
          start_time: bulkFormData.start_time,
          end_time: bulkFormData.end_time,
          is_available: true,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: `${data.count} slots created successfully!` });
        setShowBulkModal(false);
        setBulkDates([]);
        fetchSlots();
      } else {
        throw new Error(data.error || 'Failed to create slots');
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  // Toggle date selection for bulk
  const toggleBulkDate = (date: string) => {
    setBulkDates((prev) =>
      prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date]
    );
  };

  // Generate next 14 days for bulk selection
  const getNext14Days = () => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date.toISOString().split('T')[0]);
    }
    return days;
  };

  const resetForm = () => {
    setFormData({
      studio: 'Studio A',
      date: new Date().toISOString().split('T')[0],
      start_time: '08:00',
      end_time: '22:00',
      is_available: true,
    });
  };

  const openEditModal = (slot: AvailabilitySlot) => {
    setEditingSlot(slot);
    setFormData({
      studio: slot.studio,
      date: slot.date,
      start_time: slot.start_time,
      end_time: slot.end_time,
      is_available: slot.is_available,
    });
    setShowEditModal(true);
  };

  // Format time for display
  const formatTime = (time: string) => {
    const [hours] = time.split(':');
    const hour = parseInt(hours, 10);
    if (hour === 0) return '12:00 AM';
    if (hour < 12) return `${hour}:00 AM`;
    if (hour === 12) return '12:00 PM';
    return `${hour - 12}:00 PM`;
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  // Group slots by date for display
  const groupedSlots = slots.reduce((acc, slot) => {
    if (!acc[slot.date]) {
      acc[slot.date] = [];
    }
    acc[slot.date].push(slot);
    return acc;
  }, {} as Record<string, AvailabilitySlot[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Availability Management</h1>
          <p className="text-zinc-400 mt-1">Manage studio availability slots</p>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            onClick={() => setShowBulkModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500/30 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Copy className="w-4 h-4" />
            Bulk Add
          </motion.button>
          <motion.button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-violet-500 text-white rounded-xl hover:bg-violet-600 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-4 h-4" />
            Add Slot
          </motion.button>
        </div>
      </div>

      {/* Message */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-xl flex items-center gap-3 ${
              message.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                : 'bg-red-500/10 border border-red-500/20 text-red-400'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            {message.text}
            <button
              onClick={() => setMessage(null)}
              className="ml-auto hover:opacity-70"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="glass rounded-2xl p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="filter-studio" className="block text-sm text-zinc-400 mb-2.5">Studio</label>
            <select
              id="filter-studio"
              value={selectedStudio}
              onChange={(e) => setSelectedStudio(e.target.value)}
              className="select"
            >
              <option value="all">All Studios</option>
              {studios.map((studio) => (
                <option key={studio} value={studio}>
                  {studio}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="filter-start-date" className="block text-sm text-zinc-400 mb-2.5">Start Date</label>
            <input
              type="date"
              id="filter-start-date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="filter-end-date" className="block text-sm text-zinc-400 mb-2.5">End Date</label>
            <input
              type="date"
              id="filter-end-date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input"
            />
          </div>
        </div>
      </div>

      {/* Slots List */}
      <div className="glass rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
          </div>
        ) : Object.keys(groupedSlots).length === 0 ? (
          <div className="p-12 text-center">
            <Clock className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400">No availability slots found</p>
            <p className="text-zinc-500 text-sm mt-1">
              Add slots using the buttons above
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {Object.entries(groupedSlots)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([date, dateSlots]) => (
                <div key={date} className="p-4">
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-violet-400" />
                    {formatDate(date)}
                  </h3>
                  <div className="grid gap-3">
                    {dateSlots.map((slot) => (
                      <motion.div
                        key={slot.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`p-4 rounded-xl ${
                          slot.is_available
                            ? 'bg-emerald-500/10 border border-emerald-500/20'
                            : 'bg-red-500/10 border border-red-500/20'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div
                              className={`px-3 py-1 rounded-lg text-sm font-medium ${
                                slot.studio === 'Studio A'
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : slot.studio === 'Studio B'
                                  ? 'bg-amber-500/20 text-amber-400'
                                  : 'bg-emerald-500/20 text-emerald-400'
                              }`}
                            >
                              {slot.studio}
                            </div>
                            <div className="flex items-center gap-2 text-zinc-300">
                              <Clock className="w-4 h-4 text-zinc-500" />
                              {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded text-xs ${
                                slot.is_available
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'bg-red-500/20 text-red-400'
                              }`}
                            >
                              {slot.is_available ? 'Available' : 'Blocked'}
                            </span>
                            {slot.bookings && slot.bookings.length > 0 && (
                              <span className="px-2 py-0.5 rounded text-xs bg-violet-500/20 text-violet-400">
                                {slot.bookings.length} booking{slot.bookings.length !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEditModal(slot)}
                              className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteSlot(slot.id)}
                              className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        {/* Show bookings within this slot */}
                        {slot.bookings && slot.bookings.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                            <p className="text-xs text-zinc-500 uppercase tracking-wide">Bookings in this slot:</p>
                            {slot.bookings.map((booking) => (
                              <div
                                key={booking.id}
                                className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center">
                                    <User className="w-4 h-4 text-violet-400" />
                                  </div>
                                  <div>
                                    <p className="text-white text-sm font-medium">
                                      {booking.name || 'Guest'}
                                    </p>
                                    <p className="text-zinc-500 text-xs flex items-center gap-1">
                                      <Phone className="w-3 h-3" />
                                      {booking.whatsapp_number}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-zinc-300 text-sm">
                                    {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                                  </p>
                                  <p className="text-zinc-500 text-xs">
                                    {booking.session_type || 'N/A'}
                                  </p>
                                </div>
                                <span
                                  className={`ml-3 px-2 py-0.5 rounded text-xs ${
                                    booking.status === 'confirmed'
                                      ? 'bg-emerald-500/20 text-emerald-400'
                                      : 'bg-amber-500/20 text-amber-400'
                                  }`}
                                >
                                  {booking.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Add Slot Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md glass rounded-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Add Availability Slot</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreateSlot} className="space-y-4">
                <div>
                  <label htmlFor="add-studio" className="block text-sm text-zinc-400 mb-2.5">Studio</label>
                  <select
                    id="add-studio"
                    value={formData.studio}
                    onChange={(e) =>
                      setFormData({ ...formData, studio: e.target.value })
                    }
                    className="select"
                  >
                    {studios.map((studio) => (
                      <option key={studio} value={studio}>
                        {studio}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="add-date" className="block text-sm text-zinc-400 mb-2.5">Date</label>
                  <input
                    type="date"
                    id="add-date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="input"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="add-start-time" className="block text-sm text-zinc-400 mb-2.5">
                      Start Time
                    </label>
                    <select
                      value={formData.start_time}
                      onChange={(e) =>
                        setFormData({ ...formData, start_time: e.target.value })
                      }
                      className="select"
                    >
                      {timeOptions.map((time) => (
                        <option key={time} value={time}>
                          {formatTime(time)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="add-end-time" className="block text-sm text-zinc-400 mb-2.5">
                      End Time
                    </label>
                    <select
                      id="add-end-time"
                      value={formData.end_time}
                      onChange={(e) =>
                        setFormData({ ...formData, end_time: e.target.value })
                      }
                      className="select"
                    >
                      {timeOptions.map((time) => (
                        <option key={time} value={time}>
                          {formatTime(time)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="is_available"
                    checked={formData.is_available}
                    onChange={(e) =>
                      setFormData({ ...formData, is_available: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-violet-500 focus:ring-violet-500"
                  />
                  <label htmlFor="is_available" className="text-zinc-300">
                    Available for booking
                  </label>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 btn-primary flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Slot Modal */}
      <AnimatePresence>
        {showEditModal && editingSlot && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowEditModal(false);
              setEditingSlot(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md glass rounded-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Edit Availability Slot</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingSlot(null);
                  }}
                  className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleUpdateSlot} className="space-y-4">
                <div>
                  <label htmlFor="edit-studio" className="block text-sm text-zinc-400 mb-2.5">Studio</label>
                  <select
                    id="edit-studio"
                    value={formData.studio}
                    onChange={(e) =>
                      setFormData({ ...formData, studio: e.target.value })
                    }
                    className="select"
                  >
                    {studios.map((studio) => (
                      <option key={studio} value={studio}>
                        {studio}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="edit-date" className="block text-sm text-zinc-400 mb-2.5">Date</label>
                  <input
                    type="date"
                    id="edit-date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="input"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="edit-start-time" className="block text-sm text-zinc-400 mb-2.5">
                      Start Time
                    </label>
                    <select
                      id="edit-start-time"
                      value={formData.start_time}
                      onChange={(e) =>
                        setFormData({ ...formData, start_time: e.target.value })
                      }
                      className="select"
                    >
                      {timeOptions.map((time) => (
                        <option key={time} value={time}>
                          {formatTime(time)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="edit-end-time" className="block text-sm text-zinc-400 mb-2.5">
                      End Time
                    </label>
                    <select
                      id="edit-end-time"
                      value={formData.end_time}
                      onChange={(e) =>
                        setFormData({ ...formData, end_time: e.target.value })
                      }
                      className="select"
                    >
                      {timeOptions.map((time) => (
                        <option key={time} value={time}>
                          {formatTime(time)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="edit_is_available"
                    checked={formData.is_available}
                    onChange={(e) =>
                      setFormData({ ...formData, is_available: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-violet-500 focus:ring-violet-500"
                  />
                  <label htmlFor="edit_is_available" className="text-zinc-300">
                    Available for booking
                  </label>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingSlot(null);
                    }}
                    className="flex-1 btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 btn-primary flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {saving ? 'Saving...' : 'Update'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Add Modal */}
      <AnimatePresence>
        {showBulkModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowBulkModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg glass rounded-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Bulk Add Slots</h2>
                <button
                  onClick={() => setShowBulkModal(false)}
                  className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleBulkCreate} className="space-y-4">
                <div>
                  <label htmlFor="bulk-studio" className="block text-sm text-zinc-400 mb-2.5">Studio</label>
                  <select
                    id="bulk-studio"
                    value={bulkFormData.studio}
                    onChange={(e) =>
                      setBulkFormData({ ...bulkFormData, studio: e.target.value })
                    }
                    className="select"
                  >
                    {studios.map((studio) => (
                      <option key={studio} value={studio}>
                        {studio}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="bulk-start-time" className="block text-sm text-zinc-400 mb-2.5">
                      Start Time
                    </label>
                    <select
                      id="bulk-start-time"
                      value={bulkFormData.start_time}
                      onChange={(e) =>
                        setBulkFormData({
                          ...bulkFormData,
                          start_time: e.target.value,
                        })
                      }
                      className="select"
                    >
                      {timeOptions.map((time) => (
                        <option key={time} value={time}>
                          {formatTime(time)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="bulk-end-time" className="block text-sm text-zinc-400 mb-2.5">
                      End Time
                    </label>
                    <select
                      id="bulk-end-time"
                      value={bulkFormData.end_time}
                      onChange={(e) =>
                        setBulkFormData({
                          ...bulkFormData,
                          end_time: e.target.value,
                        })
                      }
                      className="select"
                    >
                      {timeOptions.map((time) => (
                        <option key={time} value={time}>
                          {formatTime(time)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">
                    Select Dates ({bulkDates.length} selected)
                  </label>
                  <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 bg-white/5 rounded-xl">
                    {getNext14Days().map((date) => (
                      <button
                        key={date}
                        type="button"
                        onClick={() => toggleBulkDate(date)}
                        className={`p-2 text-sm rounded-lg transition-colors ${
                          bulkDates.includes(date)
                            ? 'bg-violet-500 text-white'
                            : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                        }`}
                      >
                        {new Date(date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setBulkDates(getNext14Days())}
                      className="text-xs text-violet-400 hover:text-violet-300"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => setBulkDates([])}
                      className="text-xs text-zinc-400 hover:text-zinc-300"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowBulkModal(false)}
                    className="flex-1 btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving || bulkDates.length === 0}
                    className="flex-1 btn-primary flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    {saving ? 'Creating...' : `Create ${bulkDates.length} Slots`}
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
