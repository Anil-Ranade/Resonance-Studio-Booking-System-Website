'use client';

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Sparkles, Music, Sliders, Users, Video, Mic, Guitar, Radio, Tv, Camera, MonitorPlay, Speaker, CreditCard, Info, Clock } from "lucide-react";

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

export default function RateCardPage() {
  // Services
  const services = [
    {
      name: "Rehearsal Services",
      description: "Professional rehearsal spaces for bands, musicians, and karaoke enthusiasts.",
      features: ["Three studios of varying sizes", "Professional sound equipment", "Drums, guitars, keyboards available", "Large TV screens for karaoke"],
      icon: <Guitar className="w-8 h-8" />,
      iconBg: "bg-violet-500/20 text-violet-400",
    },
    {
      name: "Audio Recording",
      description: "Professional audio recording, editing, mixing, and mastering services.",
      features: ["Professional microphones", "Digital mixing console", "Editing and mastering", "Quick turnaround"],
      price: "₹700 per song",
      icon: <Mic className="w-8 h-8" />,
      iconBg: "bg-blue-500/20 text-blue-400",
    },
    {
      name: "Video Recording",
      description: "True 4K quality video recording with professional editing.",
      features: ["iPhone/iPad 4K recording", "Professional lighting", "Video editing", "Quick delivery"],
      price: "₹800 per song",
      icon: <Video className="w-8 h-8" />,
      iconBg: "bg-red-500/20 text-red-400",
    },
    {
      name: "Chroma Key (Green Screen)",
      description: "Green screen recording for professional music videos.",
      features: ["Professional green screen setup", "Background replacement", "Full editing included", "Creative freedom"],
      price: "₹1,200 per song",
      icon: <MonitorPlay className="w-8 h-8" />,
      iconBg: "bg-emerald-500/20 text-emerald-400",
    },
    {
      name: "Facebook Live",
      description: "Live streaming setup for social media performances.",
      features: ["Multi-camera setup", "Professional sound", "Live monitoring", "Social media ready"],
      price: "₹7,000 for 4 hours",
      icon: <Camera className="w-8 h-8" />,
      iconBg: "bg-purple-500/20 text-purple-400",
    },
    {
      name: "Sound System Rental",
      description: "Professional sound system available for outside shows and events.",
      features: ["High-quality speakers", "Mixing console", "Microphones", "Technical support"],
      price: "Contact for rates",
      icon: <Speaker className="w-8 h-8" />,
      iconBg: "bg-amber-500/20 text-amber-400",
    },
  ];

  // Studio pricing tables - grouped by same price
  const studioAPricing = [
    { type: "Karaoke (1-20 participants)", price: "₹400" },
    { type: "Karaoke (21-30 participants)", price: "₹500" },
    { type: "Live (up to 8 musicians)", price: "₹600" },
    { type: "Live (8-12 musicians)", price: "₹800" },
    { type: "Only Drum Practice", price: "₹350" },
    { type: "Band with only Drums", price: "₹400" },
    { type: "Band with Drums & Amps", price: "₹500" },
    { type: "Band Full (Drums, Amps, Guitars, Keyboard)", price: "₹600" },
  ];

  const studioBPricing = [
    { type: "Karaoke (1-12 participants)", price: "₹300" },
    { type: "Live (up to 4 musicians)", price: "₹400" },
    { type: "Live (5 musicians)", price: "₹500" },
  ];

  const studioCPricing = [
    { type: "Karaoke (1-5 participants)", price: "₹250" },
    { type: "Live (up to 2 musicians)", price: "₹350" },
  ];

  // Special packages
  const specialPackages = [
    {
      name: "10 Hours Package - Karaoke",
      subtitle: "3+3+4 hours split (Especially for Organisers)",
      studios: [
        { name: "Studio A", price: "₹3,500" },
        { name: "Studio B", price: "₹2,500" },
        { name: "Studio C", price: "₹2,000" },
      ],
    },
    {
      name: "10 Hours Package - Live",
      subtitle: "3+3+4 hours split (Especially for Organisers)",
      studios: [
        { name: "Studio A", price: "₹5,000" },
        { name: "Studio B", price: "₹4,000" },
        { name: "Studio C", price: "₹3,000" },
      ],
    },
  ];

  // Recording services
  const recordingServices = [
    { name: "Audio Recording", price: "₹700", description: "Per song - includes recording, editing, mixing & mastering" },
    { name: "Video Recording", price: "₹800", description: "True 4K Quality (iPhone/iPad) - includes recording, editing, mixing & mastering" },
    { name: "Chroma Key Recording", price: "₹1,200", description: "Green Screen - includes recording, editing, mixing & mastering" },
    { name: "SD Card Recording", price: "₹100", description: "Per hour - Raw data only (unedited), transferred to your pen drive" },
  ];

  // Important notes
  const importantNotes = [
    "All prices are per hour unless specified otherwise",
    "GST charges may apply",
    "No advance payment required - pay at studio after session",
    "Free cancellation with 24+ hours notice",
    "Additional services like snacks, internet available at extra cost",
  ];

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
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Services & Pricing</h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Transparent pricing with no hidden fees. Pay at studio after your session.
          </p>
        </motion.div>

        {/* Services Grid */}
        <motion.div className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">Our Services</h2>
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {services.map((service, index) => (
              <motion.div 
                key={index} 
                className="glass rounded-2xl p-6"
                variants={fadeInUp}
                whileHover={{ y: -5 }}
              >
                <div className={`w-14 h-14 rounded-xl ${service.iconBg} flex items-center justify-center mb-4`}>
                  {service.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{service.name}</h3>
                <p className="text-zinc-400 text-sm mb-4">{service.description}</p>
                <ul className="space-y-2 mb-4">
                  {service.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-zinc-300">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                {service.price && (
                  <p className="text-xl font-bold text-amber-400">{service.price}</p>
                )}
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Studio Pricing Tables */}
        <motion.div 
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl font-bold text-white mb-8 text-center">Studio Hourly Rates</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Studio A */}
            <motion.div className="glass rounded-2xl p-6" whileHover={{ y: -3 }}>
              <h3 className="text-xl font-bold text-white mb-4 text-center">Studio A</h3>
              <div className="space-y-2">
                {studioAPricing.map((item, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-zinc-400 text-sm">{item.type}</span>
                    <span className="text-white font-semibold">{item.price}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Studio B */}
            <motion.div className="glass rounded-2xl p-6" whileHover={{ y: -3 }}>
              <h3 className="text-xl font-bold text-white mb-4 text-center">Studio B</h3>
              <div className="space-y-2">
                {studioBPricing.map((item, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-zinc-400 text-sm">{item.type}</span>
                    <span className="text-white font-semibold">{item.price}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Studio C */}
            <motion.div className="glass rounded-2xl p-6" whileHover={{ y: -3 }}>
              <h3 className="text-xl font-bold text-white mb-4 text-center">Studio C</h3>
              <div className="space-y-2">
                {studioCPricing.map((item, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-zinc-400 text-sm">{item.type}</span>
                    <span className="text-white font-semibold">{item.price}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Special Packages */}
        <motion.div 
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl font-bold text-white mb-8 text-center">Special Packages</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {specialPackages.map((pkg, index) => (
              <motion.div 
                key={index} 
                className="glass-strong rounded-2xl p-6"
                whileHover={{ y: -3 }}
              >
                <h3 className="text-xl font-bold text-white mb-1">{pkg.name}</h3>
                <p className="text-zinc-400 text-sm mb-4">{pkg.subtitle}</p>
                <div className="space-y-2">
                  {pkg.studios.map((studio, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-white/5">
                      <span className="text-violet-400">{studio.name}:</span>
                      <span className="text-white font-bold">{studio.price}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Recording Services */}
        <motion.div 
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl font-bold text-white mb-8 text-center">Recording & Production Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recordingServices.map((service, index) => (
              <motion.div 
                key={index} 
                className="glass rounded-2xl p-6 flex justify-between items-start"
                whileHover={{ y: -3 }}
              >
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">{service.name}</h3>
                  <p className="text-zinc-400 text-sm">{service.description}</p>
                </div>
                <span className="text-2xl font-bold text-amber-400 whitespace-nowrap ml-4">{service.price}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Important Notes */}
        <motion.div 
          className="glass rounded-2xl p-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Info className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-bold text-white">Important Notes</h3>
          </div>
          <ul className="space-y-2">
            {importantNotes.map((note, i) => (
              <li key={i} className="flex items-start gap-2 text-zinc-400 text-sm">
                <span className="text-violet-400">•</span>
                {note}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
