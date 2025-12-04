import type { Metadata, Viewport } from "next";
import { Poppins, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Music2, Calendar, MapPin, Mail } from "lucide-react";
import Navigation from "./components/Navigation";
import ClearCache from "./components/ClearCache";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0f0f1a',
};

export const metadata: Metadata = {
  title: "Resonance Studio - Professional Recording Studio Booking",
  description: "Book professional recording studios online. Recording, mixing, and podcast facilities available in Pune.",
  keywords: ["recording studio", "music studio", "pune", "karaoke", "rehearsal space"],
  robots: "index, follow",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} ${geistMono.variable} antialiased bg-noise font-sans flex flex-col min-h-screen`}
        style={{ fontFamily: 'var(--font-poppins), sans-serif' }}
      >
        {/* Clear cache on app open */}
        <ClearCache />

        {/* Navigation */}
        <Navigation />

        {/* Main Content with padding for fixed nav */}
        <main className="pt-16 md:pt-20 flex-1">
          {children}
        </main>

        {/* Footer */}
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
                      <span>Panmala, Dattawadi</span>
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
                    href="/my-bookings"
                    className="text-zinc-400 hover:text-violet-400 text-sm transition-colors"
                  >
                    My Bookings
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
      </body>
    </html>
  );
}
