'use client';

import { motion, HTMLMotionProps, Variants } from 'framer-motion';
import { ComponentType, ReactNode, memo } from 'react';
import { useDevicePerformance } from './useDevicePerformance';

type MotionDivProps = HTMLMotionProps<'div'> & {
  children?: ReactNode;
};

/**
 * Optimized motion.div that disables animations on low-end devices
 */
export const OptimizedMotionDiv = memo(function OptimizedMotionDiv({
  children,
  animate,
  initial,
  whileHover,
  whileTap,
  whileInView,
  transition,
  variants,
  ...props
}: MotionDivProps) {
  const { shouldReduceAnimations } = useDevicePerformance();

  if (shouldReduceAnimations) {
    // Return a simple div without animations for low-end devices
    return (
      <div {...(props as React.HTMLAttributes<HTMLDivElement>)}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      animate={animate}
      initial={initial}
      whileHover={whileHover}
      whileTap={whileTap}
      whileInView={whileInView}
      transition={transition}
      variants={variants}
      {...props}
    >
      {children}
    </motion.div>
  );
});

/**
 * Simple fade-in animation component
 */
export const FadeIn = memo(function FadeIn({
  children,
  delay = 0,
  duration = 0.4,
  className = '',
}: {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}) {
  const { shouldReduceAnimations } = useDevicePerformance();

  if (shouldReduceAnimations) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
});

/**
 * Stagger container for child animations
 */
export const StaggerContainer = memo(function StaggerContainer({
  children,
  className = '',
  staggerDelay = 0.1,
}: {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}) {
  const { shouldReduceAnimations } = useDevicePerformance();

  if (shouldReduceAnimations) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="initial"
      animate="animate"
      variants={{
        animate: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
});

/**
 * Animated card with hover effects
 */
export const AnimatedCard = memo(function AnimatedCard({
  children,
  className = '',
  hoverScale = 1.02,
  hoverY = -4,
}: {
  children: ReactNode;
  className?: string;
  hoverScale?: number;
  hoverY?: number;
}) {
  const { shouldReduceAnimations, isMobile } = useDevicePerformance();

  // No hover animations on mobile or when reducing animations
  if (shouldReduceAnimations || isMobile) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      whileHover={{ scale: hoverScale, y: hoverY }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
});

/**
 * Viewport-based animation wrapper
 */
export const AnimateOnScroll = memo(function AnimateOnScroll({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  const { shouldReduceAnimations } = useDevicePerformance();

  if (shouldReduceAnimations) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
});
