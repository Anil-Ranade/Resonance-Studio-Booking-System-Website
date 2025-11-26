'use client';

import OTPLogin from '@/app/components/OTPLogin';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Resonance Studio
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Sign in to manage your bookings
          </p>
        </div>

        {/* OTP Login Component */}
        <OTPLogin 
          redirectUrl="/my-bookings"
          onSuccess={(token, phone) => {
            console.log('Login successful:', { phone });
          }}
        />

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-8">
          By signing in, you agree to our{' '}
          <a href="/policies" className="text-blue-600 hover:underline dark:text-blue-400">
            Terms & Conditions
          </a>
        </p>
      </div>
    </div>
  );
}
