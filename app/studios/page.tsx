'use client';

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Mic, Users, Check, Music, Radio, Star } from "lucide-react";

// Optimized animation variants with shorter durations
const fadeInUp = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

export default function StudiosPage() {
  const studios = [
    {
      id: "studio-a",
      name: "Studio A",
      tag: "Large Studio",
      tagColor: "bg-red-500/20 text-red-400",
      subtitle: "Our largest and most spacious studio",
      description: "Perfect for big live rehearsals and large groups of Karaoke rehearsal.",
      capacity: {
        live: "10-12 musicians",
        karaoke: "Up to 30 participants"
      },
      features: [
        "Yamaha Silver Star Drum kit (with cymbals)",
        "Two Electric Guitars",
        "One Keyboard",
        "Two Guitar Amps",
        "One Bass Amp",
        "Climate controlled",
        "Professional sound system",
        "Huge 65\" TV screen for karaoke"
      ],
      price: "350",
      icon: <Music className="w-16 h-16" />,
    },
    {
      id: "studio-b",
      name: "Studio B",
      tag: "Medium Studio",
      tagColor: "bg-amber-500/20 text-amber-400",
      subtitle: "A versatile, moderately sized studio",
      description: "Adapts to your needs. Primarily recommended for karaoke rehearsal groups.",
      capacity: {
        live: "4-5 musicians",
        karaoke: "Up to 12 participants"
      },
      features: [
        "46\" TV screen for karaoke",
        "Professional sound system",
        "Climate controlled",
        "Comfortable seating area"
      ],
      price: "250",
      icon: <Radio className="w-16 h-16" />,
    },
    {
      id: "studio-c",
      name: "Studio C",
      tag: "Small Studio",
      tagColor: "bg-emerald-500/20 text-emerald-400",
      subtitle: "Primarily designed for audio/video recording",
      description: "Also ideal for podcast production and small rehearsals.",
      capacity: {
        live: "Up to 2 musicians",
        karaoke: "Up to 5 participants"
      },
      features: [
        "Professional recording equipment",
        "Video recording setup",
        "Podcast production ready",
        "Climate controlled",
        "Intimate recording space"
      ],
      price: "200",
      icon: <Mic className="w-16 h-16" />,
    },
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
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Our Studios</h1>
          <p className="text-zinc-400 text-lg max-w-2xl">
            State-of-the-art recording facilities designed for creativity and professional results
          </p>
        </motion.div>

        {/* Studios List */}
        <motion.div 
          className="space-y-8 mb-16"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {studios.map((studio, index) => (
            <motion.div 
              key={index}
              id={studio.id}
              className="glass-strong rounded-3xl overflow-hidden group scroll-mt-24"
              variants={fadeInUp}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <div className="flex flex-col lg:flex-row">
                {/* Studio Image */}
                <div className="lg:w-2/5 h-64 lg:h-auto bg-gradient-to-br from-violet-600/30 via-purple-600/30 to-orange-500/30 relative overflow-hidden">
                  <motion.div 
                    className="absolute inset-0 flex items-center justify-center text-white/20"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ duration: 0.3 }}
                  >
                    {studio.icon}
                  </motion.div>
                </div>
                
                {/* Studio Info */}
                <div className="lg:w-3/5 p-6 lg:p-8">
                  <div className="mb-4">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl font-bold text-white">{studio.name}</h2>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${studio.tagColor}`}>
                        {studio.tag}
                      </span>
                    </div>
                    <p className="text-zinc-400">{studio.subtitle}. {studio.description}</p>
                  </div>
                  
                  {/* Capacity */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 text-white font-medium mb-1">
                      <Users className="w-4 h-4 text-violet-400" />
                      Capacity
                    </div>
                    <p className="text-zinc-400 text-sm">
                      Live: {studio.capacity.live} | Karaoke: {studio.capacity.karaoke}
                    </p>
                  </div>
                  
                  {/* Key Features */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 text-white font-medium mb-3">
                      <Star className="w-4 h-4 text-amber-400" />
                      Key Features
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {studio.features.map((feature, i) => (
                        <motion.div 
                          key={i} 
                          className="flex items-center gap-2 text-sm text-zinc-300"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + i * 0.05 }}
                        >
                          <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          {feature}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Price and CTA */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-white/10">
                    <div className="bg-white/5 rounded-xl px-4 py-2">
                      <p className="text-zinc-400 text-xs">Starting from</p>
                      <p className="text-2xl font-bold text-white">
                        ₹{studio.price}<span className="text-sm font-normal text-zinc-400">/hour</span>
                      </p>
                    </div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Link 
                        href="/booking/new"
                        className="btn-primary px-8 py-3 text-center block"
                      >
                        Book {studio.name}
                      </Link>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
