"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, Mail, Clock, Sparkles, ArrowRight, Calendar, X, Plus, Award, CheckCircle2 } from "lucide-react";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

interface VerifiedUser {
  id: string;
  phone_number: string;
  name: string;
  email: string;
}

export default function ConfirmationPage() {
  const router = useRouter();
  const [verifiedUser, setVerifiedUser] = useState<VerifiedUser | null>(null);

  const [loyaltyStatus, setLoyaltyStatus] = useState<any>(null);

  useEffect(() => {
    // Load verified user from sessionStorage
    const storedUser = sessionStorage.getItem('verifiedUser');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setVerifiedUser(user);
      
      // Fetch loyalty status
      fetch(`/api/loyalty/status?phone=${user.phone_number}`)
        .then(res => res.json())
        .then(data => setLoyaltyStatus(data))
        .catch(err => console.error('Failed to fetch loyalty status:', err));
    }
  }, []);

  const handleBookAnotherSlot = () => {
    // User is already verified, go directly to booking
    // The verifiedUser is already in sessionStorage from the previous booking
    router.push('/booking/new');
  };

  const handleExit = () => {
    // Clear all session data and go to home
    sessionStorage.removeItem('verifiedUser');
    sessionStorage.removeItem('lastBookingId');
    router.push('/home');
  };

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

        {/* Loyalty Progress Card */}
        {loyaltyStatus && (loyaltyStatus.hours > 0 || loyaltyStatus.window_start) && (
          <motion.div
            className="glass-strong rounded-2xl p-6 mb-8 relative overflow-hidden group text-left"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 }}
          >
             <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-violet-500/10 opacity-50" />
             
             <div className="relative z-10">
               <div className="flex items-center gap-2 mb-3">
                 <Award className="w-5 h-5 text-yellow-500" />
                 <h3 className="text-lg font-bold text-white">Loyalty Status</h3>
               </div>
               
               <div className="flex justify-between items-end mb-2">
                 <span className="text-zinc-300 text-sm">Progress to ₹1500 Cashback</span>
                 <span className="text-violet-400 font-bold">{Math.min(loyaltyStatus.hours, 50).toFixed(1)} / 50 hrs</span>
               </div>
               
               <div className="h-3 w-full bg-zinc-800 rounded-full overflow-hidden mb-3">
                 <motion.div 
                   className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                   initial={{ width: 0 }}
                   animate={{ width: `${Math.min((loyaltyStatus.hours / 50) * 100, 100)}%` }}
                   transition={{ duration: 1, ease: "easeOut", delay: 0.8 }}
                 />
               </div>
               
               {loyaltyStatus.eligible ? (
                 <div className="mt-4 bg-green-500/20 text-green-400 p-3 rounded-xl border border-green-500/20 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm font-medium">You are eligible for <strong>₹1500 Cashback!</strong> <br/> Show this screen to the staff to claim it.</p>
                 </div>
               ) : (
                 <p className="text-xs text-zinc-500">
                   Complete 50 hours within 3 months to earn rewards.
                 </p>
               )}
             </div>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div 
          className="flex flex-col sm:flex-row gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <motion.button
            onClick={handleExit}
            className="flex-1 btn-secondary py-4 flex items-center justify-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <X className="w-5 h-5" />
            Exit
          </motion.button>
          <motion.button
            onClick={handleBookAnotherSlot}
            className="flex-1 btn-accent py-4 flex items-center justify-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-5 h-5" />
            Book Another Slot
          </motion.button>
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
