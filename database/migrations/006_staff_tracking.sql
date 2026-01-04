-- Add column to track which staff member created the booking
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS created_by_staff_id UUID REFERENCES admin_users(id) ON DELETE SET NULL;
-- Create index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_bookings_created_by_staff ON bookings(created_by_staff_id);
