'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CalendarPlus, Edit, XCircle, Eye, Building2 } from 'lucide-react';
import Link from 'next/link';

const menuOptions = [
  {
    id: 'new',
    title: 'New Booking',
    description: 'Create a new studio booking',
    icon: CalendarPlus,
    href: '/staff/booking/new',
    color: 'teal',
  },
  {
    id: 'change',
    title: 'Change Existing Booking',
    description: 'Modify an existing booking',
    icon: Edit,
    href: '/staff/booking/edit',
    color: 'blue',
  },
  {
    id: 'cancel',
    title: 'Cancel Existing Booking',
    description: 'Cancel a scheduled booking',
    icon: XCircle,
    href: '/staff/booking/cancel',
    color: 'red',
  },
  {
    id: 'view',
    title: 'View My Bookings',
    description: 'See all your scheduled sessions',
    icon: Eye,
    href: '/staff/bookings',
    color: 'emerald',
  },
];

const colorClasses = {
  teal: {
    bg: 'bg-teal-600 hover:bg-teal-500',
    border: 'border-teal-500/30',
    icon: 'text-teal-400',
    glow: 'hover:shadow-teal-500/20',
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

export default function StaffBookingMenu() {
  const router = useRouter();

  const handleOptionClick = (href: string) => {
    router.push(href);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Building2 className="w-7 h-7 text-teal-400" />
            Booking Management
          </h1>
          <p className="text-zinc-400 mt-1">Create and manage studio bookings</p>
        </div>
        <Link
          href="/staff/bookings"
          className="text-sm text-zinc-400 hover:text-white transition-colors"
        >
          ← Back to Bookings List
        </Link>
      </div>

      {/* Menu Options */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
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
              className={`w-full flex items-center gap-4 p-5 rounded-xl ${colors.bg} text-white font-medium transition-all duration-200 shadow-lg ${colors.glow} hover:shadow-xl`}
            >
              <div className="flex-shrink-0 w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
                <Icon className="w-7 h-7" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-lg font-semibold">{option.title}</h3>
                <p className="text-sm text-white/70">{option.description}</p>
              </div>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Quick Stats Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="glass rounded-xl p-4 text-center"
      >
        <p className="text-zinc-400 text-sm">
          You can create new bookings and edit/cancel bookings that you&apos;ve created.
        </p>
      </motion.div>
    </div>
  );
}
