'use client';

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, Car, Volume2, Cigarette, Eye, AlertCircle } from "lucide-react";

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

export default function PoliciesPage() {
  const policies = [
    {
      icon: <Clock className="w-6 h-6" />,
      iconBg: "bg-blue-500/20 text-blue-400",
      title: "Operating Hours",
      content: "Our standard operating hours are from 8:00 AM to 10:00 PM. Should you require studio time outside these hours, special arrangements can be considered upon prior request.",
    },
    {
      icon: <Car className="w-6 h-6" />,
      iconBg: "bg-emerald-500/20 text-emerald-400",
      title: "Parking",
      content: "Please park your vehicle in the designated parking area within our building. If building parking is full, you may use society street parking on the road. Please ensure no gates are blocked and no inconvenience is caused to other residents.",
    },
    {
      icon: <Volume2 className="w-6 h-6" />,
      iconBg: "bg-amber-500/20 text-amber-400",
      title: "Discussions & Noise",
      content: "We provide ample space within our premises for your discussions before and after your session. To maintain a peaceful environment for our neighbors, we kindly request that you refrain from extended chatting on the road near the studio.",
    },
    {
      icon: <Cigarette className="w-6 h-6" />,
      iconBg: "bg-red-500/20 text-red-400",
      title: "Smoking Policy",
      content: "Smoking is always discouraged. If you happen to smoke, please use the designated smoking area only. Ensure all cigarettes are fully extinguished and please dispose of all ash and butts in the provided dustbins.",
    },
    {
      icon: <Eye className="w-6 h-6" />,
      iconBg: "bg-violet-500/20 text-violet-400",
      title: "Privacy & Monitoring",
      content: "To ensure your privacy, after the initial setup, our sound engineer/operator is advised to monitor externally. However, they will conduct intermittent checks inside the studio to confirm all systems are functioning properly. Should you require any assistance (e.g., an additional microphone, battery replacement, or any other technical support), please call them and they will promptly attend to your needs.",
    },
  ];

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
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
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Studio Policies</h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Please review our policies to ensure a pleasant experience for everyone.
          </p>
        </motion.div>

        {/* Policies List */}
        <motion.div 
          className="space-y-6"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {policies.map((policy, index) => (
            <motion.div 
              key={index} 
              className="glass rounded-2xl p-6"
              variants={fadeInUp}
              whileHover={{ x: 5 }}
            >
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-xl ${policy.iconBg} flex items-center justify-center flex-shrink-0`}>
                  {policy.icon}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">{policy.title}</h2>
                  <p className="text-zinc-400 leading-relaxed">{policy.content}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Additional Note */}
        <motion.div 
          className="mt-12 glass-strong rounded-2xl p-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-2">Need Assistance?</h3>
              <p className="text-zinc-400 text-sm">
                Our team is always here to help. If you have any questions about our policies or need any assistance during your session, don&apos;t hesitate to reach out to our staff.
              </p>
              <Link 
                href="/contact" 
                className="inline-flex items-center gap-2 mt-4 text-violet-400 hover:text-violet-300 transition-colors"
              >
                Contact Us
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
