"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Phone, Mail, Clock } from "lucide-react";

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

// Helper function to format time from 24h to 12h format
function formatTimeToDisplay(time: string): string {
  const [hours] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHours}:00 ${period}`;
}

export default function ContactPage() {
  const [defaultOpenTime, setDefaultOpenTime] = useState('08:00');
  const [defaultCloseTime, setDefaultCloseTime] = useState('22:00');

  // Fetch booking settings on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const data = await response.json();
          setDefaultOpenTime(data.defaultOpenTime || '08:00');
          setDefaultCloseTime(data.defaultCloseTime || '22:00');
        }
      } catch (err) {
        console.error('Error fetching booking settings:', err);
      }
    };
    fetchSettings();
  }, []);

  const phoneNumbers = [
    { name: "Anil Ranade", number: "+91 98220 29235" },
    { name: "Gafar Momin", number: "+91 98901 58080" },
    { name: "Ayan Momin", number: "+91 90113 07068" },
    { name: "Atharv Kshirsagar", number: "+91 94224 68757" },
  ];

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
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
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Get in Touch</h1>
          <p className="text-zinc-400 text-lg max-w-2xl">
            Have questions? Reach out to us through any of the contact methods below.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Address */}
          <motion.div 
            className="glass rounded-2xl p-6"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            whileHover={{ scale: 1.02, y: -5 }}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-400 flex-shrink-0">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Address</h3>
                <p className="text-zinc-400 text-sm">45, Shivprasad Housing Society</p>
                <p className="text-zinc-400 text-sm">Dattawadi</p>
                <p className="text-zinc-400 text-sm">Pune - 411 030</p>
                <p className="text-zinc-500 text-xs mt-1">(Near Dandekar Pool)</p>
                <a 
                  href="https://maps.google.com/?q=45+Shivprasad+Housing+Society+Panmala+Dattawadi+Pune" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block mt-2 text-sm text-violet-400 hover:text-violet-300 border border-violet-400/30 rounded-lg px-3 py-1"
                >
                  Open in Maps
                </a>
              </div>
            </div>
          </motion.div>

          {/* Phone Numbers */}
          <motion.div 
            className="glass rounded-2xl p-6"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            whileHover={{ scale: 1.02, y: -5 }}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
                <Phone className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold mb-3">Phone Numbers</h3>
                <div className="space-y-2">
                  {phoneNumbers.map((contact, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className="text-zinc-400 text-sm">{contact.name}</span>
                      <a href={`tel:${contact.number.replace(/\s/g, '')}`} className="text-violet-400 text-sm hover:text-violet-300">
                        {contact.number}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Email */}
          <motion.div 
            className="glass rounded-2xl p-6"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            whileHover={{ scale: 1.02, y: -5 }}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Email</h3>
                <a href="mailto:resonancestudio12@gmail.com" className="text-violet-400 hover:text-violet-300">
                  resonancestudio12@gmail.com
                </a>
              </div>
            </div>
          </motion.div>

          {/* Operating Hours */}
          <motion.div 
            className="glass rounded-2xl p-6"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            whileHover={{ scale: 1.02, y: -5 }}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Operating Hours</h3>
                <p className="text-zinc-400">Monday - Sunday</p>
                <p className="text-white font-medium">Daily: {formatTimeToDisplay(defaultOpenTime)} - {formatTimeToDisplay(defaultCloseTime)}</p>
                <p className="text-zinc-500 text-xs mt-1">Outside hours available on request</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
