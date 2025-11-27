"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle, Mail, Clock, Sparkles, ArrowRight, Calendar } from "lucide-react";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export default function ConfirmationPage() {
  const router = useRouter();

  const steps = [
    {
      number: 1,
      icon: <Mail className="w-4 h-4" />,
      text: "Check your messages for booking details"
    },
    {
      number: 2,
      icon: <Clock className="w-4 h-4" />,
      text: "Arrive 10 minutes early for your session"
    },
    {
      number: 3,
      icon: <Sparkles className="w-4 h-4" />,
      text: "Bring your music, ideas, and creativity!"
    }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Success Animation */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
        >
          <motion.div 
            className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30"
            animate={{ 
              scale: [1, 1.05, 1],
              boxShadow: [
                "0 10px 40px -15px rgba(34, 197, 94, 0.3)",
                "0 10px 60px -15px rgba(34, 197, 94, 0.5)",
                "0 10px 40px -15px rgba(34, 197, 94, 0.3)"
              ]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
            >
              <CheckCircle className="w-12 h-12 text-white" />
            </motion.div>
          </motion.div>
          
          <motion.h1 
            className="text-3xl md:text-4xl font-bold text-white mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Booking Confirmed!
          </motion.h1>
          <motion.p 
            className="text-zinc-400 text-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Thank you for choosing Resonance Studio. We&apos;ve sent a confirmation to your messages.
          </motion.p>
        </motion.div>

        {/* Info Card */}
        <motion.div 
          className="glass rounded-2xl p-6 mb-8 text-left"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-violet-400" />
            What&apos;s Next?
          </h3>
          <motion.ul 
            className="space-y-3"
            initial="initial"
            animate="animate"
            variants={{
              animate: { transition: { staggerChildren: 0.1, delayChildren: 0.6 } }
            }}
          >
            {steps.map((step) => (
              <motion.li 
                key={step.number}
                className="flex items-start gap-3"
                variants={fadeInUp}
              >
                <motion.div 
                  className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0 mt-0.5 text-violet-400"
                  whileHover={{ scale: 1.2, backgroundColor: "rgba(139, 92, 246, 0.3)" }}
                >
                  {step.icon}
                </motion.div>
                <p className="text-zinc-400 text-sm">{step.text}</p>
              </motion.li>
            ))}
          </motion.ul>
        </motion.div>

        {/* Actions */}
        <motion.div 
          className="space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <motion.button
            onClick={() => router.push("/home")}
            className="btn-accent w-full py-4 flex items-center justify-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Back to Home
            <ArrowRight className="w-5 h-5" />
          </motion.button>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/booking"
              className="btn-secondary w-full py-4 block"
            >
              Book Another Session
            </Link>
          </motion.div>
        </motion.div>

        {/* Contact Info */}
        <motion.p 
          className="mt-8 text-zinc-500 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          Questions? Contact us at{" "}
          <a href="mailto:resonancestudio12@gmail.com" className="text-violet-400 hover:text-violet-300 transition-colors">
            resonancestudio12@gmail.com
          </a>
        </motion.p>
      </div>
    </div>
  );
}
