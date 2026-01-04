-- =====================================================
-- MIGRATION: ADD PAYMENT STATUS
-- =====================================================

-- Add payment_status column to bookings table
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending';

-- Update existing bookings to have 'pending' payment status
UPDATE bookings
SET payment_status = 'pending'
WHERE payment_status IS NULL;
