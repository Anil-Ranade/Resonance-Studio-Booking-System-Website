'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Music2, Lock, Mail, Eye, EyeOff, Loader2, Users } from 'lucide-react';
import { signInWithEmail, getSession } from '@/lib/supabaseAuth';

export default function StaffLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check if staff is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await getSession();
        const staffData = localStorage.getItem('staff');
        
        if (session && staffData) {
          // Staff is already logged in, redirect to dashboard
          router.replace('/staff/dashboard');
          return;
        }
      } catch (err) {
        // Not logged in, continue to show login page
        console.error('Auth check error:', err);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Sign in with Supabase Auth
      const { user, session } = await signInWithEmail(email, password);

      if (!user || !session) {
        setError('Invalid credentials');
        setLoading(false);
        return;
      }

      // Verify staff status
      const response = await fetch('/api/staff/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'You are not authorized as a staff member');
        setLoading(false);
        return;
      }

      // Store staff info in localStorage (separate from admin)
      localStorage.setItem('staff', JSON.stringify(data.staff));
      localStorage.setItem('staffAccessToken', session.access_token);

      // Redirect to staff dashboard
      router.push('/staff/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show loading spinner while checking auth
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 mb-4 shadow-lg shadow-teal-500/25">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Staff Portal</h1>
          <p className="text-zinc-400 mt-2">Sign in to manage your bookings at Resonance Studio</p>
        </div>

        {/* Login Form */}
        <div className="glass rounded-2xl p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="staff-email" className="block text-sm font-medium text-zinc-300 mb-2.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none z-10" />
                <input
                  type="email"
                  id="staff-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staff@resonance.studio"
                  className="w-full input !pl-12"
                  required
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="staff-password" className="block text-sm font-medium text-zinc-300 mb-2.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none z-10" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="staff-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full input !pl-12 !pr-12"
                  required
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-semibold py-3 px-6 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  Sign In
                </>
              )}
            </motion.button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-zinc-500 text-sm mt-6">
          Staff access only. For admin access, use <a href="/admin/login" className="text-teal-400 hover:underline">/admin</a>
        </p>
      </motion.div>
    </div>
  );
}
