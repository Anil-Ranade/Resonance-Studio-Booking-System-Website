'use client';

import { useState, useEffect } from 'react';

interface DevicePerformance {
  isLowEnd: boolean;
  isMobile: boolean;
  prefersReducedMotion: boolean;
  shouldReduceAnimations: boolean;
}

/**
 * Hook to detect device performance capabilities
 * Returns flags to help optimize animations and effects for slower devices
 */
export function useDevicePerformance(): DevicePerformance {
  const [performance, setPerformance] = useState<DevicePerformance>({
    isLowEnd: false,
    isMobile: false,
    prefersReducedMotion: false,
    shouldReduceAnimations: false,
  });

  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Check if mobile device
    const isMobile = window.matchMedia('(max-width: 768px)').matches || 
                     /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Check for low-end device indicators
    const isLowEnd = 
      // Check hardware concurrency (CPU cores)
      (navigator.hardwareConcurrency !== undefined && navigator.hardwareConcurrency <= 4) ||
      // Check device memory (if available)
      ((navigator as Navigator & { deviceMemory?: number }).deviceMemory !== undefined && 
       (navigator as Navigator & { deviceMemory?: number }).deviceMemory! <= 4) ||
      // Check connection type for slow networks (likely correlates with older devices)
      ((navigator as Navigator & { connection?: { effectiveType?: string } }).connection?.effectiveType === '2g' ||
       (navigator as Navigator & { connection?: { effectiveType?: string } }).connection?.effectiveType === 'slow-2g');

    // Should reduce animations if any of these conditions are true
    const shouldReduceAnimations = prefersReducedMotion || (isMobile && isLowEnd);

    setPerformance({
      isLowEnd,
      isMobile,
      prefersReducedMotion,
      shouldReduceAnimations,
    });
  }, []);

  return performance;
}

/**
 * Returns simplified animation variants for low-end devices
 */
export function getOptimizedVariants(shouldReduce: boolean) {
  if (shouldReduce) {
    return {
      fadeInUp: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.2 }
      },
      fadeInLeft: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.2 }
      },
      fadeInRight: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.2 }
      },
      staggerContainer: {
        animate: {
          transition: {
            staggerChildren: 0.05,
          }
        }
      },
      hover: {},
      whileHover: undefined,
      whileTap: undefined,
    };
  }

  return {
    fadeInUp: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.4, ease: "easeOut" }
    },
    fadeInLeft: {
      initial: { opacity: 0, x: -20 },
      animate: { opacity: 1, x: 0 },
      transition: { duration: 0.4, ease: "easeOut" }
    },
    fadeInRight: {
      initial: { opacity: 0, x: 20 },
      animate: { opacity: 1, x: 0 },
      transition: { duration: 0.4, ease: "easeOut" }
    },
    staggerContainer: {
      animate: {
        transition: {
          staggerChildren: 0.1,
          delayChildren: 0.1
        }
      }
    },
    hover: { y: -4, transition: { duration: 0.2 } },
    whileHover: { scale: 1.02, y: -2 },
    whileTap: { scale: 0.98 },
  };
}
