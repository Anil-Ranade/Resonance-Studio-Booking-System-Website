-- ============================================================================================================
-- RESONANCE STUDIO BOOKING - EMAIL MIGRATION
-- ============================================================================================================
-- 
-- This migration adds email support for Resend email notifications and removes SMS references.
-- Run this SQL in your Supabase SQL Editor to update the existing database.
-- 
-- Version: 1.1.0
-- Date: December 2025
-- 
-- ============================================================================================================

-- ============================================================================================================
-- 1. ADD EMAIL COLUMN TO LOGIN_OTPS TABLE
-- ============================================================================================================
-- Stores the email address where OTP was sent

ALTER TABLE login_otps 
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

COMMENT ON COLUMN login_otps.email IS 'Email address where OTP was sent via Resend';

-- ============================================================================================================
-- 2. ADD EMAIL_SENT COLUMN TO BOOKINGS TABLE
-- ============================================================================================================
-- Tracks whether confirmation email was sent for a booking

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT false;

COMMENT ON COLUMN bookings.email_sent IS 'Whether confirmation email was sent via Resend';

-- ============================================================================================================
-- 3. DROP LEGACY SMS_SENT COLUMN (OPTIONAL)
-- ============================================================================================================
-- Uncomment the following line if you want to remove the legacy sms_sent column
-- This is optional - keeping it won't cause issues

-- ALTER TABLE bookings DROP COLUMN IF EXISTS sms_sent;

-- ============================================================================================================
-- 4. UPDATE COMMENTS
-- ============================================================================================================

COMMENT ON TABLE login_otps IS 'OTP codes for phone verification - OTP sent via email using Resend';

-- ============================================================================================================
-- MIGRATION COMPLETE
-- ============================================================================================================
-- 
-- After running this migration:
-- 1. Set the following environment variables in your application:
--    - RESEND_API_KEY=your_resend_api_key
--    - RESEND_FROM_EMAIL=noreply@yourdomain.com
--
-- 2. Remove the following environment variables (no longer needed):
--    - TWILIO_ACCOUNT_SID
--    - TWILIO_AUTH_TOKEN
--    - TWILIO_SMS_NUMBER
--    - SMS_COUNTRY_CODE
--
-- 3. The application will now send OTP codes and booking notifications via email
--    instead of SMS.
--
-- ============================================================================================================
