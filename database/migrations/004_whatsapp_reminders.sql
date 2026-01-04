-- Add whatsapp_reminder_sent_at column to bookings table
-- This column tracks when an admin sent a WhatsApp reminder to the customer

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS whatsapp_reminder_sent_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN bookings.whatsapp_reminder_sent_at IS 'Timestamp when admin sent WhatsApp reminder to customer';
