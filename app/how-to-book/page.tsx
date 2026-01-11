"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Edit3,
  X,
  Eye,
  Check,
  Award,
  Headphones,
  RefreshCw,
  Shield,
  Calendar,
  Clock,
  Building2,
  Users,
  Phone,
  CreditCard,
  Sparkles,
  Music,
  Mic,
  Guitar,
  ChevronRight,
  MessageCircle,
  Mail,
  Info,
  AlertCircle,
  CheckCircle2,
  CircleDot,
} from "lucide-react";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function HowToBookPage() {
  const bookingSteps = [
    {
      title: "Choose Action",
      description: "Select what you want to do",
      details: [
        "Click on 'For Online Booking' link on homepage",
        "You'll see 4 options: New Booking, Edit, Cancel, View",
        "Select 'New Booking' to create a new session",
        "Progress bar shows 8 steps in the booking flow",
      ],
      icon: <CircleDot className="w-6 h-6" />,
      color: "violet",
    },
    {
      title: "Select Session Type",
      description: "Choose your session category",
      details: [
        "Karaoke – Sing along to your favorite songs with lyrics on screen",
        "Live with Musicians – Perform with professional accompanying musicians",
        "Band Practice – Full band rehearsal with all equipment",
        "Meetings/Classes – Use studio space for non-music activities",
      ],
      icon: <Music className="w-6 h-6" />,
      color: "emerald",
    },
    {
      title: "Choose Studio",
      description: "Pick the right studio for your needs",
      details: [
        "Studio A (Large) – Up to 30 people, from ₹350/hr, ideal for parties",
        "Studio B (Medium) – Up to 10 people, from ₹250/hr, perfect for small groups",
        "Studio C (Compact) – Up to 5 people, from ₹200/hr, great for solo/duo",
        "System auto-suggests best studio based on your session type",
      ],
      icon: <Building2 className="w-6 h-6" />,
      color: "blue",
    },
    {
      title: "Pick Date & Time",
      description: "Select your preferred schedule",
      details: [
        "Calendar shows available dates (unavailable dates grayed out)",
        "Time slots displayed in available blocks (e.g., 8AM-2PM, 4PM-10PM)",
        "Select your START time first, then END time",
        "Minimum booking: 1 hour, Operating hours: 8:00 AM – 10:00 PM",
      ],
      icon: <Calendar className="w-6 h-6" />,
      color: "purple",
    },
    {
      title: "Add Participants",
      description: "Specify number of attendees",
      details: [
        "For Karaoke: Enter number of singers (affects pricing tier)",
        "For Band: Select musicians and instruments needed",
        "For Live: Choose number of accompanying musicians",
        "System calculates correct pricing based on participant count",
      ],
      icon: <Users className="w-6 h-6" />,
      color: "pink",
    },
    {
      title: "Review Booking",
      description: "Check all your selections",
      details: [
        "See complete summary: session type, studio, date, time, participants",
        "View itemized pricing",
        "Confirm your booking details",
      ],
      icon: <Eye className="w-6 h-6" />,
      color: "amber",
    },
    {
      title: "Confirm Booking",
      description: "Complete your reservation",
      details: [
        "Verify OTP sent to your mobile number",
        "Receive instant booking confirmation on screen",
        "Get WhatsApp/SMS confirmation with booking ID",
        "Email confirmation sent if email was provided",
      ],
      icon: <CheckCircle2 className="w-6 h-6" />,
      color: "emerald",
    },
  ];

  const sessionTypes = [
    {
      name: "Karaoke",
      description: "Sing along with lyrics on large TV screens",
      features: ["50,000+ song library", "Hindi, English, Marathi songs", "Professional sound system", "Party lighting available"],
      icon: <Mic className="w-8 h-8" />,
      color: "violet",
    },
    {
      name: "Live with Musicians",
      description: "Perform with professional accompanying musicians",
      features: ["Skilled musicians available", "All instruments provided", "Recording options", "Perfect for practice"],
      icon: <Guitar className="w-8 h-8" />,
      color: "blue",
    },
    {
      name: "Band Practice",
      description: "Full band rehearsal with professional equipment",
      features: ["Complete drum kit", "Guitar & bass amplifiers", "Keyboard available", "PA system included"],
      icon: <Music className="w-8 h-8" />,
      color: "emerald",
    },
  ];

  const importantNotes = [
    {
      title: "No Advance Payment Required",
      description: "Pay at the studio after your session. We trust our customers!",
      icon: <CreditCard className="w-5 h-5" />,
    },
    {
      title: "Free Cancellation",
      description: "Cancel for free with 24+ hours notice. No questions asked.",
      icon: <Shield className="w-5 h-5" />,
    },
    {
      title: "Easy Rescheduling",
      description: "Change your booking date/time anytime with 24 hours notice.",
      icon: <RefreshCw className="w-5 h-5" />,
    },
    {
      title: "Confirmation via WhatsApp",
      description: "Receive instant confirmation and reminders on WhatsApp.",
      icon: <MessageCircle className="w-5 h-5" />,
    },
  ];

  const colorClasses: Record<string, { bg: string; border: string; text: string }> = {
    violet: { bg: "bg-violet-500/20", border: "border-violet-500/30", text: "text-violet-400" },
    emerald: { bg: "bg-emerald-500/20", border: "border-emerald-500/30", text: "text-emerald-400" },
    blue: { bg: "bg-blue-500/20", border: "border-blue-500/30", text: "text-blue-400" },
    purple: { bg: "bg-purple-500/20", border: "border-purple-500/30", text: "text-purple-400" },
    pink: { bg: "bg-pink-500/20", border: "border-pink-500/30", text: "text-pink-400" },
    amber: { bg: "bg-amber-500/20", border: "border-amber-500/30", text: "text-amber-400" },
    cyan: { bg: "bg-cyan-500/20", border: "border-cyan-500/30", text: "text-cyan-400" },
    red: { bg: "bg-red-500/20", border: "border-red-500/30", text: "text-red-400" },
    yellow: { bg: "bg-yellow-500/20", border: "border-yellow-500/30", text: "text-yellow-400" },
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-12 text-center"
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

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Complete Booking Guide
          </h1>
          <p className="text-zinc-400 text-lg max-w-3xl mx-auto">
            Everything you need to know about booking a studio session at Resonance Studio. 
            Follow our step-by-step guide to book, edit, cancel, or view your sessions.
          </p>
        </motion.div>

        {/* Complete Booking Flow - 8 Steps */}
        <motion.div
          className="mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="text-center mb-10">
            <motion.span
              className="inline-block px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm font-medium mb-4"
            >
              Complete Guide
            </motion.span>
            <h2 className="text-3xl font-bold text-white mb-3">
              Booking Process
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Follow these simple steps to book your studio session. The entire process takes less than 2 minutes!
            </p>
          </div>

          <div className="space-y-4">
            {bookingSteps.map((step, index) => {
              const colors = colorClasses[step.color];
              return (
                <motion.div
                  key={step.title}
                  className={`glass rounded-2xl p-6 border ${colors.border}`}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    {/* Step Number & Icon */}
                    <div className="flex items-center gap-4 lg:w-64 flex-shrink-0">
                      <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center ${colors.text}`}>
                        {step.icon}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">{step.title}</h3>
                      </div>
                    </div>

                    {/* Description & Details */}
                    <div className="flex-1">
                      <p className="text-zinc-400 mb-3">{step.description}</p>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {step.details.map((detail, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                            <ChevronRight className={`w-4 h-4 ${colors.text} flex-shrink-0 mt-0.5`} />
                            {detail}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Session Types Explained */}
        <motion.div
          className="mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="text-center mb-10">
            <motion.span
              className="inline-block px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-4"
            >
              Session Types
            </motion.span>
            <h2 className="text-3xl font-bold text-white mb-3">
              Available Session Types
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Choose the perfect session type for your needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {sessionTypes.map((session, index) => {
              const colors = colorClasses[session.color];
              return (
                <motion.div
                  key={session.name}
                  className={`glass rounded-2xl p-6 border ${colors.border}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  <div className={`w-14 h-14 rounded-xl ${colors.bg} flex items-center justify-center ${colors.text} mb-4`}>
                    {session.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{session.name}</h3>
                  <p className="text-zinc-400 text-sm mb-4">{session.description}</p>
                  <ul className="space-y-2">
                    {session.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-zinc-300">
                        <Check className={`w-4 h-4 ${colors.text}`} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* How to Edit/Cancel/View */}
        <motion.div
          className="mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="text-center mb-10">
            <motion.span
              className="inline-block px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-4"
            >
              Manage Bookings
            </motion.span>
            <h2 className="text-3xl font-bold text-white mb-3">
              Edit, Cancel & View Bookings
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Edit Booking */}
            <motion.div
              className="glass rounded-2xl p-6 border border-blue-500/20"
              whileHover={{ y: -5 }}
            >
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
                <Edit3 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Edit Booking</h3>
              <p className="text-zinc-400 text-sm mb-4">
                Need to change your booking? Here's how:
              </p>
              <ol className="space-y-2 text-sm text-zinc-300">
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 font-bold">1.</span>
                  Go to "Online Booking" on homepage
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 font-bold">2.</span>
                  Select "Change Existing Booking"
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 font-bold">3.</span>
                  Enter your registered phone number
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 font-bold">4.</span>
                  Select the booking you want to modify
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 font-bold">5.</span>
                  Change date, time, studio, or other details
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 font-bold">6.</span>
                  Confirm changes and save
                </li>
              </ol>
              <div className="mt-4 p-3 bg-blue-500/10 rounded-lg">
                <p className="text-xs text-blue-300">
                  <Info className="w-3 h-3 inline mr-1" />
                  You can edit bookings up to 24 hours before the session
                </p>
              </div>
            </motion.div>

            {/* Cancel Booking */}
            <motion.div
              className="glass rounded-2xl p-6 border border-red-500/20"
              whileHover={{ y: -5 }}
            >
              <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center text-red-400 mb-4">
                <X className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Cancel Booking</h3>
              <p className="text-zinc-400 text-sm mb-4">
                Need to cancel? Follow these steps:
              </p>
              <ol className="space-y-2 text-sm text-zinc-300">
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">1.</span>
                  Go to "Online Booking" on homepage
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">2.</span>
                  Select "Cancel Existing Booking"
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">3.</span>
                  Enter your registered phone number
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">4.</span>
                  Select the booking to cancel
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">5.</span>
                  Confirm cancellation
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">6.</span>
                  Receive cancellation confirmation
                </li>
              </ol>
              <div className="mt-4 p-3 bg-emerald-500/10 rounded-lg">
                <p className="text-xs text-emerald-300">
                  <Shield className="w-3 h-3 inline mr-1" />
                  Free cancellation with 24+ hours notice
                </p>
              </div>
            </motion.div>

            {/* View Booking */}
            <motion.div
              className="glass rounded-2xl p-6 border border-violet-500/20"
              whileHover={{ y: -5 }}
            >
              <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-400 mb-4">
                <Eye className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">View Bookings</h3>
              <p className="text-zinc-400 text-sm mb-4">
                Check your upcoming sessions:
              </p>
              <ol className="space-y-2 text-sm text-zinc-300">
                <li className="flex items-start gap-2">
                  <span className="text-violet-400 font-bold">1.</span>
                  Go to "Online Booking" on homepage
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-400 font-bold">2.</span>
                  Select "View Upcoming Bookings"
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-400 font-bold">3.</span>
                  Enter your registered phone number
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-400 font-bold">4.</span>
                  See all your upcoming sessions
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-400 font-bold">5.</span>
                  View details: date, time, studio, amount
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-400 font-bold">6.</span>
                  Option to edit or cancel from here
                </li>
              </ol>
              <div className="mt-4 p-3 bg-violet-500/10 rounded-lg">
                <p className="text-xs text-violet-300">
                  <MessageCircle className="w-3 h-3 inline mr-1" />
                  Confirmations also sent via WhatsApp
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Important Notes */}
        <motion.div
          className="mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl font-bold text-white mb-8 text-center">
            Important Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {importantNotes.map((note, index) => (
              <motion.div
                key={index}
                className="glass rounded-xl p-5"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
                  {note.icon}
                </div>
                <h3 className="font-bold text-white mb-1">{note.title}</h3>
                <p className="text-sm text-zinc-400">{note.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Schemes Section */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="text-center mb-10">
            <motion.span
              className="inline-block px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium mb-4"
            >
              Save Money
            </motion.span>
            <h2 className="text-3xl font-bold text-white mb-3">
              Exclusive Schemes & Offers
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Take advantage of our special programs to maximize your savings
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Rolling Milestone Cashback */}
            <motion.div
              className="glass rounded-2xl p-6 border border-yellow-500/20"
              whileHover={{ y: -5 }}
            >
              <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center text-yellow-400 mb-4">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Rolling Milestone Cashback
              </h3>
              <p className="text-zinc-400 text-sm mb-4">
                Reward program for consistent creators
              </p>
              <div className="bg-yellow-500/10 rounded-xl p-3 mb-4">
                <p className="text-yellow-400 font-semibold text-sm">
                  ₹30 cashback/hour + ₹500 welcome bonus!
                </p>
              </div>
              <ul className="space-y-2 text-sm text-zinc-300">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                  Cashback credited on booking completion
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                  ₹500 first-booking bonus for new users
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                  Unlock ₹2,000 payout at 50 hours
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                  90-day window to reach milestone
                </li>
              </ul>
            </motion.div>


          </div>

          <motion.div
            className="text-center mt-10"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <Link href="/rate-card">
              <motion.button
                className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 font-medium transition-colors"
                whileHover={{ x: 5 }}
              >
                View All Schemes & Pricing <ArrowRight className="w-4 h-4" />
              </motion.button>
            </Link>
          </motion.div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          className="glass-strong rounded-2xl p-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl font-bold text-white mb-4">
            Ready to Book Your Session?
          </h2>
          <p className="text-zinc-400 mb-6 max-w-xl mx-auto">
            Now that you know how it works, book your studio session in less than 2 minutes. 
            No advance payment required – just show up and create!
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/booking">
              <motion.button
                className="bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold text-lg px-8 py-4 rounded-xl flex items-center gap-3 shadow-lg hover:shadow-xl transition-shadow"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <Calendar className="w-5 h-5" />
                Book Now
              </motion.button>
            </Link>
            <Link href="/contact">
              <motion.button
                className="bg-zinc-800 hover:bg-zinc-700 text-white font-medium px-6 py-4 rounded-xl flex items-center gap-2 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Phone className="w-5 h-5" />
                Need Help? Contact Us
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
