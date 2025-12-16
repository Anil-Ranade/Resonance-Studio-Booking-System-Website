"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Music2, Calendar, MapPin, Mail } from "lucide-react";

export default function Footer() {
  const pathname = usePathname();

  // Hide footer on admin and staff portal routes
  const isAdminOrStaffRoute = pathname?.startsWith('/admin') || pathname?.startsWith('/staff');

  // Don't render footer for admin/staff routes
  if (isAdminOrStaffRoute) {
    return null;
  }

  return (
    <footer className="main-footer border-t border-white/5 bg-black/20 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/home" className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Music2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">
                Resonance <span className="text-violet-400">Studio</span>
              </span>
            </Link>
            <p className="text-zinc-400 text-sm max-w-md mb-6">
              Professional recording studio in Pune. State-of-the-art equipment for recording, mixing, and podcast production.
            </p>
            <Link
              href="/booking/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-violet-500 hover:to-purple-500 transition-all duration-300 shadow-lg shadow-violet-500/25"
            >
              <Calendar className="w-4 h-4" />
              Book a Session
            </Link>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-white font-semibold mb-4">Services</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/studios" className="text-zinc-400 hover:text-violet-400 text-sm transition-colors">
                  Studios
                </Link>
              </li>
              <li>
                <Link href="/availability" className="text-zinc-400 hover:text-violet-400 text-sm transition-colors">
                  Availability
                </Link>
              </li>
              <li>
                <Link href="/booking/new" className="text-zinc-400 hover:text-violet-400 text-sm transition-colors">
                  Book a Session
                </Link>
              </li>
              <li>
                <Link href="/rate-card" className="text-zinc-400 hover:text-violet-400 text-sm transition-colors">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-zinc-400 hover:text-violet-400 text-sm transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/gallery" className="text-zinc-400 hover:text-violet-400 text-sm transition-colors">
                  Gallery
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-zinc-400 hover:text-violet-400 text-sm transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-zinc-400 hover:text-violet-400 text-sm transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/policies" className="text-zinc-400 hover:text-violet-400 text-sm transition-colors">
                  Policies
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Get in Touch</h4>
            <ul className="space-y-3 text-sm text-zinc-400">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
                <span className="flex flex-col">
                  <span>45, Shivprasad Housing Society</span>
                  <span>Dattawadi</span>
                  <span>Pune - 411 030</span>
                  <span className="text-zinc-500 text-xs">(Near Dandekar Pool)</span>
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-violet-400 flex-shrink-0" />
                <a href="mailto:resonancestudio12@gmail.com" className="hover:text-violet-400 transition-colors">
                  resonancestudio12@gmail.com
                </a>
              </li>
            </ul>
            <div className="mt-4">
              <Link
                href="/view-bookings"
                className="text-zinc-400 hover:text-violet-400 text-sm transition-colors"
              >
                View Bookings
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-center items-center gap-4">
          <p className="text-zinc-500 text-sm">
            © {new Date().getFullYear()} Resonance Studio. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
