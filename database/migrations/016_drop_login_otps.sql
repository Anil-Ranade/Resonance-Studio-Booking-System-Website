-- Migration: 016_drop_login_otps
-- Description: Drop the OTP login table. Customers sign in with passwords
--              (012_customer_passwords); the OTP endpoints have been removed.

DROP TABLE IF EXISTS login_otps;
DROP FUNCTION IF EXISTS cleanup_expired_otps();

-- Contact form submissions were never written by the app (contact page uses mailto)
DROP TABLE IF EXISTS contact_submissions;
