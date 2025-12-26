"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Music2,
  LayoutDashboard,
  Calendar,
  Clock,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  MessageCircle,
} from "lucide-react";
import { signOut, getSession } from "@/lib/supabaseAuth";

interface AdminInfo {
  id: string;
  email: string;
  name: string;
  role: string;
}

const navItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Availability", href: "/admin/availability", icon: Clock },
  { label: "Bookings", href: "/admin/bookings", icon: Calendar },
  { label: "Reminders", href: "/admin/reminders", icon: MessageCircle },
  { label: "Staff", href: "/admin/staff", icon: Users },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState<AdminInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#0a0a0f] border-r border-white/5 transform transition-transform duration-300 lg:transform-none ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-4 border-b border-white/5">
            <Link href="/admin/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Music2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">
                Admin <span className="text-violet-400">Panel</span>
              </span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? "bg-violet-500/20 text-violet-400"
                      : "text-zinc-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                </Link>
              );
            })}

            {/* Sign Out Button */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Sign Out</span>
            </button>
          </nav>

          {/* User Info */}
          <div className="p-4 border-t border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold">
                {admin?.name?.[0] || admin?.email?.[0] || "A"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">
                  {admin?.name || "Admin"}
                </p>
                <p className="text-zinc-400 text-sm truncate">{admin?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-white/5 px-4 py-3 lg:px-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="hidden lg:block">
              <h1 className="text-lg font-semibold text-white">
                {navItems.find((item) => item.href === pathname)?.label ||
                  "Dashboard"}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="/home"
                target="_blank"
                className="text-sm text-zinc-400 hover:text-white transition-colors"
              >
                View Site →
              </Link>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
