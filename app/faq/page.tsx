'use client';

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ChevronDown, Calendar, Music, CreditCard, Mic, Building2 } from "lucide-react";
import { useState, useEffect } from "react";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSection {
  title: string;
  icon: React.ReactNode;
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
      title: "Booking",
      icon: <Calendar className="w-6 h-6" />,
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
          answer: "For standard 'Pay at Studio' bookings: Free cancellation with 24+ hours notice. Less than 24 hours: ₹100 fee. No-show: ₹200 penalty. For 'Pay Now & Save' bookings: Strictly non-cancellable, but can be rescheduled up to 24 hours prior."
        }
      ]
    },
    {
      title: "Studios & Equipment",
      icon: <Music className="w-6 h-6" />,
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
      title: "Payment & Pricing",
      icon: <CreditCard className="w-6 h-6" />,
      items: [
        {
          question: "Do I need to pay in advance?",
          answer: "Advance payment is optional. You can choose 'Pay Now & Save' to get an instant discount (₹20/hr off), or choose 'Pay at Studio' to pay after your session via cash or UPI."
        },
        {
          question: "What is included in the hourly rate?",
          answer: "The rate includes the studio space, equipment, and a Sound Operator to assist you. If you don't need a Sound Operator (e.g. for self-managed practice), you can opt-out for a discount (₹50/hr off)."
        },
        {
          question: "Are there any additional charges?",
          answer: "Basic amenities like WiFi are free. Additional services (recording, video production) and refreshments (snacks/beverages) are charged separately at actual cost."
        }
      ]
    },
    {
      title: "Recording Services",
      icon: <Mic className="w-6 h-6" />,
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
      title: "Facilities",
      icon: <Building2 className="w-6 h-6" />,
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

function FAQAccordion({ item, isOpen, onToggle }: { item: FAQItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <motion.div 
      className="border-b border-white/5 last:border-b-0"
      initial={false}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-5 text-left group"
      >
        <span className="text-white font-medium pr-4 group-hover:text-violet-400 transition-colors">
          {item.question}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0"
        >
          <ChevronDown className="w-5 h-5 text-zinc-400 group-hover:text-violet-400 transition-colors" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="text-zinc-400 pb-5 pr-8">
              {item.answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function FAQSectionComponent({ section, sectionIndex }: { section: FAQSection; sectionIndex: number }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <motion.div
      className="glass rounded-3xl p-6 md:p-8"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: sectionIndex * 0.1 }}
    >
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-400">
          {section.icon}
        </div>
        <h2 className="text-2xl font-bold text-white">{section.title}</h2>
      </div>
      <div className="divide-y divide-white/5">
        {section.items.map((item, index) => (
          <FAQAccordion
            key={index}
            item={item}
            isOpen={openIndex === index}
            onToggle={() => setOpenIndex(openIndex === index ? null : index)}
          />
        ))}
      </div>
    </motion.div>
  );
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

  // Generate FAQ data with dynamic settings
  const faqData = generateFaqData(defaultOpenTime, defaultCloseTime, advanceBookingDays);

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div 
          className="mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link 
            href="/home"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </Link>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Frequently Asked Questions</h1>
          <p className="text-zinc-400 text-lg max-w-2xl">
            Find answers to common questions about our studios, booking process, and services.
          </p>
        </motion.div>

        {/* FAQ Sections */}
        <div className="space-y-8">
          {faqData.map((section, index) => (
            <FAQSectionComponent key={section.title} section={section} sectionIndex={index} />
          ))}
        </div>

        {/* Contact CTA */}
        <motion.div 
          className="mt-12 glass-strong rounded-3xl p-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h3 className="text-2xl font-bold text-white mb-3">Still have questions?</h3>
          <p className="text-zinc-400 mb-6">
            Can&apos;t find what you&apos;re looking for? We&apos;re here to help!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/contact"
              className="btn-primary"
            >
              Contact Us
            </Link>
            <Link 
              href="/booking/new"
              className="px-6 py-3 rounded-xl border border-violet-500/50 text-violet-400 hover:bg-violet-500/10 transition-colors font-medium"
            >
              Book a Studio
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
