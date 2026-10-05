"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowUpRight, Phone } from "lucide-react";

// Helper function to format time from 24h to 12h format
function formatTimeToDisplay(time: string): string {
  const [hours] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHours}:00 ${period}`;
}

const MAPS_QUERY = "45+Shivprasad+Housing+Society+Panmala+Dattawadi+Pune";

export default function ContactPage() {
  const [defaultOpenTime, setDefaultOpenTime] = useState('08:00');
  const [defaultCloseTime, setDefaultCloseTime] = useState('22:00');

  // Fetch booking settings on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const data = await response.json();
          setDefaultOpenTime(data.defaultOpenTime || '08:00');
          setDefaultCloseTime(data.defaultCloseTime || '22:00');
        }
      } catch (err) {
        console.error('Error fetching booking settings:', err);
      }
    };
    fetchSettings();
  }, []);

  const phoneNumbers = [
    { name: "Anil Ranade", number: "+91 98220 29235" },
    { name: "Gafar Momin", number: "+91 98901 58080" },
    { name: "Ayan Momin", number: "+91 90113 07068" },
    { name: "Atharv Kshirsagar", number: "+91 94224 68757" },
  ];

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <Link
          href="/home"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-10"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </Link>

        <header className="mb-14 lg:mb-16 grid sm:grid-cols-[1fr_auto] items-center gap-8">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-fuchsia-400 mb-4">
              Open daily · {formatTimeToDisplay(defaultOpenTime)} - {formatTimeToDisplay(defaultCloseTime)}
            </p>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.02] max-w-3xl">
              Call us, or <span className="text-violet-400">come over.</span>
            </h1>
          </div>
          {/* Decorative; hidden on phones so the call list stays near the top */}
          <Image
            src="/contact.png"
            alt=""
            width={1254}
            height={1254}
            priority
            sizes="(min-width: 1024px) 360px, 240px"
            className="hidden sm:block w-60 lg:w-[360px] h-auto -my-6 lg:-my-12 drop-shadow-[0_20px_40px_rgba(12,21,48,0.6)] select-none pointer-events-none"
          />
        </header>

        <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 mb-24">
          {/* Reach us */}
          <div className="lg:col-span-5 space-y-12">
            <section aria-labelledby="call-title">
              <h2 id="call-title" className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-400 border-t border-violet-400/60 pt-5 mb-2">
                Call
              </h2>
              <ul>
                {phoneNumbers.map((c) => (
                  <li key={c.number}>
                    <a
                      href={`tel:${c.number.replace(/\s/g, '')}`}
                      className="group flex items-center justify-between gap-4 py-4 border-b border-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 rounded"
                    >
                      <span className="text-zinc-400 group-hover:text-white transition-colors">{c.name}</span>
                      <span className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-white group-hover:text-violet-400 tabular-nums transition-colors">
                        {c.number}
                        <Phone className="w-4 h-4 text-violet-400" />
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="email-title">
              <h2 id="email-title" className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-400 border-t border-violet-400/60 pt-5 mb-3">
                Email
              </h2>
              <a
                href="mailto:resonancestudio12@gmail.com"
                className="text-xl font-semibold text-violet-400 hover:text-violet-300 break-all"
              >
                resonancestudio12@gmail.com
              </a>
            </section>

            <section aria-labelledby="hours-title">
              <h2 id="hours-title" className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-400 border-t border-violet-400/60 pt-5 mb-3">
                Hours
              </h2>
              <p className="text-xl font-semibold text-white">
                Monday - Sunday, {formatTimeToDisplay(defaultOpenTime)} - {formatTimeToDisplay(defaultCloseTime)}
              </p>
              <p className="text-zinc-400 mt-1">Sessions outside these hours on request.</p>
            </section>
          </div>

          {/* Visit */}
          <section aria-labelledby="visit-title" className="lg:col-span-7">
            <h2 id="visit-title" className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-400 border-t border-violet-400/60 pt-5 mb-3">
              Visit
            </h2>
            <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
              <address className="not-italic text-xl font-semibold text-white leading-snug">
                45, Shivprasad Housing Society
                <br />
                Dattawadi, Pune 411030
                <span className="block text-sm font-normal text-zinc-400 mt-1">Near Dandekar Pool</span>
              </address>
              <a
                href={`https://maps.google.com/?q=${MAPS_QUERY}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-violet-400 hover:bg-violet-300 text-navy text-sm font-semibold transition-colors"
              >
                Get directions
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
            <div className="rounded-3xl overflow-hidden border border-white/10">
              <iframe
                src={`https://maps.google.com/maps?q=${MAPS_QUERY}&z=16&output=embed`}
                title="Resonance Studio location on Google Maps"
                className="w-full h-80 sm:h-[28rem] border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
