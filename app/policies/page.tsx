'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";

// Helper function to format time from 24h to 12h format
function formatTimeToDisplay(time: string): string {
  const [hours] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHours}:00 ${period}`;
}

export default function PoliciesPage() {
  const [defaultOpenTime, setDefaultOpenTime] = useState('08:00');
  const [defaultCloseTime, setDefaultCloseTime] = useState('22:00');
  const [loading, setLoading] = useState(true);

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
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const hours = `${formatTimeToDisplay(defaultOpenTime)} - ${formatTimeToDisplay(defaultCloseTime)}`;

  // Each policy leads with a one-line short version, full wording below
  const policies = [
    {
      id: "hours",
      title: "Operating hours",
      short: loading ? "Open daily." : `Open daily, ${hours}.`,
      content: loading
        ? "Loading operating hours..."
        : `Our standard operating hours are from ${formatTimeToDisplay(defaultOpenTime)} to ${formatTimeToDisplay(defaultCloseTime)}. Should you require studio time outside these hours, special arrangements can be considered upon prior request.`,
    },
    {
      id: "parking",
      title: "Parking",
      short: "Park inside the building. Never block a gate.",
      content: "Please park your vehicle in the designated parking area within our building. If building parking is full, you may use society street parking on the road. Please ensure no gates are blocked and no inconvenience is caused to other residents.",
    },
    {
      id: "noise",
      title: "Discussions & noise",
      short: "Chat inside, not on the road.",
      content: "We provide ample space within our premises for your discussions before and after your session. To maintain a peaceful environment for our neighbors, we kindly request that you refrain from extended chatting on the road near the studio.",
    },
    {
      id: "smoking",
      title: "Smoking",
      short: "Only in the smoking area, and use the bins.",
      content: "Smoking is always discouraged. If you happen to smoke, please use the designated smoking area only. Ensure all cigarettes are fully extinguished and please dispose of all ash and butts in the provided dustbins.",
    },
    {
      id: "privacy",
      title: "Privacy & monitoring",
      short: "Your operator listens from outside. Call them if you need anything.",
      content: "To ensure your privacy, after the initial setup, our sound engineer/operator is advised to monitor externally. However, they will conduct intermittent checks inside the studio to confirm all systems are functioning properly. Should you require any assistance (e.g., an additional microphone, battery replacement, or any other technical support), please call them and they will promptly attend to your needs.",
    },
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

        <header className="mb-14 lg:mb-20 flex flex-col-reverse lg:flex-row lg:items-center lg:justify-between gap-8">
          <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-fuchsia-400 mb-4">
            Studio policies · {policies.length} house rules
          </p>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.02] max-w-3xl">
            A few house rules, <span className="text-violet-400">so every session runs well.</span>
          </h1>
          </div>
          <Image
            src="/policies.png"
            alt="Parchment scroll with a checklist, a fountain pen and a music-note wax seal"
            width={1254}
            height={1254}
            priority
            sizes="(min-width: 1024px) 320px, 224px"
            className="w-56 lg:w-80 shrink-0 self-center"
          />
        </header>

        <div className="space-y-14 lg:space-y-16 mb-24">
          {policies.map((p) => (
            <section
              key={p.id}
              id={p.id}
              aria-labelledby={`${p.id}-title`}
              className="scroll-mt-28 grid lg:grid-cols-12 gap-4 lg:gap-12"
            >
              <div className="lg:col-span-4 border-t border-violet-400/60 pt-5">
                <h2 id={`${p.id}-title`} className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-400">
                  {p.title}
                </h2>
              </div>
              <div className="lg:col-span-8 lg:border-t lg:border-white/10 lg:pt-5">
                <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-snug mb-3">{p.short}</p>
                <p className="text-zinc-400 leading-relaxed max-w-3xl">{p.content}</p>
              </div>
            </section>
          ))}

          <section className="grid lg:grid-cols-12 gap-4 lg:gap-12">
            <div className="lg:col-start-5 lg:col-span-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Questions about a policy?</h2>
                <p className="text-zinc-400">Ask our staff at the studio, or call us before your session.</p>
              </div>
              <Link
                href="/contact"
                className="group shrink-0 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-violet-400 hover:bg-violet-300 text-navy font-semibold transition-colors"
              >
                Contact us
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
