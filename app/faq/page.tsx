'use client';

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Plus } from "lucide-react";
import { useState, useEffect } from "react";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSection {
  id: string;
  title: string;
  items: FAQItem[];
}

// Helper function to format time from 24h to 12h format
function formatTimeToDisplay(time: string): string {
  const [hours] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHours}:00 ${period}`;
}

// Function to generate FAQ data with dynamic operating hours
function generateFaqData(openTime: string, closeTime: string, advanceBookingDays: number): FAQSection[] {
  return [
    {
      id: "booking",
      title: "Booking",
      items: [
        {
          question: "How do I book a studio?",
          answer: "You can book directly through our website. Our system shows real-time availability for all studios. Simply select your session type, studio, and time slot to confirm your booking instantly."
        },
        {
          question: "What are your operating hours?",
          answer: `Our standard operating hours are from ${formatTimeToDisplay(openTime)} to ${formatTimeToDisplay(closeTime)}. Outside hours can be arranged with prior request.`
        },
        {
          question: "How far in advance can I book?",
          answer: `You can book from tomorrow up to ${advanceBookingDays} days in advance.`
        },
        {
          question: "What is your cancellation policy?",
          answer: "For standard 'Pay at Studio' bookings: Free cancellation with 24+ hours notice. Less than 24 hours: ₹100 fee. No-show: ₹200 penalty."
        }
      ]
    },
    {
      id: "studios",
      title: "Studios & equipment",
      items: [
        {
          question: "Which studio should I choose?",
          answer: "Studio A is our largest space (capacity 30), ideal for big bands and recordings. Studio B (capacity 10) is perfect for medium bands and karaoke. Studio C (capacity 5) is cozy and great for duets, small groups, or solo practice."
        },
        {
          question: "Do you provide instruments?",
          answer: "Yes! Studio A is fully equipped with drums, amps, keyboard, and more. Studio B & C have basic equipment suitable for their capacity. Check the specific studio details during booking for a full list."
        },
        {
          question: "Can I bring my own equipment?",
          answer: "Yes, you remain welcome to bring your own instruments and equipment."
        }
      ]
    },
    {
      id: "payment",
      title: "Payment & pricing",
      items: [
        {
          question: "Do I need to pay in advance?",
          answer: "No advance payment is needed. You pay at the studio after your session, by cash or UPI."
        },
        {
          question: "What is included in the hourly rate?",
          answer: "The rate includes the studio space, equipment, and a Sound Operator to assist you."
        },
        {
          question: "Are there any additional charges?",
          answer: "Basic amenities like WiFi are free. Additional services (recording, video production) and refreshments (snacks/beverages) are charged separately at actual cost."
        }
      ]
    },
    {
      id: "recording",
      title: "Recording",
      items: [
        {
          question: "How long does recording take?",
          answer: "Recording time varies by project. A typical song recording takes 2-4 hours. Mixing and mastering are included in the price."
        },
        {
          question: "When will I receive my recorded files?",
          answer: "Edited and mastered files are typically delivered within 3-5 business days."
        },
        {
          question: "What format will my recording be in?",
          answer: "We provide high-quality WAV and MP3 formats. Video recordings are delivered in 4K MP4 format."
        }
      ]
    },
    {
      id: "facilities",
      title: "Facilities",
      items: [
        {
          question: "Is parking available?",
          answer: "Yes, we have designated parking within our building. If full, street parking is available on the road."
        },
        {
          question: "Is WiFi available?",
          answer: "Yes, high-speed internet is available subject to availability, free of cost."
        },
        {
          question: "Can we get food and beverages?",
          answer: "Yes, tea, coffee, snacks, lunch, and dinner can be provided at additional cost based on actual price, subject to availability."
        }
      ]
    }
  ];
}

export default function FAQPage() {
  const [defaultOpenTime, setDefaultOpenTime] = useState('08:00');
  const [defaultCloseTime, setDefaultCloseTime] = useState('22:00');
  const [advanceBookingDays, setAdvanceBookingDays] = useState(30);

  // Fetch booking settings on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const data = await response.json();
          setDefaultOpenTime(data.defaultOpenTime || '08:00');
          setDefaultCloseTime(data.defaultCloseTime || '22:00');
          setAdvanceBookingDays(data.advanceBookingDays || 30);
        }
      } catch (err) {
        console.error('Error fetching booking settings:', err);
      }
    };
    fetchSettings();
  }, []);

  const faqData = generateFaqData(defaultOpenTime, defaultCloseTime, advanceBookingDays);
  const total = faqData.reduce((n, s) => n + s.items.length, 0);

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
            {total} answers · {faqData.length} topics
          </p>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.02] max-w-3xl">
            Questions, <span className="text-violet-400">answered.</span>
          </h1>
          </div>
          <Image
            src="/faq.png"
            alt="Gold studio headphones with a coiled cable curling into a question mark"
            width={1254}
            height={1254}
            priority
            sizes="(min-width: 1024px) 320px, 224px"
            className="w-56 lg:w-80 shrink-0 self-center"
          />
        </header>

        <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 mb-24">
          {/* Topic index: pinned while answers scroll */}
          <nav aria-label="FAQ topics" className="lg:col-span-3">
            <ul className="lg:sticky lg:top-28 flex lg:flex-col flex-wrap gap-2 lg:gap-0 lg:border-t lg:border-violet-400/60 lg:pt-3">
              {faqData.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="flex items-center justify-between gap-3 max-lg:px-4 max-lg:py-2 max-lg:rounded-full max-lg:border max-lg:border-white/10 lg:py-2.5 text-sm text-zinc-300 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 rounded"
                  >
                    {s.title}
                    <span className="text-zinc-500 tabular-nums">{s.items.length}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="lg:col-span-9 space-y-16">
            {faqData.map((section) => (
              <section key={section.id} id={section.id} aria-labelledby={`${section.id}-title`} className="scroll-mt-28">
                <h2 id={`${section.id}-title`} className="text-3xl font-bold text-white tracking-tight mb-4">
                  {section.title}
                </h2>
                <div className="border-t border-white/10">
                  {section.items.map((item) => (
                    <details key={item.question} className="group border-b border-white/10">
                      <summary className="flex items-center justify-between gap-6 py-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden text-lg text-white hover:text-violet-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 rounded">
                        {item.question}
                        <Plus className="w-5 h-5 shrink-0 text-violet-400 transition-transform group-open:rotate-45 motion-reduce:transition-none" />
                      </summary>
                      <p className="text-zinc-400 leading-relaxed pb-6 pr-10 max-w-3xl">{item.answer}</p>
                    </details>
                  ))}
                </div>
              </section>
            ))}

            <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Didn&apos;t find your answer?</h2>
                <p className="text-zinc-400">Call or email us and we&apos;ll sort it out.</p>
              </div>
              <div className="flex gap-3 shrink-0">
                <Link
                  href="/contact"
                  className="px-5 py-3 rounded-xl bg-violet-400 hover:bg-violet-300 text-navy font-semibold transition-colors"
                >
                  Contact us
                </Link>
                <Link
                  href="/booking/new"
                  className="px-5 py-3 rounded-xl border border-white/15 hover:border-white/30 text-white font-semibold transition-colors"
                >
                  Book a session
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
