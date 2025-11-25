"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Phone, Mail, Clock, Send } from "lucide-react";

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

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const phoneNumbers = [
    { name: "Anil Ranade", number: "+91 98220 29235" },
    { name: "Gafar Momin", number: "+91 98901 58080" },
    { name: "Ayan Momin", number: "+91 90113 07068" },
    { name: "Atharv Kshirsagar", number: "+91 94224 68757" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(formData);
    setIsSubmitting(false);
  };

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
            Have questions? We&apos;d love to hear from you. Send us a message and we&apos;ll respond as soon as possible.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Form */}
          <motion.div 
            className="lg:col-span-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <form onSubmit={handleSubmit} className="glass-strong rounded-3xl p-8">
              <motion.div 
                className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6"
                variants={staggerContainer}
                initial="initial"
                animate="animate"
              >
                <motion.div variants={fadeInUp}>
                  <label htmlFor="contact-name" className="block text-sm font-medium text-zinc-400 mb-2.5">Name</label>
                  <input
                    type="text"
                    id="contact-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    placeholder="Your name"
                    required
                  />
                </motion.div>
                <motion.div variants={fadeInUp}>
                  <label htmlFor="contact-email" className="block text-sm font-medium text-zinc-400 mb-2.5">Email</label>
                  <input
                    type="email"
                    id="contact-email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input"
                    placeholder="your@email.com"
                    required
                  />
                </motion.div>
              </motion.div>
              
              <motion.div 
                className="mb-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <label htmlFor="contact-phone" className="block text-sm font-medium text-zinc-400 mb-2.5">Phone</label>
                <input
                  type="tel"
                  id="contact-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input"
                  placeholder="+91 98765 43210"
                  required
                />
              </motion.div>
              
              <motion.div 
                className="mb-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <label htmlFor="contact-message" className="block text-sm font-medium text-zinc-400 mb-2.5">Message</label>
                <textarea
                  id="contact-message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={5}
                  className="input resize-none"
                  placeholder="Tell us about your project..."
                  required
                />
              </motion.div>
              
              <motion.button 
                type="submit" 
                className="btn-accent w-full sm:w-auto flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send Message
                    <Send className="w-5 h-5" />
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>

          {/* Contact Info */}
          <motion.div 
            className="space-y-4"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {/* Address */}
            <motion.div 
              className="glass rounded-2xl p-6"
              variants={fadeInUp}
              whileHover={{ scale: 1.02, x: 5 }}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-400 flex-shrink-0">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Address</h3>
                  <p className="text-zinc-400 text-sm">45, Shivprasad Housing Society</p>
                  <p className="text-zinc-400 text-sm">Panmala, Dattawadi</p>
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
              whileHover={{ scale: 1.02, x: 5 }}
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
              whileHover={{ scale: 1.02, x: 5 }}
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
              whileHover={{ scale: 1.02, x: 5 }}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Operating Hours</h3>
                  <p className="text-zinc-400">Monday - Sunday</p>
                  <p className="text-white font-medium">8:00 AM - 10:00 PM</p>
                  <p className="text-zinc-500 text-xs mt-1">Outside hours available on request</p>
                </div>
              </div>
            </motion.div>
            

          </motion.div>
        </div>
      </div>
    </div>
  );
}
