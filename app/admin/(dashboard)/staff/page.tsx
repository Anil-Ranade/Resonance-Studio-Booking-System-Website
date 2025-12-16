'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserPlus,
  Loader2,
  CheckCircle,
  AlertCircle,
  Users,
  Mail,
  Lock,
  User,
  Shield,
  Eye,
  EyeOff,
  Edit2,
  UserX,
  Trash2,
  RefreshCw,
  X,
} from 'lucide-react';
import { getSession } from '@/lib/supabaseAuth';

interface StaffMember {
  id: string;
  email: string;
  name: string;
  role: 'staff' | 'admin';
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
}

interface CreateStaffForm {
  name: string;
  email: string;
  password: string;
  role: 'staff' | 'admin';
}

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null);

  const [form, setForm] = useState<CreateStaffForm>({
    name: '',
    email: '',
    password: '',
    role: 'staff',
  });

  // Load current admin ID from localStorage
  useEffect(() => {
    const storedAdmin = localStorage.getItem('admin');
    if (storedAdmin) {
      try {
        const adminData = JSON.parse(storedAdmin);
        setCurrentAdminId(adminData.id);
      } catch {
        console.error('Failed to parse admin data');
      }
    }
  }, []);

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

  // Fetch staff members
  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getAccessToken();
      const response = await fetch('/api/admin/staff', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setStaff(data.staff || []);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to fetch staff members');
      }
    } catch (err) {
      console.error('Failed to fetch staff:', err);
      setError('Failed to fetch staff members');
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  // Create staff member
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const token = await getAccessToken();
      const response = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create staff member');
      }

      setSuccess('Staff member created successfully!');
      setShowCreateModal(false);
      setForm({ name: '', email: '', password: '', role: 'staff' });
      fetchStaff();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create staff member');
    } finally {
      setSaving(false);
    }
  };

  // Update staff member role
  const handleUpdateRole = async (id: string, newRole: string) => {
    try {
      const token = await getAccessToken();
      const response = await fetch(`/api/admin/staff/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update staff member');
      }

      setSuccess('Role updated successfully!');
      setEditingId(null);
      fetchStaff();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update staff member');
    }
  };

  // Deactivate/Reactivate staff member
  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const token = await getAccessToken();
      const response = await fetch(`/api/admin/staff/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_active: !currentActive }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update staff member');
      }

      setSuccess(`Staff member ${!currentActive ? 'activated' : 'deactivated'} successfully!`);
      fetchStaff();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update staff member');
    }
  };

  // Delete staff member permanently
  const handleDeleteStaff = async (id: string, name: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${name || 'this staff member'}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      const token = await getAccessToken();
      const response = await fetch(`/api/admin/staff/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete staff member');
      }

      setSuccess('Staff member deleted permanently!');
      fetchStaff();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete staff member');
    }
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get role badge color
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-violet-500/20 text-violet-400 border-violet-500/30';
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  // Get role display name
  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      default:
        return 'Staff';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Staff Management</h1>
          <p className="text-zinc-400 mt-1">Create and manage staff members</p>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            onClick={fetchStaff}
            className="p-2.5 rounded-xl bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </motion.button>
          <motion.button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <UserPlus className="w-5 h-5" />
            Add Staff
          </motion.button>
        </div>
      </div>

      {/* Messages */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <span className="text-red-400">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-300"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3"
          >
            <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span className="text-emerald-400">{success}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
        </div>
      ) : (
        <>
          {/* Staff List */}
          {staff.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-12 text-center"
            >
              <Users className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No Staff Members</h3>
              <p className="text-zinc-400 mb-6">
                Get started by adding your first staff member
              </p>
              <motion.button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary inline-flex items-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <UserPlus className="w-5 h-5" />
                Add Staff Member
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl overflow-hidden"
            >
              {/* Table Header */}
              <div className="hidden md:grid md:grid-cols-6 gap-4 px-6 py-4 bg-white/5 border-b border-white/5 text-sm text-zinc-400 font-medium">
                <div className="col-span-2">Staff Member</div>
                <div>Role</div>
                <div>Status</div>
                <div>Last Login</div>
                <div className="text-right">Actions</div>
              </div>

              {/* Staff Rows */}
              <div className="divide-y divide-white/5">
                {staff.map((member) => {
                  const isCurrentAdmin = member.id === currentAdminId;
                  return (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 md:p-6 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="md:grid md:grid-cols-6 md:gap-4 md:items-center space-y-3 md:space-y-0">
                      {/* Staff Info */}
                      <div className="col-span-2 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold">
                          {member.name?.[0]?.toUpperCase() || member.email[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white font-medium flex items-center gap-2">
                            {member.name || 'Unnamed'}
                            {isCurrentAdmin && (
                              <span className="text-xs text-zinc-500">(You)</span>
                            )}
                          </p>
                          <p className="text-zinc-500 text-sm">{member.email}</p>
                        </div>
                      </div>

                      {/* Role */}
                      <div>
                        {editingId === member.id && !isCurrentAdmin ? (
                          <select
                            value={member.role}
                            onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                            className="input text-sm py-1.5 px-3"
                          >
                            <option value="staff">Staff</option>
                            <option value="admin">Admin</option>
                          </select>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${getRoleBadge(
                              member.role
                            )}`}
                          >
                            <Shield className="w-3 h-3" />
                            {getRoleDisplayName(member.role)}
                          </span>
                        )}
                      </div>

                      {/* Status */}
                      <div>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                            member.is_active
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              member.is_active ? 'bg-emerald-400' : 'bg-red-400'
                            }`}
                          />
                          {member.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      {/* Last Login */}
                      <div className="text-sm text-zinc-400">
                        {formatDate(member.last_login_at)}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 md:justify-end">
                        <motion.button
                          onClick={() =>
                            !isCurrentAdmin && setEditingId(editingId === member.id ? null : member.id)
                          }
                          className={`p-2 rounded-lg transition-colors ${
                            isCurrentAdmin
                              ? 'bg-white/5 text-zinc-600 cursor-not-allowed'
                              : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
                          }`}
                          whileHover={{ scale: isCurrentAdmin ? 1 : 1.05 }}
                          whileTap={{ scale: isCurrentAdmin ? 1 : 0.95 }}
                          title={isCurrentAdmin ? "Cannot edit your own role" : "Edit Role"}
                          disabled={isCurrentAdmin}
                        >
                          <Edit2 className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          onClick={() => !isCurrentAdmin && handleToggleActive(member.id, member.is_active)}
                          className={`p-2 rounded-lg transition-colors ${
                            isCurrentAdmin
                              ? 'bg-white/5 text-zinc-600 cursor-not-allowed'
                              : member.is_active
                                ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                          }`}
                          whileHover={{ scale: isCurrentAdmin ? 1 : 1.05 }}
                          whileTap={{ scale: isCurrentAdmin ? 1 : 0.95 }}
                          title={isCurrentAdmin ? "Cannot deactivate yourself" : member.is_active ? 'Deactivate' : 'Activate'}
                          disabled={isCurrentAdmin}
                        >
                          <UserX className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          onClick={() => !isCurrentAdmin && handleDeleteStaff(member.id, member.name)}
                          className={`p-2 rounded-lg transition-colors ${
                            isCurrentAdmin
                              ? 'bg-white/5 text-zinc-600 cursor-not-allowed'
                              : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                          }`}
                          whileHover={{ scale: isCurrentAdmin ? 1 : 1.05 }}
                          whileTap={{ scale: isCurrentAdmin ? 1 : 0.95 }}
                          title={isCurrentAdmin ? "Cannot delete yourself" : "Delete permanently"}
                          disabled={isCurrentAdmin}
                        >
                        <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </>
      )}

      {/* Create Staff Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md glass rounded-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Add Staff Member</h2>
                    <p className="text-zinc-400 text-sm">Create a new staff account</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleCreateStaff} className="space-y-4">
                {/* Name */}
                <div>
                  <label htmlFor="staff-name" className="block text-sm text-zinc-400 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" />
                    <input
                      type="text"
                      id="staff-name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="John Doe"
                      className="w-full input !pl-12"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="staff-email" className="block text-sm text-zinc-400 mb-2">
                    Email Address <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" />
                    <input
                      type="email"
                      id="staff-email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="staff@resonance.studio"
                      className="w-full input !pl-12"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="staff-password" className="block text-sm text-zinc-400 mb-2">
                    Password <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="staff-password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="Min. 6 characters"
                      className="w-full input !pl-12 !pr-12"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Role */}
                <div>
                  <label htmlFor="staff-role" className="block text-sm text-zinc-400 mb-2">
                    Role
                  </label>
                  <div className="relative">
                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" />
                    <select
                      id="staff-role"
                      value={form.role}
                      onChange={(e) =>
                        setForm({ ...form, role: e.target.value as CreateStaffForm['role'] })
                      }
                      className="w-full input !pl-12 appearance-none"
                    >
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1.5">
                    Staff can view bookings. Admins can manage bookings and settings.
                  </p>
                </div>

                {/* Submit Button */}
                <div className="flex items-center gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-3 px-4 rounded-xl bg-white/5 text-zinc-300 hover:bg-white/10 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <motion.button
                    type="submit"
                    disabled={saving}
                    className="flex-1 btn-primary flex items-center justify-center gap-2"
                    whileHover={{ scale: saving ? 1 : 1.02 }}
                    whileTap={{ scale: saving ? 1 : 0.98 }}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-5 h-5" />
                        Create Staff
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
