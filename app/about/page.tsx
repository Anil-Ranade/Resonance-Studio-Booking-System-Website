'use client';

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Award, Users, Music, User, Heart } from "lucide-react";

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

export default function AboutPage() {
  const values = [
    {
      icon: <Award className="w-8 h-8" />,
      title: "Excellence",
      description: "Over a decade of commitment to providing top-tier audio-video services.",
    },
    {
      icon: <Music className="w-8 h-8" />,
      title: "Quality",
      description: "State-of-the-art equipment and professional sound engineers.",
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Community",
      description: "Building a vibrant community of musicians and artists in Pune.",
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: "Passion",
      description: "Dedicated to bringing your creative projects to life.",
    },
  ];

  const managementTeam = [
    { role: "Jamming Room", name: "Soundchek Enterprises - Ayan Momin" },
    { role: "Karaoke Room", name: "Soundchek Enterprises - Ayan Momin" },
    { role: "Classes", name: "Gafar Momin" },
    { role: "Podcast & Recording", name: "Atharv Kshirsagar & Amruta Ranade" },
    { role: "Sound Operator", name: "Sohel & Nitin Randive" },
    { role: "Pantry Services", name: "Dhananjay Purkar" },
    { role: "Assistant", name: "Sudhakar Sonawane" },
  ];

  const partners = [
    { role: "Acoustic Consultant", name: "Fenestra Solutions - Sohail" },
    { role: "Contractor", name: "Vishwakarma Furniture - Babulal" },
    { role: "Electrical Contractor", name: "Om Electricals - Lonkar" },
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
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">About Resonance Studio</h1>
          <p className="text-zinc-400 text-lg max-w-2xl">
            Where passion meets professional audio production
          </p>
        </motion.div>

        {/* Story Section */}
        <motion.div 
          className="glass-strong rounded-3xl p-8 md:p-12 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h2 className="text-3xl font-bold text-white mb-6 text-center">Our Story</h2>
          <div className="space-y-4 text-zinc-300 max-w-4xl mx-auto">
            <p>
              After a decade of excellence in the audio industry, we&apos;re thrilled to expand our offerings and provide <span className="text-violet-400">top-tier audio-video recording services</span> in addition to rehearsal services at our new state-of-the-art facility on Sinhgad Road, Pune.
            </p>
            <p>
              With our brand-new mixers, microphones, and entirely new setup, along with a dedicated team of audio-video recordists, we&apos;re committed to delivering exceptional results and bringing your creative projects to life.
            </p>
            <p>
              Our facility features <span className="text-violet-400">three unique studios</span> - Studio A, Studio B, and Studio C - each equipped to cater to diverse musical, rehearsal, and recording needs.
            </p>
          </div>
        </motion.div>

        {/* Leadership */}
        <motion.div 
          className="glass rounded-3xl p-8 mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="text-center p-6 bg-white/5 rounded-2xl">
              <p className="text-violet-400 text-sm mb-1">Proprietor</p>
              <p className="text-xl font-bold text-white">Suchitra Ranade</p>
            </div>
            <div className="text-center p-6 bg-white/5 rounded-2xl">
              <p className="text-violet-400 text-sm mb-1">Investor</p>
              <p className="text-xl font-bold text-white">Amruta Ranade</p>
            </div>
          </div>
        </motion.div>

        {/* Values Section */}
        <div className="mb-12">
          <motion.h2 
            className="text-3xl font-bold text-white mb-8 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Our Values
          </motion.h2>
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {values.map((value, index) => (
              <motion.div 
                key={index} 
                className="glass rounded-2xl p-6 text-center"
                variants={fadeInUp}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <motion.div 
                  className="w-14 h-14 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-400 mx-auto mb-4"
                  whileHover={{ rotate: 10, scale: 1.1 }}
                >
                  {value.icon}
                </motion.div>
                <h3 className="text-lg font-bold text-white mb-2">{value.title}</h3>
                <p className="text-zinc-400 text-sm">{value.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Management Team Section */}
        <motion.div 
          className="glass rounded-3xl p-8 mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-bold text-white mb-6">Management Team</h2>
          <div className="space-y-3">
            {managementTeam.map((member, index) => (
              <motion.div 
                key={index} 
                className="flex justify-between items-center py-3 border-b border-white/5"
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <span className="text-violet-400">{member.role}</span>
                <span className="text-white">{member.name}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Partners Section */}
        <motion.div 
          className="glass rounded-3xl p-8 mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-bold text-white mb-6">Consultants</h2>
          <div className="space-y-3">
            {partners.map((partner, index) => (
              <motion.div 
                key={index} 
                className="flex justify-between items-center py-3 border-b border-white/5"
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <span className="text-violet-400">{partner.role}</span>
                <span className="text-white">{partner.name}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Credit */}
        <motion.div 
          className="relative rounded-2xl p-8 text-center overflow-hidden group"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {/* Animated gradient border */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-500 opacity-75"></div>
          <div className="absolute inset-[2px] rounded-2xl bg-zinc-900/95 backdrop-blur-sm"></div>
          
          {/* Glow effect */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-600/20 via-purple-500/20 to-fuchsia-500/20 blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>
          
          {/* Content */}
          <div className="relative z-10">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-2xl">✨</span>
              <span className="text-xs uppercase tracking-[0.3em] text-violet-400 font-medium">Visionary Behind Resonance</span>
              <span className="text-2xl">✨</span>
            </div>
            <p className="text-lg text-zinc-300">
              Concept, Project Planning & Execution by{' '}
              <span className="text-xl font-bold bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
                Anil Ranade
              </span>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
