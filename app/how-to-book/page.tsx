"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

// A real sequence, so steps are numbered
const bookingSteps = [
  {
    title: "Choose what to do",
    description: "Open online booking from the home page.",
    details: [
      "Pick from four options: New booking, Change, Cancel or View",
      "Choose New booking to create a session",
      "A progress bar shows where you are in the flow",
    ],
  },
  {
    title: "Pick a session type",
    description: "Tell us what the session is for.",
    details: [
      "Karaoke: sing along with lyrics on screen",
      "Live with musicians: perform with accompanying musicians",
      "Band practice: full band rehearsal with studio gear",
      "Meetings & classes: use a room for non-music sessions",
    ],
  },
  {
    title: "Choose a studio",
    description: "We suggest the best room for your session type.",
    details: [
      "Studio A (large): up to 30 people, from ₹350/hr",
      "Studio B (medium): up to 10 people, from ₹250/hr",
      "Studio C (compact): up to 5 people, from ₹200/hr",
    ],
  },
  {
    title: "Pick a date and time",
    description: "Only free dates and slots are shown.",
    details: [
      "Unavailable dates are greyed out on the calendar",
      "Free time appears in blocks, e.g. 8 AM-2 PM, 4 PM-10 PM",
      "Choose a start time first, then an end time",
      "Minimum booking is 1 hour; we're open 8 AM-10 PM",
    ],
  },
  {
    title: "Add participants",
    description: "Group size sets the right price tier.",
    details: [
      "Karaoke: enter the number of singers",
      "Band: choose musicians and instruments",
      "Live: choose the number of accompanying musicians",
    ],
  },
  {
    title: "Review",
    description: "Check everything before you confirm.",
    details: [
      "See session type, studio, date, time and group size",
      "See the price, item by item",
    ],
  },
  {
    title: "Confirm",
    description: "Verify your number and you're booked.",
    details: [
      "Enter the OTP sent to your mobile",
      "Your confirmation shows on screen straight away",
      "You get a WhatsApp/SMS with your booking ID",
      "An email follows if you gave one",
    ],
  },
];

const sessionTypes = [
  {
    name: "Karaoke",
    description: "Sing along with lyrics on large TV screens.",
    features: ["50,000+ songs", "Hindi, English and Marathi", "Professional sound system", "Party lighting available"],
  },
  {
    name: "Live with musicians",
    description: "Perform with accompanying musicians.",
    features: ["Skilled musicians available", "All instruments provided", "Recording options", "Good for practice"],
  },
  {
    name: "Band practice",
    description: "Full band rehearsal on studio equipment.",
    features: ["Full drum kit", "Guitar and bass amps", "Keyboard", "PA system"],
  },
];

const manage = [
  {
    title: "Change a booking",
    href: "/edit-booking",
    cta: "Change a booking",
    steps: [
      "Enter the email you booked with",
      "Pick the booking to change",
      "Verify with an OTP if asked",
      "Choose a new date, time or room and confirm",
    ],
    note: "Changes are possible up to 24 hours before the session.",
  },
  {
    title: "Cancel a booking",
    href: "/cancel-booking",
    cta: "Cancel a booking",
    steps: [
      "Enter the email you booked with",
      "Pick the booking to cancel",
      "Verify with an OTP if asked",
      "Confirm the cancellation",
    ],
    note: "Free cancellation with 24+ hours notice.",
  },
  {
    title: "View your bookings",
    href: "/view-bookings",
    cta: "View bookings",
    steps: [
      "Enter your email or phone number",
      "See all your upcoming sessions",
      "Check date, time, studio and amount",
    ],
    note: "Confirmations are also sent on WhatsApp.",
  },
];

const goodToKnow = [
  { title: "No advance payment", description: "Pay at the studio after your session." },
  { title: "Free cancellation", description: "Cancel free with 24+ hours notice." },
  { title: "Easy rescheduling", description: "Change your date or time with 24 hours notice." },
  { title: "WhatsApp updates", description: "Get your confirmation and reminders on WhatsApp." },
];

export default function HowToBookPage() {
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
            How to book · takes about 2 minutes
          </p>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.02] max-w-3xl">
            Book a room in <span className="text-violet-400">{bookingSteps.length} steps.</span>
          </h1>
        </header>

        {/* Steps timeline */}
        <section aria-labelledby="steps-title" className="grid lg:grid-cols-12 gap-6 lg:gap-12 mb-24 lg:mb-32">
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-28 border-t border-violet-400/60 pt-5">
              <h2 id="steps-title" className="text-3xl font-bold text-white tracking-tight mb-2">
                New booking
              </h2>
              <p className="text-zinc-400 mb-6">No advance payment. You pay at the studio after your session.</p>
              <Link
                href="/booking"
                className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-violet-400 hover:bg-violet-300 text-navy font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy"
              >
                Start booking
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          <ol className="lg:col-span-8 relative">
            {/* The track */}
            <span aria-hidden="true" className="absolute left-5 top-2 bottom-2 w-px bg-gradient-to-b from-violet-400 via-violet-400/40 to-fuchsia-400/60" />
            {bookingSteps.map((step, i) => (
              <li key={step.title} className="relative pl-16 pb-12 last:pb-0">
                <span className="absolute left-0 top-0 w-10 h-10 rounded-full bg-navy border-2 border-violet-400 flex items-center justify-center text-sm font-bold text-violet-400 tabular-nums">
                  {i + 1}
                </span>
                <h3 className="text-2xl font-bold text-white tracking-tight pt-1.5 mb-1">{step.title}</h3>
                <p className="text-zinc-400 mb-4">{step.description}</p>
                <ul className="grid sm:grid-cols-2 gap-x-6 border-t border-white/10">
                  {step.details.map((d) => (
                    <li key={d} className="py-2.5 border-b border-white/10 text-sm text-zinc-200">
                      {d}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </section>

        {/* Session types */}
        <section aria-labelledby="types-title" className="grid lg:grid-cols-12 gap-6 lg:gap-12 mb-24 lg:mb-32">
          <div className="lg:col-span-4 border-t border-violet-400/60 pt-5">
            <h2 id="types-title" className="text-3xl font-bold text-white tracking-tight mb-2">
              Session types
            </h2>
            <p className="text-zinc-400">What each option in step 2 includes.</p>
          </div>
          <div className="lg:col-span-8 grid sm:grid-cols-3 gap-3">
            {sessionTypes.map((t) => (
              <div key={t.name} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <h3 className="text-lg font-bold text-white mb-1">{t.name}</h3>
                <p className="text-sm text-zinc-400 mb-4">{t.description}</p>
                <ul className="space-y-1.5">
                  {t.features.map((f) => (
                    <li key={f} className="text-sm text-zinc-200 pl-3 border-l-2 border-violet-400/50">
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Manage bookings */}
        <section aria-labelledby="manage-title" className="grid lg:grid-cols-12 gap-6 lg:gap-12 mb-24 lg:mb-32">
          <div className="lg:col-span-4 border-t border-violet-400/60 pt-5">
            <h2 id="manage-title" className="text-3xl font-bold text-white tracking-tight mb-2">
              Already booked?
            </h2>
            <p className="text-zinc-400">Change, cancel or check a session online.</p>
          </div>
          <div className="lg:col-span-8 grid md:grid-cols-3 gap-3">
            {manage.map((m) => (
              <div key={m.title} className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <h3 className="text-lg font-bold text-white mb-4">{m.title}</h3>
                <ol className="space-y-2.5 mb-5">
                  {m.steps.map((s, i) => (
                    <li key={s} className="flex gap-3 text-sm text-zinc-200">
                      <span className="text-violet-400 font-bold tabular-nums">{i + 1}</span>
                      {s}
                    </li>
                  ))}
                </ol>
                <p className="text-xs text-zinc-500 mb-5">{m.note}</p>
                <Link
                  href={m.href}
                  className="group mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-violet-400 hover:text-violet-300"
                >
                  {m.cta}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Good to know + cashback */}
        <section aria-labelledby="know-title" className="grid lg:grid-cols-12 gap-6 lg:gap-12 mb-24">
          <div className="lg:col-span-4 border-t border-violet-400/60 pt-5">
            <h2 id="know-title" className="text-3xl font-bold text-white tracking-tight">
              Good to know
            </h2>
          </div>
          <div className="lg:col-span-8">
            <dl className="grid sm:grid-cols-2 gap-x-6 border-t border-white/10 mb-10">
              {goodToKnow.map((n) => (
                <div key={n.title} className="py-4 border-b border-white/10">
                  <dt className="text-white font-semibold">{n.title}</dt>
                  <dd className="text-sm text-zinc-400">{n.description}</dd>
                </div>
              ))}
            </dl>

            <div className="rounded-3xl border border-violet-400/30 bg-white/[0.03] p-6 sm:p-8 mb-10">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-fuchsia-400 mb-2">Cashback</p>
              <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-3">
                ₹30 back per hour, plus <span className="text-violet-400">₹500</span> on your first booking.
              </p>
              <p className="text-zinc-400 mb-5">
                Credited when your session is completed. Reach 50 hours within 90 days to unlock a ₹2,000 payout.
              </p>
              <Link
                href="/rate-card"
                className="group inline-flex items-center gap-1.5 text-sm font-semibold text-violet-400 hover:text-violet-300"
              >
                See pricing and full cashback rules
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/booking"
                className="px-6 py-3.5 rounded-xl bg-violet-400 hover:bg-violet-300 text-navy font-semibold transition-colors"
              >
                Book a session
              </Link>
              <Link
                href="/contact"
                className="px-6 py-3.5 rounded-xl border border-white/15 hover:border-white/30 text-white font-semibold transition-colors"
              >
                Need help? Contact us
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
