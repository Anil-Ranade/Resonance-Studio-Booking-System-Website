"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Music2, Calendar, X, Menu } from "lucide-react";

const navLinks = [
  { label: "Home", href: "/home" },
  { label: "Studios", href: "/studios" },
  { label: "Availability", href: "/availability" },
  { label: "My Bookings", href: "/my-bookings" },
  { label: "Gallery", href: "/gallery" },
  { label: "Pricing", href: "/rate-card" },
  { label: "FAQ", href: "/faq" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMenuOpen]);

  return (
    <>
      <nav className="main-nav fixed top-0 left-0 right-0 z-50 bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-violet-500/10 shadow-lg shadow-violet-500/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link href="/home" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:shadow-violet-500/25 transition-all duration-300">
                <Music2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white hidden sm:block">
                Resonance <span className="text-violet-400">Studio</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    pathname === link.href
                      ? "text-violet-400 bg-violet-500/10"
                      : "text-zinc-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* CTA Button - Desktop */}
            <Link
              href="/booking/new"
              className="btn-primary text-sm hidden md:flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Book Now
            </Link>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsMenuOpen((prev) => !prev);
              }}
              className="md:hidden p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors touch-manipulation"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? (
                <X className="w-6 h-6 pointer-events-none" />
              ) : (
                <Menu className="w-6 h-6 pointer-events-none" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setIsMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Menu Panel */}
      {isMenuOpen && (
        <div
          className="fixed top-16 left-0 right-0 z-50 bg-[#0a0a0f]/98 backdrop-blur-xl border-b border-violet-500/10 md:hidden transition-all duration-300 ease-out opacity-100 visible"
        >
          <div className="max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-4 py-3 text-base font-medium rounded-lg transition-all duration-200 ${
                    pathname === link.href
                      ? "text-violet-400 bg-violet-500/10"
                      : "text-zinc-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              
              {/* Mobile CTA Button */}
              <div className="pt-4 pb-2">
                <Link
                  href="/booking/new"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-medium rounded-lg hover:from-violet-500 hover:to-purple-500 transition-all duration-300 shadow-lg shadow-violet-500/25"
                >
                  <Calendar className="w-4 h-4" />
                  Book Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
