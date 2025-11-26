import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role for database operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configuration
const OTP_LENGTH = 6;
const MAX_ATTEMPTS = 5;

interface VerifyResult {
  success: boolean;
  error?: string;
}

/**
 * Verify OTP for a given phone number using the database
 * This is used by the cancel booking flow
 */
export async function verifyOTP(phone: string, code: string): Promise<VerifyResult> {
  try {
    // Normalize phone to digits only
    const phoneDigits = phone.replace(/\D/g, '');

    // Validate phone number format
    if (phoneDigits.length !== 10) {
      return { success: false, error: 'Invalid phone number format' };
    }

    // Validate OTP format
    if (!/^\d{6}$/.test(code)) {
      return { success: false, error: `OTP must be ${OTP_LENGTH} digits` };
    }

    // Fetch the latest unexpired OTP for this phone number
    const { data: otpRecord, error: fetchError } = await supabase
      .from('login_otps')
      .select('id, code_hash, attempts, expires_at')
      .eq('phone', phoneDigits)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !otpRecord) {
      return { success: false, error: 'No valid OTP found. Please request a new OTP.' };
    }

    // Check if OTP has expired
    if (new Date(otpRecord.expires_at) < new Date()) {
      // Delete expired OTP
      await supabase.from('login_otps').delete().eq('id', otpRecord.id);
      return { success: false, error: 'OTP has expired. Please request a new OTP.' };
    }

    // Check if max attempts exceeded
    if (otpRecord.attempts >= MAX_ATTEMPTS) {
      // Delete the OTP record after max attempts
      await supabase.from('login_otps').delete().eq('id', otpRecord.id);
      return { success: false, error: 'Too many incorrect attempts. Please request a new OTP.' };
    }

    // Verify OTP using bcrypt
    const isValidOTP = await bcrypt.compare(code, otpRecord.code_hash);

    if (!isValidOTP) {
      // Increment attempts
      const newAttempts = otpRecord.attempts + 1;
      await supabase
        .from('login_otps')
        .update({ attempts: newAttempts })
        .eq('id', otpRecord.id);

      const remainingAttempts = MAX_ATTEMPTS - newAttempts;

      if (remainingAttempts <= 0) {
        // Delete the OTP record after max attempts
        await supabase.from('login_otps').delete().eq('id', otpRecord.id);
        return { success: false, error: 'Too many incorrect attempts. Please request a new OTP.' };
      }

      return {
        success: false,
        error: `Invalid OTP. ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining.`,
      };
    }

    // OTP is valid - delete the OTP record
    await supabase.from('login_otps').delete().eq('id', otpRecord.id);

    return { success: true };
  } catch (error) {
    console.error('[OTP Store] Verification error:', error);
    return { success: false, error: 'Failed to verify OTP. Please try again.' };
  }
}
