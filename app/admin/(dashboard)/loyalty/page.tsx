'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Loader2, 
  Award, 
  Gift, 
  TrendingUp, 
  AlertCircle,
  CheckCircle2,
  Phone
} from 'lucide-react';

interface LoyaltyStatus {
  phone_number?: string; // from get_all_statuses distinct result
  customer_name?: string;
  hours: number;
  target: number;
  eligible: boolean;
  window_start: string | null;
  window_end: string | null;
}

export default function LoyaltyPage() {
  const [allStatuses, setAllStatuses] = useState<LoyaltyStatus[]>([]);
  const [filteredStatuses, setFilteredStatuses] = useState<LoyaltyStatus[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingPhone, setProcessingPhone] = useState<string | null>(null);

  const fetchAllStatuses = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/loyalty/all');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch statuses');
      }

      setAllStatuses(data);
      setFilteredStatuses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch statuses');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllStatuses();
  }, []);

  useEffect(() => {
    if (!searchQuery) {
      setFilteredStatuses(allStatuses);
    } else {
      const lower = searchQuery.toLowerCase();
      setFilteredStatuses(
        allStatuses.filter(s => 
          s.phone_number?.toLowerCase().includes(lower) || 
          s.customer_name?.toLowerCase().includes(lower)
        )
      );
    }
  }, [searchQuery, allStatuses]);

  const handleProcessReward = async (phone: string) => {
    if (!confirm(`Are you sure you want to process reward for ${phone}?`)) {
      return;
    }

    setProcessingPhone(phone);
    try {
      const response = await fetch('/api/loyalty/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to process reward');
      }
      
      alert('Reward processed successfully!');
      // Refresh list
      await fetchAllStatuses();
      
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to process reward');
    } finally {
      setProcessingPhone(null);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Loyalty Program</h1>
          <p className="text-zinc-400">Overview of all customer loyalty progress.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input 
            type="text"
            placeholder="Search name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 w-full md:w-64"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 text-red-400 bg-red-500/10 p-4 rounded-xl">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      ) : (
        <div className="grid gap-4">
          <div className="glass-strong rounded-2xl overflow-hidden border border-white/5">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white/5">
                  <tr className="text-zinc-400 text-sm font-medium">
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Progress (50h Goal)</th>
                    <th className="px-6 py-4">Current Cycle</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredStatuses.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                        No customers found.
                      </td>
                    </tr>
                  ) : (
                    filteredStatuses.map((status) => (
                      <tr key={status.phone_number} className="hover:bg-white/5 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-400 font-bold text-xs">
                              <Phone className="w-4 h-4" />
                            </div>
                            <div>
                                <div className="text-white font-medium">{status.customer_name || 'Unknown'}</div>
                                <div className="text-zinc-400 text-xs font-mono">{status.phone_number}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1 w-full max-w-[200px]">
                            <div className="flex justify-between text-xs">
                              <span className="text-white font-bold">{Number(status.hours).toFixed(1)} h</span>
                              <span className="text-zinc-500">50 h</span>
                            </div>
                            <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${status.eligible ? 'bg-green-500' : 'bg-violet-500'}`}
                                style={{ width: `${Math.min((status.hours / 50) * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-zinc-400">
                            {status.window_start ? (
                              <>
                                <span>{formatDate(status.window_start)}</span>
                                <span className="text-zinc-600">→</span>
                                <span>{formatDate(status.window_end)}</span>
                              </>
                            ) : (
                              <span className="text-zinc-600 italic">No active cycle</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {status.eligible ? (
                            <button
                              onClick={() => status.phone_number && handleProcessReward(status.phone_number)}
                              disabled={processingPhone === status.phone_number}
                              className="btn-accent py-1.5 px-4 text-xs font-bold rounded-lg inline-flex items-center gap-2 shadow-lg shadow-green-500/20 bg-green-500 hover:bg-green-600 border-green-400 text-white"
                            >
                              {processingPhone === status.phone_number ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Gift className="w-3 h-3" />
                              )}
                              Process Reward
                            </button>
                          ) : (
                            <span className="text-xs font-medium text-zinc-600 px-3 py-1 bg-zinc-800/50 rounded-full border border-white/5">
                              In Progress
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
