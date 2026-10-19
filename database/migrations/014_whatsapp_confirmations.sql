-- Separate tracking for WhatsApp booking confirmations (reminders keep using whatsapp_reminder_sent_at)
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS whatsapp_confirmation_sent_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

COMMENT ON COLUMN bookings.whatsapp_confirmation_sent_at IS 'Timestamp when admin sent WhatsApp booking confirmation to customer';
