'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StaffPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if logged in as staff
    const staff = localStorage.getItem('staff');
    const token = localStorage.getItem('staffAccessToken');

    if (staff && token) {
      router.push('/staff/dashboard');
    } else {
      router.push('/staff/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
