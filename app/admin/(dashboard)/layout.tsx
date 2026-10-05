"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PanelShell from "@/app/components/PanelShell";
import { LayoutDashboard, Calendar, Clock, Users, Settings, Gift, CreditCard } from "lucide-react";
import { signOut, getSession } from "@/lib/supabaseAuth";

interface AdminInfo {
  id: string;
  email: string;
  name: string;
  role: string;
}

const navItems = [
  { 
    label: "Dashboard",
    group: "Operate",
    href: "/admin/dashboard", 
    icon: LayoutDashboard,
    allowedRoles: ['admin', 'super_admin', 'staff', 'investor'] 
  },
  { 
    label: "Availability",
    group: "Operate",
    href: "/admin/availability", 
    icon: Clock,
    allowedRoles: ['admin', 'super_admin', 'staff']
  },
  { 
    label: "Bookings",
    group: "Operate",
    href: "/admin/bookings", 
    icon: Calendar,
    allowedRoles: ['admin', 'super_admin', 'staff', 'investor']
  },
  { 
    label: "Payments",
    group: "Business",
    href: "/admin/payments", 
    icon: CreditCard,
    allowedRoles: ['admin', 'super_admin']
  },
  { 
    label: "Investors",
    group: "Business",
    href: "/admin/investors", 
    icon: Users,
    allowedRoles: ['admin', 'super_admin']
  },
  { 
    label: "Loyalty",
    group: "Operate",
    href: "/admin/loyalty", 
    icon: Gift,
    allowedRoles: ['admin', 'super_admin', 'staff']
  },
  { 
    label: "Staff",
    group: "Team",
    href: "/admin/staff", 
    icon: Users,
    allowedRoles: ['admin', 'super_admin']
  },
  { 
    label: "Settings",
    group: "Team",
    href: "/admin/settings", 
    icon: Settings,
    allowedRoles: ['admin', 'super_admin', 'staff', 'investor']
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for admin authentication
    const checkAuth = async () => {
      const storedAdmin = localStorage.getItem("admin");

      if (!storedAdmin) {
        router.push("/admin/login");
        return;
      }

      try {
        // Verify session is still valid
        const session = await getSession();
        if (!session) {
          localStorage.removeItem("admin");
          localStorage.removeItem("accessToken");
          router.push("/admin/login");
          return;
        }

        // Update token in localStorage with fresh one
        localStorage.setItem("accessToken", session.access_token);

        const adminData = JSON.parse(storedAdmin);
        setAdmin(adminData);
        setLoading(false);
      } catch {
        router.push("/admin/login");
        return;
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("admin");
      localStorage.removeItem("accessToken");
      router.push("/admin/login");
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
    (item) => !(admin?.role && item.allowedRoles && !item.allowedRoles.includes(admin.role)),
  );

  return (
    <PanelShell panel="Admin" homeHref="/admin/dashboard" navItems={visible} user={admin} onLogout={handleLogout}>
      {children}
    </PanelShell>
  );
}
