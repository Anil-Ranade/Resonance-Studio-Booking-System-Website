'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PanelShell from '@/app/components/PanelShell';
import { LayoutDashboard, Calendar } from 'lucide-react';
import { signOut, getSession } from '@/lib/supabaseAuth';

interface StaffInfo {
  id: string;
  email: string;
  name: string;
  role: string;
}

const navItems = [
  { 
    label: 'Dashboard', 
    href: '/staff/dashboard', 
    icon: LayoutDashboard,
    allowedRoles: ['staff', 'investor'] 
  },
  { 
    label: 'Bookings', 
    href: '/staff/bookings', 
    icon: Calendar,
    allowedRoles: ['staff'] 
  },
];

export default function StaffDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [staff, setStaff] = useState<StaffInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for staff authentication
    const checkAuth = async () => {
      const storedStaff = localStorage.getItem('staff');

      if (!storedStaff) {
        router.push('/staff/login');
        return;
      }

      try {
        // Verify session is still valid
        const session = await getSession();
        if (!session) {
          localStorage.removeItem('staff');
          localStorage.removeItem('staffAccessToken');
          router.push('/staff/login');
          return;
        }
        
        // Update token in localStorage with fresh one
        localStorage.setItem('staffAccessToken', session.access_token);
        
        const staffData = JSON.parse(storedStaff);
        setStaff(staffData);
        setLoading(false);
      } catch {
        router.push('/staff/login');
        return;
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('staff');
      localStorage.removeItem('staffAccessToken');
      router.push('/staff/login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" role="status">
        <div className="w-8 h-8 border-4 border-violet-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const visible = navItems.filter(
    (item) => !(staff?.role && item.allowedRoles && !item.allowedRoles.includes(staff.role)),
  );

  return (
    <PanelShell panel="Staff" homeHref="/staff/dashboard" navItems={visible} user={staff} onLogout={handleLogout}>
      {children}
    </PanelShell>
  );
}
