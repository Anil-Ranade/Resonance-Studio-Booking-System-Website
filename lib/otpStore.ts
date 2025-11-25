/**
 * OTP Store - In-memory storage for OTP verification
 * 
 * In production, consider using Redis or a database for:
 * - Persistence across server restarts
 * - Distributed systems support
 * - Better scalability
 */

interface OTPData {
  otp: string;
  expiresAt: number;
  attempts: number;
}

// Global store for OTPs
const otpStore = new Map<string, OTPData>();

// Track last OTP sent time to prevent spam
const lastOtpSentTime = new Map<string, number>();

// Configuration
export const OTP_CONFIG = {
  // OTP expiry time in milliseconds (5 minutes)
  EXPIRY_MS: 5 * 60 * 1000,
  // Maximum OTP verification attempts
  MAX_ATTEMPTS: 3,
  // Cooldown between OTP requests (1 minute)
  COOLDOWN_MS: 60 * 1000,
  // OTP length
  LENGTH: 6,
};

/**
 * Generate a random numeric OTP
 */
export function generateOTP(): string {
  const min = Math.pow(10, OTP_CONFIG.LENGTH - 1);
  const max = Math.pow(10, OTP_CONFIG.LENGTH) - 1;
  return Math.floor(min + Math.random() * (max - min + 1)).toString();
}

/**
 * Store an OTP for a phone number
 */
export function storeOTP(whatsapp: string, otp: string): void {
  otpStore.set(whatsapp, {
    otp,
    expiresAt: Date.now() + OTP_CONFIG.EXPIRY_MS,
    attempts: 0,
  });
  lastOtpSentTime.set(whatsapp, Date.now());
}

/**
 * Get stored OTP data for a phone number
 */
export function getOTPData(whatsapp: string): OTPData | undefined {
  return otpStore.get(whatsapp);
}

/**
 * Update OTP data
 */
export function updateOTPData(whatsapp: string, data: Partial<OTPData>): void {
  const existing = otpStore.get(whatsapp);
  if (existing) {
    otpStore.set(whatsapp, { ...existing, ...data });
  }
}

/**
 * Delete stored OTP
 */
export function deleteOTP(whatsapp: string): void {
  otpStore.delete(whatsapp);
}

/**
 * Check if cooldown is active for a phone number
 * Returns remaining seconds if on cooldown, 0 otherwise
 */
export function getCooldownRemaining(whatsapp: string): number {
  const lastSent = lastOtpSentTime.get(whatsapp);
  if (!lastSent) return 0;
  
  const elapsed = Date.now() - lastSent;
  if (elapsed >= OTP_CONFIG.COOLDOWN_MS) return 0;
  
  return Math.ceil((OTP_CONFIG.COOLDOWN_MS - elapsed) / 1000);
}

/**
 * Verify an OTP
 * Returns verification result with appropriate error messages
 */
export function verifyOTP(
  whatsapp: string, 
  userOtp: string
): { 
  success: boolean; 
  error?: string; 
  remainingAttempts?: number;
} {
  const data = otpStore.get(whatsapp);
  
  if (!data) {
    return { success: false, error: "No OTP found. Please request a new OTP." };
  }
  
  // Check expiry
  if (Date.now() > data.expiresAt) {
    otpStore.delete(whatsapp);
    return { success: false, error: "OTP has expired. Please request a new OTP." };
  }
  
  // Check max attempts
  if (data.attempts >= OTP_CONFIG.MAX_ATTEMPTS) {
    otpStore.delete(whatsapp);
    return { success: false, error: "Too many incorrect attempts. Please request a new OTP." };
  }
  
  // Verify OTP
  if (data.otp !== userOtp) {
    data.attempts += 1;
    otpStore.set(whatsapp, data);
    
    const remaining = OTP_CONFIG.MAX_ATTEMPTS - data.attempts;
    return { 
      success: false, 
      error: `Invalid OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`,
      remainingAttempts: remaining,
    };
  }
  
  // Success - clear OTP
  otpStore.delete(whatsapp);
  return { success: true };
}
