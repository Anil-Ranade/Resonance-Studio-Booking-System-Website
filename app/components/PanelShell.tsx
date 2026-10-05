"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Music2, LogOut, Menu, X, ExternalLink, type LucideIcon } from "lucide-react";

// Shared sidebar + top bar for the admin and staff panels.

export interface PanelNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  group?: string;
}

export default function PanelShell({
  panel,
  homeHref,
  navItems,
  user,
  onLogout,
  children,
}: {
  panel: string;
  homeHref: string;
  navItems: PanelNavItem[]; // already filtered for the user's role
  user: { name?: string; email?: string; role?: string } | null;
  onLogout: () => void;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Items without a group render as one ungrouped list
  const groupNames = Array.from(new Set(navItems.map((i) => i.group ?? "")));
  const groups = groupNames.map((g) => ({ name: g, items: navItems.filter((i) => (i.group ?? "") === g) }));
  const current = navItems.find((item) => pathname?.startsWith(item.href));

  return (
    <div className="min-h-screen flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky lg:top-0 lg:h-screen inset-y-0 left-0 z-50 w-64 shrink-0 bg-zinc-950 border-r border-white/[0.06] transform transition-transform duration-300 lg:transform-none ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-5 border-b border-white/[0.06]">
            <Link href={homeHref} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-violet-400 flex items-center justify-center">
                <Music2 className="w-4 h-4 text-navy" />
              </div>
              <span className="leading-tight">
                <span className="block text-sm font-bold text-white">Resonance</span>
                <span className="block text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">{panel}</span>
              </span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 text-zinc-400 hover:text-white"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-6" aria-label={panel}>
            {groups.map((g) => (
              <div key={g.name || "main"}>
                {g.name && (
                  <p className="px-3 mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">{g.name}</p>
                )}
                <ul className="space-y-0.5">
                  {g.items.map((item) => {
                    const isActive = pathname?.startsWith(item.href);
                    const Icon = item.icon;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setSidebarOpen(false)}
                          aria-current={isActive ? "page" : undefined}
                          className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${
                            isActive ? "bg-white/[0.06] text-white" : "text-zinc-400 hover:bg-white/[0.04] hover:text-white"
                          }`}
                        >
                          {isActive && (
                            <span aria-hidden="true" className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-violet-400" />
                          )}
                          <Icon className={`w-4 h-4 ${isActive ? "text-violet-400" : ""}`} />
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          <div className="p-3 border-t border-white/[0.06]">
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="w-9 h-9 rounded-full bg-violet-400/15 border border-violet-400/30 flex items-center justify-center text-sm font-bold text-violet-300 uppercase">
                {user?.name?.[0] || user?.email?.[0] || panel[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium truncate">{user?.name || panel}</p>
                <p className="text-xs text-zinc-500 truncate capitalize">{user?.role?.replace("_", " ") || user?.email}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="mt-1 w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 h-16 bg-[#101c3d]/90 backdrop-blur-xl border-b border-white/[0.06] px-4 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-base font-semibold text-white truncate">{current?.label || "Dashboard"}</h1>
            <span className="hidden sm:inline text-sm text-zinc-500">
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
            </span>
          </div>
          <Link
            href="/home"
            target="_blank"
            className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            View site
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </header>

        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
