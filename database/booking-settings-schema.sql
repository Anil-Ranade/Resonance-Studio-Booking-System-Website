-- Booking Settings Table
-- Stores global booking configuration

CREATE TABLE IF NOT EXISTS booking_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings
INSERT INTO booking_settings (key, value, description) VALUES
    ('min_booking_duration', '1', 'Minimum booking duration in hours'),
    ('max_booking_duration', '8', 'Maximum booking duration in hours'),
    ('booking_buffer', '0', 'Buffer time between bookings in minutes'),
    ('advance_booking_days', '30', 'How many days in advance users can book'),
    ('default_open_time', '"08:00"', 'Default studio opening time'),
    ('default_close_time', '"22:00"', 'Default studio closing time')
ON CONFLICT (key) DO NOTHING;

-- Enable RLS
ALTER TABLE booking_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings
CREATE POLICY "Anyone can view booking settings" ON booking_settings
    FOR SELECT USING (true);

-- Only admins can modify settings
CREATE POLICY "Admins can manage booking settings" ON booking_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid() 
            AND admin_users.is_active = true
        )
    );

-- Update trigger
DROP TRIGGER IF EXISTS update_booking_settings_updated_at ON booking_settings;
CREATE TRIGGER update_booking_settings_updated_at
    BEFORE UPDATE ON booking_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
