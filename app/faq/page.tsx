'use client';

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ChevronDown, Calendar, Music, CreditCard, Mic, Building2 } from "lucide-react";
import { useState } from "react";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSection {
  title: string;
  icon: React.ReactNode;
  items: FAQItem[];
}

const faqData: FAQSection[] = [
  {
    title: "Booking",
    icon: <Calendar className="w-6 h-6" />,
    items: [
      {
        question: "How do I book a studio?",
        answer: "You can book online through our website by filling the booking request form, or contact us directly via phone."
      },
      {
        question: "What are your operating hours?",
        answer: "Our standard operating hours are from 8:00 AM to 10:00 PM. Outside hours can be arranged with prior request."
      },
      {
        question: "How far in advance can I book?",
        answer: "You can book from tomorrow up to 4 months in advance."
      },
      {
        question: "What is your cancellation policy?",
        answer: "Free cancellation with 24+ hours notice. Less than 24 hours: ₹100 fee. No-show: ₹200 penalty (payable at next booking)."
      }
    ]
  },
  {
    title: "Studios & Equipment",
    icon: <Music className="w-6 h-6" />,
    items: [
      {
        question: "Which studio should I choose?",
        answer: "Studio A is best for large bands and karaoke groups (up to 30). Studio B is ideal for medium karaoke groups (up to 12) and small bands. Studio C is perfect for recording, podcasts, and intimate sessions."
      },
      {
        question: "Do you provide instruments?",
        answer: "Yes! Studio A has drums, electric guitars, keyboard, guitar amps, and bass amp. Other studios have basic equipment. Check specific studio details for complete equipment list."
      },
      {
        question: "Can I bring my own equipment?",
        answer: "Yes, you are welcome to bring your own instruments and equipment."
      }
    ]
  },
  {
    title: "Payment & Pricing",
    icon: <CreditCard className="w-6 h-6" />,
    items: [
      {
        question: "Do I need to pay in advance?",
        answer: "No advance payment required. You pay at the studio after your session via cash or UPI."
      },
      {
        question: "What is included in the hourly rate?",
        answer: "The rate includes studio space, sound equipment, sound operator assistance, and listed instruments. Recording services are charged separately."
      },
      {
        question: "Are there any additional charges?",
        answer: "Additional services like recording, video production, internet, snacks, etc. are charged separately at actual cost."
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
        answer: "Edited and mastered files are typically delivered within 3-5 business days. Raw files can be provided immediately via SD card (₹100/hour)."
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
