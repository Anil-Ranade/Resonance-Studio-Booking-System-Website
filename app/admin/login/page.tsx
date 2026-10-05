'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Music2, Lock, Mail, Eye, EyeOff, Loader2 } from 'lucide-react';
import { signInWithEmail, getSession } from '@/lib/supabaseAuth';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check if admin is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await getSession();
        const adminData = localStorage.getItem('admin');
        
        if (session && adminData) {
          // Admin is already logged in, redirect to dashboard
          router.replace('/admin/dashboard');
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

      // Verify admin status
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'You are not authorized as an admin');
        setLoading(false);
        return;
      }

      // Store admin info in localStorage
      localStorage.setItem('admin', JSON.stringify(data.admin));
      localStorage.setItem('accessToken', session.access_token);

      // Redirect to admin dashboard
      router.push('/admin/dashboard');
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
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-violet-400 flex items-center justify-center">
              <Music2 className="w-5 h-5 text-navy" />
            </div>
            <span className="leading-tight">
              <span className="block text-sm font-bold text-white">Resonance</span>
              <span className="block text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">Admin</span>
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Sign in</h1>
          <p className="text-zinc-400 mt-1">Manage bookings, rooms and staff.</p>
        </div>

        {/* Login Form */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div
                className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm"
              >
                {error}
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="admin-email" className="block text-sm font-medium text-zinc-300 mb-2.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none z-10" />
                <input
                  type="email"
                  id="admin-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@resonance.studio"
                  className="w-full input !pl-12"
                  required
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="admin-password" className="block text-sm font-medium text-zinc-300 mb-2.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none z-10" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="admin-password"
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
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
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
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-zinc-500 text-sm mt-6">
          For studio staff only. Ask an admin if you need access.
        </p>
      </div>
    </div>
  );
}
