'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, CalendarPlus, Edit, XCircle, Eye } from 'lucide-react';

const menuOptions = [
  {
    id: 'new',
    title: 'New Booking',
    description: 'Book a new studio session',
    icon: CalendarPlus,
    href: '/booking/new',
    color: 'violet',
  },
  {
    id: 'change',
    title: 'Change Existing Booking',
    description: 'Modify your current booking',
    icon: Edit,
    href: '/edit-booking',
    color: 'blue',
  },
  {
    id: 'cancel',
    title: 'Cancel Existing Booking',
    description: 'Cancel a scheduled booking',
    icon: XCircle,
    href: '/cancel-booking',
    color: 'red',
  },
  {
    id: 'view',
    title: 'View Upcoming Bookings',
    description: 'See all your scheduled sessions',
    icon: Eye,
    href: '/view-bookings',
    color: 'emerald',
  },
];

const colorClasses = {
  violet: {
    bg: 'bg-violet-600 hover:bg-violet-500',
    border: 'border-violet-500/30',
    icon: 'text-violet-400',
    glow: 'hover:shadow-violet-500/20',
  },
  blue: {
    bg: 'bg-blue-600 hover:bg-blue-500',
    border: 'border-blue-500/30',
    icon: 'text-blue-400',
    glow: 'hover:shadow-blue-500/20',
  },
  red: {
    bg: 'bg-red-600 hover:bg-red-500',
    border: 'border-red-500/30',
    icon: 'text-red-400',
    glow: 'hover:shadow-red-500/20',
  },
  emerald: {
    bg: 'bg-emerald-600 hover:bg-emerald-500',
    border: 'border-emerald-500/30',
    icon: 'text-emerald-400',
    glow: 'hover:shadow-emerald-500/20',
  },
};

export default function BookingMenu() {
  const router = useRouter();

  const handleOptionClick = (href: string) => {
    router.push(href);
  };

  const handleBack = () => {
    router.push('/');
  };

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-gradient-to-b from-zinc-900 via-zinc-900 to-black">
      {/* Header */}
      <header className="flex-shrink-0 px-4 pt-4 pb-2">
        <div className="text-center mb-3">
          <h1 className="text-lg font-bold text-violet-400">
            Resonance – Sinhgad Road
          </h1>
          <h2 className="text-sm text-zinc-400">Online Booking System</h2>
        </div>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <h4 className="text-xl font-bold text-white text-center">What would you like to do?</h4>
          <p className="text-sm text-zinc-400 mt-1 text-center">Choose an option below</p>
        </motion.div>
      </header>

      {/* Main content */}
      <main className="flex-1 px-4 py-4 overflow-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col gap-3 max-w-md mx-auto"
        >
          {menuOptions.map((option, index) => {
            const colors = colorClasses[option.color as keyof typeof colorClasses];
            const Icon = option.icon;
            
            return (
              <motion.button
                key={option.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                onClick={() => handleOptionClick(option.href)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl ${colors.bg} text-white font-medium transition-all duration-200 shadow-lg ${colors.glow} hover:shadow-xl`}
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-base font-semibold">{option.title}</h3>
                  <p className="text-sm text-white/70">{option.description}</p>
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      </main>

      {/* Footer with Back button and progress bar */}
      <footer className="flex-shrink-0 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-zinc-800 bg-zinc-900/80 backdrop-blur">
        {/* Progress bar */}
        <div className="flex items-center gap-1 mb-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((step) => (
            <div
              key={step}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                step <= 1 ? 'bg-violet-500' : 'bg-zinc-700'
              }`}
            />
          ))}
        </div>
        <p className="text-center text-xs text-zinc-500 mb-3">
          Step 1 of 8
        </p>

        {/* Back button */}
        <button
          onClick={handleBack}
          className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-zinc-800 text-white font-medium hover:bg-zinc-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </footer>
    </div>
  );
}
