'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Save, Loader2, CheckCircle, Settings, Clock, AlertCircle } from 'lucide-react';
import { getSession } from '@/lib/supabaseAuth';

interface BookingSettings {
  defaultOpenTime: string;
  defaultCloseTime: string;
  minBookingDuration: number;
  maxBookingDuration: number;
  bookingBuffer: number;
  advanceBookingDays: number;
}

export default function SettingsPage() {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [settings, setSettings] = useState<BookingSettings>({
    // Business Hours
    defaultOpenTime: '08:00',
    defaultCloseTime: '22:00',
    
    // Booking Settings
    minBookingDuration: 1,
    maxBookingDuration: 8,
    bookingBuffer: 0,
    advanceBookingDays: 30,
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

  // Load settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = await getAccessToken();
        const response = await fetch('/api/admin/settings', {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [getAccessToken]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    
    try {
      const token = await getAccessToken();
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save settings');
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-zinc-400 mt-1">Configure studio booking settings</p>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
        </div>
      ) : (
        <>
          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-400">{error}</span>
            </motion.div>
          )}

          {/* Business Hours */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-6"
          >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
            <Clock className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Business Hours</h2>
            <p className="text-zinc-400 text-sm">Default operating hours for all studios</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="default-open-time" className="block text-sm text-zinc-400 mb-2.5">Default Open Time</label>
            <input
              type="time"
              id="default-open-time"
              value={settings.defaultOpenTime}
              onChange={(e) => setSettings({ ...settings, defaultOpenTime: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label htmlFor="default-close-time" className="block text-sm text-zinc-400 mb-2.5">Default Close Time</label>
            <input
              type="time"
              id="default-close-time"
              value={settings.defaultCloseTime}
              onChange={(e) => setSettings({ ...settings, defaultCloseTime: e.target.value })}
              className="input"
            />
          </div>
        </div>
      </motion.div>

      {/* Booking Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-2xl p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <Settings className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Booking Settings</h2>
            <p className="text-zinc-400 text-sm">Configure booking rules and limits</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="min-booking-duration" className="block text-sm text-zinc-400 mb-2.5">
              Minimum Booking Duration (hours)
            </label>
            <input
              type="number"
              id="min-booking-duration"
              min="1"
              max="12"
              value={settings.minBookingDuration}
              onChange={(e) =>
                setSettings({ ...settings, minBookingDuration: parseInt(e.target.value) })
              }
              className="input"
            />
          </div>
          <div>
            <label htmlFor="max-booking-duration" className="block text-sm text-zinc-400 mb-2.5">
              Maximum Booking Duration (hours)
            </label>
            <input
              type="number"
              id="max-booking-duration"
              min="1"
              max="24"
              value={settings.maxBookingDuration}
              onChange={(e) =>
                setSettings({ ...settings, maxBookingDuration: parseInt(e.target.value) })
              }
              className="input"
            />
          </div>
          <div>
            <label htmlFor="booking-buffer" className="block text-sm text-zinc-400 mb-2.5">
              Buffer Between Bookings (minutes)
            </label>
            <input
              type="number"
              id="booking-buffer"
              min="0"
              max="60"
              step="15"
              value={settings.bookingBuffer}
              onChange={(e) =>
                setSettings({ ...settings, bookingBuffer: parseInt(e.target.value) })
              }
              className="input"
            />
          </div>
          <div>
            <label htmlFor="advance-booking-days" className="block text-sm text-zinc-400 mb-2.5">
              Advance Booking Limit (days)
            </label>
            <input
              type="number"
              id="advance-booking-days"
              min="1"
              max="365"
              value={settings.advanceBookingDays}
              onChange={(e) =>
                setSettings({ ...settings, advanceBookingDays: parseInt(e.target.value) })
              }
              className="input"
            />
          </div>
        </div>
      </motion.div>

      {/* Save Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex items-center justify-end gap-4"
      >
        {saved && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-emerald-400"
          >
            <CheckCircle className="w-5 h-5" />
            Settings saved!
          </motion.div>
        )}
        <motion.button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center gap-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          {saving ? 'Saving...' : 'Save Settings'}
        </motion.button>
      </motion.div>
        </>
      )}
    </div>
  );
}
