"use client";

import { usePathname } from "next/navigation";

export default function MainContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Check if on admin or staff routes
  const isAdminOrStaffRoute = pathname?.startsWith('/admin') || pathname?.startsWith('/staff');

  // Don't add padding for admin/staff routes since they don't have the top nav
  return (
    <main className={`flex-1 ${isAdminOrStaffRoute ? '' : 'pt-16 md:pt-20'}`}>
      {children}
    </main>
  );
}
