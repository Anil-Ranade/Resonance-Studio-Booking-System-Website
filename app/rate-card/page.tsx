"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";

type Rate = { label: string; price: number };

// Rows = what you're doing, columns = room. Empty array = not offered in that room.
const rateSheet: { activity: string; note?: string; a: Rate[]; b: Rate[]; c: Rate[] }[] = [
  {
    activity: "Karaoke",
    a: [
      { label: "1-20 people", price: 400 },
      { label: "21-30 people", price: 500 },
    ],
    b: [{ label: "1-10 people", price: 300 }],
    c: [{ label: "1-5 people", price: 250 }],
  },
  {
    activity: "Live band",
    a: [
      { label: "Up to 8 musicians", price: 600 },
      { label: "8-12 musicians", price: 800 },
    ],
    b: [
      { label: "Up to 4 musicians", price: 400 },
      { label: "5 musicians", price: 500 },
    ],
    c: [{ label: "Up to 2 musicians", price: 350 }],
  },
  {
    activity: "Band practice",
    note: "Using the studio's own gear",
    a: [
      { label: "Drum practice only", price: 350 },
      { label: "Band with drums", price: 400 },
      { label: "Band with drums & amps", price: 500 },
      { label: "Full backline", price: 600 },
    ],
    b: [],
    c: [],
  },
  {
    activity: "Meetings & classes",
    note: "No sound operator",
    a: [{ label: "Any group", price: 350 }],
    b: [{ label: "Any group", price: 250 }],
    c: [{ label: "Any group", price: 200 }],
  },
];

const rooms = [
  { key: "a", name: "Studio A", size: "Large" },
  { key: "b", name: "Studio B", size: "Medium" },
  { key: "c", name: "Studio C", size: "Compact" },
] as const;

const packages = [
  { name: "Karaoke", prices: [3500, 2500, 2000] },
  { name: "Live", prices: [5000, 4000, 3000] },
];

const services = [
  { name: "Audio recording", detail: "Recording, editing, mixing and mastering", price: "₹700", unit: "per song" },
  { name: "Video recording", detail: "True 4K on iPhone/iPad, edited and mixed", price: "₹800", unit: "per song" },
  { name: "Green screen video", detail: "Chroma key shoot with background replacement", price: "₹1,200", unit: "per song" },
  { name: "Facebook Live", detail: "Multi-camera stream with live sound", price: "₹7,000", unit: "for 4 hours" },
  { name: "Sound system rental", detail: "Speakers, mixer and mics for outside shows", price: "Call us", unit: "for a quote" },
];

const savings = [
  { amount: "₹30/hr back", how: "Cashback on every completed hour, tracked against your phone number." },
  { amount: "₹500 bonus", how: "Extra cashback on your first booking with us." },
];

const cashbackRules = [
  "Cashback is credited when your session is completed, not when you book.",
  "Reach ₹2,000 in credit (50 hours) to get it paid out on GPay.",
  "You have 90 days from your first qualifying booking to reach 50 hours.",
  "If you miss the window, the count restarts from your second booking date.",
  "Your balance and remaining hours appear on every booking confirmation.",
];

const notes = [
  "Prices are per hour unless stated otherwise. GST may apply.",
  "No advance needed - pay at the studio after your session.",
  "Free cancellation up to 24 hours before your slot.",
  "Snacks and internet are available at extra cost.",
];

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

function Cell({ rates, room }: { rates: Rate[]; room: string }) {
  return (
    <td className={`align-top py-4 md:px-4 max-md:flex max-md:gap-4 max-md:py-2 ${rates.length === 0 ? "max-md:hidden" : ""}`}>
      <span className="md:hidden w-20 shrink-0 text-xs font-medium uppercase tracking-[0.14em] text-zinc-500 pt-0.5">
        {room}
      </span>
      {rates.length === 0 ? (
        <span className="text-zinc-600" aria-label="Not offered">
          -
        </span>
      ) : (
        <ul className="space-y-1.5 flex-1">
          {rates.map((r) => (
            <li key={r.label} className="flex items-baseline justify-between gap-3">
              <span className="text-sm text-zinc-400">{r.label}</span>
              <span className="text-white font-semibold tabular-nums">{inr(r.price)}</span>
            </li>
          ))}
        </ul>
      )}
    </td>
  );
}

export default function RateCardPage() {
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
            Hourly rates · pay after your session
          </p>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.02] max-w-3xl">
            What your session <span className="text-violet-400">will cost.</span>
          </h1>
          </div>
          <Image
            src="/pricing.png"
            alt="Gold cassette tape with its tape tied to a rupee price tag"
            width={1254}
            height={1254}
            priority
            sizes="(min-width: 1024px) 320px, 224px"
            className="w-56 lg:w-80 shrink-0 self-center"
          />
        </header>

        {/* Rate sheet */}
        <section aria-labelledby="rates-title" className="mb-24 lg:mb-32">
          <h2 id="rates-title" className="sr-only">
            Hourly rates by room
          </h2>
          <table className="w-full border-collapse">
            <thead className="max-md:hidden">
              <tr className="border-b border-violet-400/60">
                <th scope="col" className="text-left pb-4 w-[22%]">
                  <span className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-400">Per hour</span>
                </th>
                {rooms.map((r) => (
                  <th key={r.key} scope="col" className="text-left pb-4 px-4">
                    <span className="block text-2xl font-bold text-white">{r.name}</span>
                    <span className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-400">{r.size}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rateSheet.map((row) => (
                <tr key={row.activity} className="border-b border-white/10 max-md:block max-md:py-5">
                  <th scope="row" className="text-left align-top py-4 pr-4 max-md:block max-md:pb-2">
                    <span className="block text-lg font-semibold text-white">{row.activity}</span>
                    {row.note && <span className="text-sm text-zinc-500">{row.note}</span>}
                  </th>
                  <Cell rates={row.a} room="Studio A" />
                  <Cell rates={row.b} room="Studio B" />
                  <Cell rates={row.c} room="Studio C" />
                </tr>
              ))}
            </tbody>
          </table>

          {/* 10-hour packages */}
          <div className="mt-10 grid md:grid-cols-[22%_1fr] gap-4 md:gap-0 items-start">
            <div className="md:pr-4">
              <p className="text-lg font-semibold text-white">10-hour packages</p>
              <p className="text-sm text-zinc-500">For organisers · split 3 + 3 + 4 hours</p>
              <p className="text-sm text-zinc-400 mt-2">
                Packages aren&apos;t bookable online.{" "}
                <Link href="/contact" className="text-violet-400 hover:text-violet-300 font-semibold">
                  Call us to book one
                </Link>
                .
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {packages.map((p) => (
                <div key={p.name} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-violet-400 mb-3">{p.name}</p>
                  <dl className="grid grid-cols-3 gap-2">
                    {rooms.map((r, i) => (
                      <div key={r.key}>
                        <dt className="text-xs text-zinc-500">{r.name}</dt>
                        <dd className="text-lg font-bold text-white tabular-nums">{inr(p.prices[i])}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Recording & extras */}
        <section aria-labelledby="extras-title" className="grid lg:grid-cols-12 gap-6 lg:gap-12 mb-24 lg:mb-32">
          <div className="lg:col-span-4 border-t border-violet-400/60 pt-5">
            <h2 id="extras-title" className="text-3xl font-bold text-white tracking-tight mb-2">
              Recording &amp; extras
            </h2>
            <p className="text-zinc-400">Priced per song or per event, on top of any room booking.</p>
          </div>
          <ul className="lg:col-span-8 border-t border-white/10">
            {services.map((s) => (
              <li key={s.name} className="flex items-baseline justify-between gap-6 py-5 border-b border-white/10">
                <div>
                  <p className="text-white font-semibold">{s.name}</p>
                  <p className="text-sm text-zinc-400">{s.detail}</p>
                </div>
                <p className="text-right shrink-0">
                  <span className="block text-xl font-bold text-violet-400 tabular-nums">{s.price}</span>
                  <span className="text-xs text-zinc-500">{s.unit}</span>
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* Cashback */}
        <section aria-labelledby="save-title" className="grid lg:grid-cols-12 gap-6 lg:gap-12 mb-24">
          <div className="lg:col-span-4 border-t border-violet-400/60 pt-5">
            <h2 id="save-title" className="text-3xl font-bold text-white tracking-tight mb-2">
              Cashback
            </h2>
            <p className="text-zinc-400">Earn back on every hour you book with us.</p>
          </div>
          <div className="lg:col-span-8">
            <div className="grid sm:grid-cols-2 gap-3 mb-8">
              {savings.map((s) => (
                <div key={s.amount} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <p className="text-2xl font-bold text-violet-400 mb-2">{s.amount}</p>
                  <p className="text-sm text-zinc-300">{s.how}</p>
                </div>
              ))}
            </div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-400 mb-3">
              How cashback works
            </p>
            <ul className="border-t border-white/10 mb-10">
              {cashbackRules.map((r) => (
                <li key={r} className="py-3 border-b border-white/10 text-sm text-zinc-300">
                  {r}
                </li>
              ))}
            </ul>
            <ul className="space-y-1.5 text-sm text-zinc-500 mb-10">
              {notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
            <Link
              href="/booking/new"
              className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-violet-400 hover:bg-violet-300 text-navy font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy"
            >
              Book a session
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
