'use client';

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

// Liner-notes style credits: role on the left, name on the right
const credits = [
  {
    group: "Owners",
    people: [
      { role: "Proprietor", name: "Suchitra Ranade" },
      { role: "Investor", name: "Amruta Ranade" },
    ],
  },
  {
    group: "Team",
    people: [
      { role: "Jamming room", name: "Soundcheck Enterprises - Ayan Momin" },
      { role: "Karaoke room", name: "Soundcheck Enterprises - Ayan Momin" },
      { role: "Classes", name: "Gafar Momin" },
      { role: "Podcast & recording", name: "Atharv Kshirsagar & Amruta Ranade" },
      { role: "Sound operators", name: "Sohel & Nitin Randive" },
      { role: "Pantry", name: "Dhananjay Purkar" },
      { role: "Assistant", name: "Sudhakar Sonawane" },
    ],
  },
  {
    group: "Built with",
    people: [
      { role: "Acoustic consultant", name: "Fenestra Solutions - Sohail" },
      { role: "Contractor", name: "Vishwakarma Furniture - Babulal" },
      { role: "Electrical contractor", name: "Om Electricals - Lonkar" },
    ],
  },
];

export default function AboutPage() {
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

        <header className="mb-14 lg:mb-20">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-fuchsia-400 mb-4">
            About Resonance · Sinhgad Road, Pune
          </p>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.02] max-w-4xl">
            A decade in audio. <span className="text-violet-400">Now three rooms of our own.</span>
          </h1>
        </header>

        {/* Story */}
        <section aria-labelledby="story-title" className="grid lg:grid-cols-12 gap-6 lg:gap-12 mb-24 lg:mb-32">
          <div className="lg:col-span-4 border-t border-violet-400/60 pt-5">
            <h2 id="story-title" className="text-3xl font-bold text-white tracking-tight">
              Our story
            </h2>
          </div>
          <div className="lg:col-span-8 space-y-5 text-lg text-zinc-300 leading-relaxed max-w-3xl">
            <p>
              After ten years in the audio industry, we opened a new facility on Sinhgad Road, Pune, to offer{" "}
              <span className="text-white">audio and video recording</span> alongside rehearsal space.
            </p>
            <p>
              Everything here is new: mixers, microphones and the full setup, run by a dedicated team of audio and
              video recordists.
            </p>
            <p>
              The building has three rooms - <span className="text-white">Studio A, B and C</span> - each set up
              for a different mix of rehearsal, karaoke and recording.
            </p>
            <Link
              href="/studios"
              className="group inline-flex items-center gap-2 text-base font-semibold text-violet-400 hover:text-violet-300"
            >
              See the rooms
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </section>

        {/* Credits */}
        <section aria-labelledby="credits-title" className="grid lg:grid-cols-12 gap-6 lg:gap-12 mb-24">
          <div className="lg:col-span-4 border-t border-violet-400/60 pt-5">
            <h2 id="credits-title" className="text-3xl font-bold text-white tracking-tight mb-2">
              Credits
            </h2>
            <p className="text-zinc-400">The people who built and run the studio.</p>
          </div>

          <div className="lg:col-span-8">
            <div className="rounded-3xl border border-violet-400/30 bg-white/[0.03] p-6 sm:p-8 mb-12">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-fuchsia-400 mb-2">
                Concept, planning &amp; execution
              </p>
              <p className="text-3xl sm:text-4xl font-bold text-violet-400 tracking-tight">Anil Ranade</p>
            </div>

            <div className="space-y-10">
              {credits.map((c) => (
                <div key={c.group}>
                  <h3 className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-400 mb-3">{c.group}</h3>
                  <dl>
                    {c.people.map((p) => (
                      <div key={p.role} className="flex items-baseline gap-3 py-2.5 max-sm:flex-col max-sm:gap-0.5">
                        <dt className="text-zinc-400 shrink-0">{p.role}</dt>
                        <span
                          aria-hidden="true"
                          className="flex-1 border-b border-dotted border-white/20 translate-y-[-4px] max-sm:hidden"
                        />
                        <dd className="text-white font-medium sm:text-right">{p.name}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
