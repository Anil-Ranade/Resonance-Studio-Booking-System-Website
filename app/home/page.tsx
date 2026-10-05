"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Mic,
  Radio,
  Video,
  Calendar,
  ArrowRight,
  Headphones,
  Award,
  Clock,
  Users,
  Guitar,
  Speaker,
  MonitorPlay,
  Plus,
  Edit3,
  X,
  Eye,
  Phone,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Building2,
  Check,
  Shield,
  RefreshCw,
} from "lucide-react";

// Helper function to safely parse JSON responses
async function safeJsonParse(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    console.error("Failed to parse response as JSON:", text.substring(0, 200));
    throw new Error("Server returned an invalid response. Please try again.");
  }
}

interface Booking {
  id: string;
  studio: string;
  session_type: string;
  session_details?: string;
  date: string;
  start_time: string;
  end_time: string;
  status: "pending" | "confirmed" | "cancelled" | "completed" | "no_show";
  total_amount: number;
  phone_number: string;
  name?: string;
}

type ActionMode = "change" | "cancel" | "view" | null;

// Optimized animation variants - shorter durations for better performance
export default function HomePage() {
  const router = useRouter();

  // Modal state for Change/Cancel/View flows
  const [actionMode, setActionMode] = useState<ActionMode>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [step, setStep] = useState<
    "phone" | "select" | "view" | "cancel-confirm" | "success"
  >("phone");

  // Loading state for cancel
  const [isCancelling, setIsCancelling] = useState(false);

  // Our spaces: which room the selector is showing
  const [activeStudio, setActiveStudio] = useState(0);

  const resetModal = () => {
    setActionMode(null);
    setPhoneNumber("");
    setError("");
    setBookings([]);
    setSelectedBooking(null);
    setStep("phone");
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHour}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  const handleFetchBookings = async () => {
    const normalized = phoneNumber.replace(/\D/g, "");
    if (normalized.length !== 10) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/bookings/upcoming?phone=${normalized}`
      );
      const data = await safeJsonParse(response);

      if (data.error) {
        throw new Error(data.error);
      }

      setBookings(data.bookings || []);

      if ((data.bookings || []).length === 0) {
        setError("No upcoming bookings found for this phone number");
      } else {
        setStep("select");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch bookings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectBooking = (booking: Booking) => {
    setSelectedBooking(booking);

    if (actionMode === "view") {
      setStep("view");
    } else if (actionMode === "cancel") {
      setStep("cancel-confirm");
    } else if (actionMode === "change") {
      // Navigate to booking page with edit mode and pre-filled data
      const bookingData = {
        editMode: true,
        originalBookingId: booking.id,
        sessionType: booking.session_type,
        sessionDetails: booking.session_details,
        studio: booking.studio,
        date: booking.date,
        start_time: booking.start_time,
        end_time: booking.end_time,
        phone_number: booking.phone_number,
        name: booking.name,
        total_amount: booking.total_amount,
      };
      sessionStorage.setItem("editBookingData", JSON.stringify(bookingData));
      router.push("/booking");
    }
  };

  // Cancel booking directly without OTP
  const handleConfirmCancel = async () => {
    if (!selectedBooking) {
      setError("No booking selected");
      return;
    }

    setIsCancelling(true);
    setError("");

    try {
      const response = await fetch("/api/bookings/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: selectedBooking.id,
          phone: phoneNumber,
          reason: "Cancelled by user",
        }),
      });

      const data = await safeJsonParse(response);

      if (!response.ok) {
        throw new Error(data.error || "Failed to cancel booking");
      }

      setStep("success");

      setTimeout(() => {
        resetModal();
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel booking");
    } finally {
      setIsCancelling(false);
    }
  };

  // Grouped by where the service happens; prices mirror /rate-card.
  const serviceGroups = [
    {
      label: "In the studio",
      items: [
        {
          icon: <Guitar className="w-5 h-5" />,
          title: "Rehearsal rooms",
          description: "Three treated rooms for bands, solo practice & karaoke",
          price: "₹200",
          unit: "/hr onwards",
          href: "/studios",
        },
        {
          icon: <Mic className="w-5 h-5" />,
          title: "Audio recording",
          description: "Recording, editing, mixing & mastering",
          price: "₹700",
          unit: "/song",
          href: "/rate-card",
        },
        {
          icon: <Video className="w-5 h-5" />,
          title: "Video recording",
          description: "True 4K video with professional editing",
          price: "₹800",
          unit: "/song",
          href: "/rate-card",
        },
        {
          icon: <MonitorPlay className="w-5 h-5" />,
          title: "Green screen",
          description: "Chroma key setup for music videos",
          price: "₹1,200",
          unit: "/song",
          href: "/rate-card",
        },
      ],
    },
    {
      label: "We come to you",
      items: [
        {
          icon: <Radio className="w-5 h-5" />,
          title: "Live streaming",
          description: "Multi-camera Facebook Live setup with live sound",
          price: "₹7,000",
          unit: "/4 hrs",
          href: "/rate-card",
        },
        {
          icon: <Speaker className="w-5 h-5" />,
          title: "Sound system rental",
          description: "PA, mixer & mics for outside shows and events",
          price: "On request",
          unit: "",
          href: "/contact",
        },
      ],
    },
  ];

  const studios = [
    {
      name: "Studio A",
      size: "Large",
      tagline: "Big live rehearsals & karaoke groups",
      live: "10-12 musicians",
      liveMax: 12,
      karaoke: "Up to 30 people",
      karaokeMax: 30,
      price: 350,
      image: "/studios/main/studio_a.jpeg",
      id: "studio-a",
    },
    {
      name: "Studio B",
      size: "Medium",
      tagline: "Versatile space, great for karaoke groups",
      live: "4-5 musicians",
      liveMax: 5,
      karaoke: "Up to 10 people",
      karaokeMax: 10,
      price: 250,
      image: "/studios/main/studio_b.jpeg",
      id: "studio-b",
    },
    {
      name: "Studio C",
      size: "Compact",
      tagline: "Audio/video recording & podcasts",
      live: "Up to 2 musicians",
      liveMax: 2,
      karaoke: "Up to 5 people",
      karaokeMax: 5,
      price: 200,
      image: "/studios/main/studio_c.jpeg",
      id: "studio-c",
    },
  ];

  const stats = [
    { value: "10+", label: "years running the studio" },
    { value: "3", label: "acoustically treated rooms" },
    { value: "1,000+", label: "musicians & groups hosted" },
  ];


  return (
    // -mt cancels MainContent pt so the hero bg runs under the floating nav
    <div className="min-h-screen overflow-hidden -mt-16 md:-mt-20">
      {/* Hero Section */}
      <section className="relative min-h-[100svh] flex items-center pt-28 pb-16 sm:pt-32 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-10" />
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-[140px]" />

        <div
          className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-16 items-center w-full"
        >
          <div className="text-center lg:text-left">
            <p
              className="inline-flex items-center gap-2 text-sm font-medium text-violet-300 mb-6"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Open daily · 8 AM - 10 PM
            </p>

            <h1
              className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] mb-6"
            >
              <span className="text-white block">Where Music</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-600">
                Comes Alive
              </span>
            </h1>

            <p
              className="text-lg text-zinc-400 max-w-xl mx-auto lg:mx-0 mb-10 leading-relaxed"
            >
              Three acoustically treated studios for karaoke, live rehearsals,
              band practice and professional audio &amp; video recording.
            </p>

            <div
              className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-6"
            >
              <Link
                href="/booking"
                className="group inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-navy font-semibold transition-colors"
              >
                <Calendar className="w-5 h-5" />
                Book a Session
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/studios"
                className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl border border-white/15 hover:border-white/30 hover:bg-white/5 text-white font-semibold transition-colors"
              >
                <Building2 className="w-5 h-5" />
                Explore Studios
              </Link>
            </div>

            <p className="text-sm text-zinc-500">
              New, edit, cancel or view bookings online ·{" "}
              <Link
                href="/how-to-book"
                className="text-amber-400 hover:text-amber-300 underline underline-offset-4"
              >
                How to book &amp; exclusive schemes
              </Link>
            </p>
          </div>

          <div className="relative">
            <div className="relative aspect-square max-w-md sm:max-w-lg lg:max-w-none mx-auto">
              <Image
                src="/hero.png"
                alt="Vintage studio microphone surrounded by sound waves and music notes"
                fill
                priority
                sizes="(min-width: 1024px) 45vw, (min-width: 640px) 512px, 448px"
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Studios Preview Section: room selector */}
      <section aria-labelledby="spaces-title" className="py-24 lg:py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <header className="mb-12 lg:mb-16 max-w-3xl">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-fuchsia-400 mb-4">
              Our spaces · {studios.length} rooms
            </p>
            <h2 id="spaces-title" className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-[1.05]">
              Three rooms, <span className="text-violet-400">sized for how you play.</span>
            </h2>
          </header>

          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Photo: all three stacked, active one fades in */}
            <div className="lg:col-span-7 lg:order-2 relative aspect-[4/3] rounded-3xl overflow-hidden border border-white/10 bg-zinc-900">
              {studios.map((s, i) => (
                <Image
                  key={s.id}
                  src={s.image}
                  alt={i === activeStudio ? `${s.name} at Resonance Studio` : ""}
                  fill
                  sizes="(min-width: 1024px) 58vw, 100vw"
                  className={`object-cover transition-opacity duration-500 motion-reduce:transition-none ${
                    i === activeStudio ? "opacity-100" : "opacity-0"
                  }`}
                />
              ))}
              <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-navy/70 backdrop-blur-sm border border-white/15 text-white text-xs font-medium">
                {studios[activeStudio].size} room
              </span>
            </div>

            {/* Room list */}
            <div className="lg:col-span-5 lg:order-1">
              <ul className="border-t border-white/10">
                {studios.map((s, i) => {
                  const active = i === activeStudio;
                  return (
                    <li key={s.id} className="border-b border-white/10">
                      <button
                        type="button"
                        aria-pressed={active}
                        onClick={() => setActiveStudio(i)}
                        onMouseEnter={() => setActiveStudio(i)}
                        onFocus={() => setActiveStudio(i)}
                        className={`w-full flex items-center justify-between gap-4 py-5 pl-4 text-left border-l-2 transition-colors focus-visible:outline-none focus-visible:bg-white/[0.04] ${
                          active ? "border-violet-400" : "border-transparent hover:border-white/20"
                        }`}
                      >
                        <span>
                          <span className={`block text-2xl sm:text-3xl font-bold tracking-tight transition-colors ${active ? "text-white" : "text-zinc-500"}`}>
                            {s.name}
                          </span>
                          <span className={`block text-sm transition-colors ${active ? "text-zinc-300" : "text-zinc-500"}`}>
                            {s.tagline}
                          </span>
                        </span>
                        <span className="text-right shrink-0">
                          <span className={`block text-xl font-bold tabular-nums ${active ? "text-violet-400" : "text-zinc-500"}`}>
                            ₹{s.price}
                          </span>
                          <span className="text-xs text-zinc-500">from /hr</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              {/* Active room detail */}
              <div className="mt-8 space-y-5" aria-live="polite">
                {[
                  { label: "Live band", detail: studios[activeStudio].live, value: studios[activeStudio].liveMax, max: 12 },
                  { label: "Karaoke", detail: studios[activeStudio].karaoke, value: studios[activeStudio].karaokeMax, max: 30 },
                ].map((m) => {
                  const lit = Math.max(1, Math.round((m.value / m.max) * 12));
                  return (
                    <div key={m.label}>
                      <div className="flex justify-between text-xs font-medium uppercase tracking-[0.14em] mb-2">
                        <span className="text-zinc-400">{m.label}</span>
                        <span className="text-white">{m.detail}</span>
                      </div>
                      <div className="flex gap-1" role="img" aria-label={`${m.label}: ${m.detail}`}>
                        {Array.from({ length: 12 }, (_, i) => (
                          <span
                            key={i}
                            className={`h-2.5 flex-1 rounded-[2px] transition-colors duration-300 ${
                              i >= lit ? "bg-white/[0.07]" : i >= 10 ? "bg-fuchsia-400" : "bg-violet-400"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                <Link
                  href="/booking"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-violet-400 hover:bg-violet-300 text-navy font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy"
                >
                  <Calendar className="w-5 h-5" />
                  Book {studios[activeStudio].name}
                </Link>
                <Link
                  href={`/studios#${studios[activeStudio].id}`}
                  className="group inline-flex items-center gap-1.5 text-sm font-semibold text-violet-400 hover:text-violet-300"
                >
                  Room details
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-[0.8fr_1.2fr] gap-12 lg:gap-20">
          <div className="lg:sticky lg:top-32 lg:self-start text-center lg:text-left">
            <span className="inline-block px-4 py-1.5 rounded-full bg-fuchsia-400/10 border border-fuchsia-400/25 text-fuchsia-300 text-sm font-medium mb-5">
              What we offer
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white leading-[1.1] mb-5">
              Rehearse, record
              <span className="block text-violet-400">and go live.</span>
            </h2>
            <p className="text-zinc-400 max-w-md mx-auto lg:mx-0 mb-8 leading-relaxed">
              From your first jam to the final music video, everything happens
              under one roof. Prices below are starting rates.
            </p>
            <Link
              href="/rate-card"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-violet-400/40 text-violet-300 hover:bg-violet-400/10 font-semibold transition-colors"
            >
              See full rate card <ArrowRight className="w-4 h-4" />
            </Link>
            {/* Desktop only: on mobile this column stacks above the price list */}
            <Image
              src="/whatweoffer.png"
              alt="Guitar, studio headphones and video camera linked by a sound wave"
              width={1448}
              height={1086}
              sizes="(min-width: 1024px) 480px, 0px"
              className="hidden lg:block w-full max-w-md mt-10"
            />
          </div>

          <div className="space-y-10">
            {serviceGroups.map((group) => (
              <div key={group.label}>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 mb-3 px-1">
                  {group.label}
                </p>
                <ul className="rounded-2xl border border-white/10 bg-white/[0.03] divide-y divide-white/10 overflow-hidden">
                  {group.items.map((item) => (
                    <li key={item.title}>
                      <Link
                        href={item.href}
                        className="group flex items-center gap-4 sm:gap-5 px-5 sm:px-6 py-5 hover:bg-white/[0.04] focus-visible:bg-white/[0.06] focus-visible:outline-none transition-colors"
                      >
                        <span className="shrink-0 w-11 h-11 rounded-full border border-violet-400/30 bg-violet-400/10 text-violet-400 flex items-center justify-center group-hover:bg-violet-400 group-hover:text-navy transition-colors">
                          {item.icon}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-white font-semibold text-lg">
                            {item.title}
                          </span>
                          <span className="block text-zinc-400 text-sm">
                            {item.description}
                          </span>
                        </span>
                        <span className="shrink-0 text-right">
                          <span className="block text-violet-400 font-bold text-xl tabular-nums">
                            {item.price}
                          </span>
                          {item.unit && (
                            <span className="block text-zinc-500 text-xs">{item.unit}</span>
                          )}
                        </span>
                        <ArrowRight className="hidden sm:block shrink-0 w-4 h-4 text-zinc-600 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] overflow-hidden">
            <dl className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/10">
              {stats.map((stat) => (
                <div key={stat.label} className="px-6 py-8 text-center sm:text-left">
                  <dt className="sr-only">{stat.label}</dt>
                  <dd className="text-5xl font-bold text-violet-400 tabular-nums tracking-tight">
                    {stat.value}
                  </dd>
                  <dd className="text-zinc-400 text-sm mt-1">{stat.label}</dd>
                </div>
              ))}
            </dl>
            <OpenHoursBar />
          </div>
        </div>
      </section>

      {/* CTA Section: styled as a gig ticket with a tear-off stub */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="ticket-notches relative grid md:grid-cols-[1fr_auto] rounded-[2rem] bg-gradient-to-br from-violet-300 via-violet-400 to-violet-500 text-navy">
            <div className="p-8 sm:p-12">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-navy/60 mb-4">
                Admit your band · Open daily 8 AM - 10 PM
              </p>
              <h2 className="text-4xl sm:text-5xl font-bold leading-[1.05] mb-5">
                Ready to make
                <br />
                some noise?
              </h2>
              <p className="text-navy/75 text-lg max-w-md mb-8">
                Pick a room and a time slot online. Nothing to pay upfront; settle
                up after your session.
              </p>
              <ul className="flex flex-wrap gap-2 text-sm font-medium">
                {["No advance payment", "Edit or cancel online", "3 rooms to choose from"].map((item) => (
                  <li
                    key={item}
                    className="inline-flex items-center gap-1.5 rounded-full bg-navy/10 px-3 py-1.5"
                  >
                    <Check className="w-4 h-4" /> {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Perforation: dashed rule; notches are masked out by .ticket-notches */}
            <div className="relative border-t-2 md:border-t-0 md:border-l-2 border-dashed border-navy/25 p-8 sm:p-12 flex flex-col justify-center gap-4 md:w-80">
              <Link
                href="/booking"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-navy px-6 py-4 font-semibold text-white hover:bg-navy/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy transition-colors"
              >
                <Calendar className="w-5 h-5" />
                Book a session
              </Link>
              <a
                href="tel:+919822029235"
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-navy/20 px-6 py-3.5 font-semibold hover:border-navy/40 transition-colors"
              >
                <Phone className="w-4 h-4" />
                +91 98220 29235
              </a>
              <Link
                href="/contact"
                className="text-center text-sm font-medium text-navy/70 underline underline-offset-4 hover:text-navy"
              >
                More ways to reach us
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Modal for Change/Cancel/View flows */}
      <>
        {actionMode && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={resetModal}
            />

            {/* Modal Content */}
            <div
              className="relative w-full max-w-lg glass-strong rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
            >
              {/* Close Button */}
              <button
                onClick={resetModal}
                className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Phone Input Step */}
              {step === "phone" && (
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        actionMode === "change"
                          ? "bg-blue-500/20"
                          : actionMode === "cancel"
                          ? "bg-red-500/20"
                          : "bg-emerald-500/20"
                      }`}
                    >
                      {actionMode === "change" && (
                        <Edit3 className="w-6 h-6 text-blue-400" />
                      )}
                      {actionMode === "cancel" && (
                        <X className="w-6 h-6 text-red-400" />
                      )}
                      {actionMode === "view" && (
                        <Eye className="w-6 h-6 text-emerald-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {actionMode === "change" && "Change Booking"}
                        {actionMode === "cancel" && "Cancel Booking"}
                        {actionMode === "view" && "View Booking"}
                      </h3>
                      <p className="text-zinc-400 text-sm">
                        Enter your phone number to find your bookings
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="phone"
                        className="block text-sm font-medium text-zinc-400 mb-2.5"
                      >
                        Phone Number
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                        <input
                          type="tel"
                          id="phone"
                          value={phoneNumber}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, "");
                            setPhoneNumber(value);
                            setError("");
                          }}
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleFetchBookings()
                          }
                          placeholder="Enter 10-digit number"
                          className="w-full py-3.5 pl-12 pr-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                          maxLength={10}
                          autoComplete="tel"
                          inputMode="numeric"
                        />
                      </div>
                    </div>

                    {error && (
                      <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                        <span className="text-red-400 text-sm">{error}</span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleFetchBookings}
                      disabled={
                        isLoading ||
                        phoneNumber.replace(/\D/g, "").length !== 10
                      }
                      className={`w-full py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                        actionMode === "change"
                          ? "bg-blue-500 hover:bg-blue-600"
                          : actionMode === "cancel"
                          ? "bg-red-500 hover:bg-red-600"
                          : "bg-emerald-500 hover:bg-emerald-600"
                      } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Searching...
                        </>
                      ) : (
                        <>
                          Find My Bookings
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}

              {/* Booking Selection Step */}
              {step === "select" && (
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        actionMode === "change"
                          ? "bg-blue-500/20"
                          : actionMode === "cancel"
                          ? "bg-red-500/20"
                          : "bg-emerald-500/20"
                      }`}
                    >
                      <Calendar
                        className={`w-6 h-6 ${
                          actionMode === "change"
                            ? "text-blue-400"
                            : actionMode === "cancel"
                            ? "text-red-400"
                            : "text-emerald-400"
                        }`}
                      />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        Select Booking
                      </h3>
                      <p className="text-zinc-400 text-sm">
                        {actionMode === "change" &&
                          "Choose the booking you want to modify"}
                        {actionMode === "cancel" &&
                          "Choose the booking you want to cancel"}
                        {actionMode === "view" &&
                          "Choose the booking you want to view"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4 max-h-[50vh] overflow-y-auto">
                    {bookings.map((booking) => (
                      <button
                        key={booking.id}
                        type="button"
                        onClick={() => handleSelectBooking(booking)}
                        className={`w-full p-4 rounded-xl border text-left transition-all ${
                          selectedBooking?.id === booking.id
                            ? actionMode === "change"
                              ? "bg-blue-500/20 border-blue-500"
                              : actionMode === "cancel"
                              ? "bg-red-500/20 border-red-500"
                              : "bg-emerald-500/20 border-emerald-500"
                            : "bg-white/5 border-white/10 hover:border-white/20"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Mic className="w-4 h-4 text-violet-400" />
                              <span className="text-white font-medium">
                                {booking.session_type}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="flex items-center gap-2 text-zinc-400">
                                <Building2 className="w-4 h-4" />
                                {booking.studio}
                              </div>
                              <div className="flex items-center gap-2 text-zinc-400">
                                <Calendar className="w-4 h-4" />
                                {formatDate(booking.date)}
                              </div>
                              <div className="flex items-center gap-2 text-zinc-400 col-span-2">
                                <Clock className="w-4 h-4" />
                                {formatTime(booking.start_time)} -{" "}
                                {formatTime(booking.end_time)}
                              </div>
                            </div>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              selectedBooking?.id === booking.id
                                ? actionMode === "change"
                                  ? "bg-blue-500 border-blue-500"
                                  : actionMode === "cancel"
                                  ? "bg-red-500 border-red-500"
                                  : "bg-emerald-500 border-emerald-500"
                                : "border-zinc-500"
                            }`}
                          >
                            {selectedBooking?.id === booking.id && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      setStep("phone");
                      setSelectedBooking(null);
                      setError("");
                    }}
                    className="w-full text-center text-zinc-500 hover:text-zinc-300 text-sm font-medium transition-colors"
                  >
                    ← Back to phone number
                  </button>
                </>
              )}

              {/* View Booking Details Step */}
              {step === "view" && selectedBooking && (
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                      <Eye className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        Booking Details
                      </h3>
                      <p className="text-zinc-400 text-sm">
                        ID: {selectedBooking.id.slice(0, 8)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-center py-3 border-b border-white/10">
                      <div className="flex items-center gap-3">
                        <Mic className="w-5 h-5 text-zinc-500" />
                        <span className="text-zinc-400">Session Type</span>
                      </div>
                      <span className="text-white font-medium">
                        {selectedBooking.session_type}
                      </span>
                    </div>
                    {selectedBooking.session_details && (
                      <div className="flex justify-between items-center py-3 border-b border-white/10">
                        <div className="flex items-center gap-3">
                          <Users className="w-5 h-5 text-zinc-500" />
                          <span className="text-zinc-400">Details</span>
                        </div>
                        <span className="text-white font-medium">
                          {selectedBooking.session_details}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center py-3 border-b border-white/10">
                      <div className="flex items-center gap-3">
                        <Building2 className="w-5 h-5 text-zinc-500" />
                        <span className="text-zinc-400">Studio</span>
                      </div>
                      <span className="text-white font-medium">
                        {selectedBooking.studio}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-white/10">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-zinc-500" />
                        <span className="text-zinc-400">Date</span>
                      </div>
                      <span className="text-white font-medium">
                        {formatDate(selectedBooking.date)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-white/10">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-zinc-500" />
                        <span className="text-zinc-400">Time</span>
                      </div>
                      <span className="text-white font-medium">
                        {formatTime(selectedBooking.start_time)} -{" "}
                        {formatTime(selectedBooking.end_time)}
                      </span>
                    </div>
                    {selectedBooking.total_amount && (
                      <div className="flex justify-between items-center py-3">
                        <div className="flex items-center gap-3">
                          <span className="text-zinc-400">Total Amount</span>
                        </div>
                        <span className="text-emerald-400 font-bold text-lg">
                          ₹
                          {selectedBooking.total_amount.toLocaleString("en-IN")}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setStep("select");
                        setSelectedBooking(null);
                      }}
                      className="flex-1 py-3 rounded-xl border border-white/10 text-zinc-400 font-medium hover:bg-white/5 transition-colors"
                    >
                      ← Back
                    </button>
                    <button
                      onClick={resetModal}
                      className="flex-1 py-3 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </>
              )}

              {/* Cancel Confirmation Step */}
              {step === "cancel-confirm" && selectedBooking && (
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                      <X className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        Confirm Cancellation
                      </h3>
                      <p className="text-zinc-400 text-sm">
                        This action requires verification
                      </p>
                    </div>
                  </div>

                  {/* Booking Summary */}
                  <div className="bg-white/5 rounded-xl p-4 mb-6">
                    <div className="flex items-center gap-3 mb-3">
                      <Mic className="w-5 h-5 text-violet-400" />
                      <span className="text-white font-medium">
                        {selectedBooking.session_type}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2 text-zinc-400">
                        <Building2 className="w-4 h-4" />
                        {selectedBooking.studio}
                      </div>
                      <div className="flex items-center gap-2 text-zinc-400">
                        <Calendar className="w-4 h-4" />
                        {formatDate(selectedBooking.date)}
                      </div>
                      <div className="flex items-center gap-2 text-zinc-400 col-span-2">
                        <Clock className="w-4 h-4" />
                        {formatTime(selectedBooking.start_time)} -{" "}
                        {formatTime(selectedBooking.end_time)}
                      </div>
                    </div>
                  </div>

                  <p className="text-zinc-400 text-sm mb-6 text-center">
                    Are you sure you want to cancel this booking? This action
                    cannot be undone.
                  </p>

                  {error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                      <span className="text-red-400 text-sm">{error}</span>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setStep("select");
                        setSelectedBooking(null);
                        setError("");
                      }}
                      className="flex-1 py-3 rounded-xl border border-white/10 text-zinc-400 font-medium hover:bg-white/5 transition-colors"
                    >
                      Keep Booking
                    </button>
                    <button
                      onClick={handleConfirmCancel}
                      disabled={isCancelling}
                      className="flex-1 py-3 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isCancelling ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <X className="w-4 h-4" />
                          Cancel Booking
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}

              {/* Success Step */}
              {step === "success" && (
                <div className="text-center py-4">
                  <div
                    className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4"
                  >
                    <CheckCircle2 className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Booking Cancelled
                  </h3>
                  <p className="text-zinc-400">
                    Your booking has been successfully cancelled.
                  </p>
                  <p className="text-zinc-500 text-sm mt-2">
                    A cancellation email has been sent to your email address.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </>
    </div>
  );
}

const OPEN_HOUR = 8;
const CLOSE_HOUR = 22;

// Today's opening hours as a DAW-style timeline with a playhead at the current IST time.
function OpenHoursBar() {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => {
      const [h, m] = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
        .format(new Date())
        .split(":")
        .map(Number);
      setNow(h + m / 60);
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  const open = now !== null && now >= OPEN_HOUR && now < CLOSE_HOUR;
  const progress = open ? ((now - OPEN_HOUR) / (CLOSE_HOUR - OPEN_HOUR)) * 100 : 0;
  const ticks = [8, 10, 12, 14, 16, 18, 20, 22];
  const label = (h: number) => `${h % 12 || 12} ${h < 12 ? "AM" : "PM"}`;

  return (
    <div className="border-t border-white/10 px-6 py-7">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
        <p className="text-white font-semibold">Open every day, 8 AM - 10 PM</p>
        {now !== null && (
          <p className="inline-flex items-center gap-2 text-sm font-medium">
            <span
              className={`w-2 h-2 rounded-full ${open ? "bg-emerald-400" : "bg-fuchsia-400"}`}
            />
            <span className={open ? "text-emerald-300" : "text-fuchsia-300"}>
              {open ? "Open now · closes 10 PM" : "Closed now · opens 8 AM"}
            </span>
          </p>
        )}
      </div>

      <div className="relative h-3 rounded-full bg-white/10" aria-hidden="true">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-violet-700 to-violet-400"
          style={{ width: `${progress}%` }}
        />
        {open && (
          <div
            className="absolute -top-1.5 -bottom-1.5 w-0.5 bg-white rounded-full shadow-[0_0_12px_rgba(252,251,251,0.8)]"
            style={{ left: `${progress}%` }}
          />
        )}
      </div>

      <div className="relative h-5 mt-2 text-[11px] text-zinc-500 tabular-nums" aria-hidden="true">
        {ticks.map((h, i) => (
          <span
            key={h}
            className={`absolute whitespace-nowrap -translate-x-1/2 first:translate-x-0 last:-translate-x-full ${i % 2 && i < ticks.length - 1 ? "hidden sm:block" : ""}`}
            style={{ left: `${((h - OPEN_HOUR) / (CLOSE_HOUR - OPEN_HOUR)) * 100}%` }}
          >
            {label(h)}
          </span>
        ))}
      </div>
    </div>
  );
}

