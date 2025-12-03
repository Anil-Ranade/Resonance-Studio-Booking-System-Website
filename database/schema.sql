-- ============================================
-- RESONANCE STUDIO BOOKING - DATABASE SCHEMA
-- ============================================
-- This file contains the complete database schema for the Resonance Studio Booking application.
-- Run this SQL in your Supabase SQL Editor to set up the entire database.
-- ============================================

-- ============================================
-- EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- STUDIOS TABLE
-- Stores information about each studio
-- ============================================
CREATE TABLE IF NOT EXISTS studios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    type VARCHAR(100), -- e.g., 'Recording Studio', 'Mixing Suite', 'Podcast Room'
    capacity INTEGER NOT NULL DEFAULT 1,
    hourly_rate DECIMAL(10, 2) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    amenities JSONB DEFAULT '[]'::jsonb,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for active studios
CREATE INDEX IF NOT EXISTS idx_studios_active ON studios(is_active);

-- Insert default studios
INSERT INTO studios (name, type, hourly_rate, capacity, is_active) VALUES
    ('Studio A', 'Recording Studio', 500, 30, true),
    ('Studio B', 'Mixing Suite', 400, 12, true),
    ('Studio C', 'Podcast Room', 300, 5, true)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- ADMIN_USERS TABLE
-- Stores admin user information (extends auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin', 'staff')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for active admins
CREATE INDEX IF NOT EXISTS idx_admin_users_active ON admin_users(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);

-- ============================================
-- USERS TABLE
-- Stores customer user information
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number VARCHAR(15) NOT NULL UNIQUE,
    name VARCHAR(255),
    email VARCHAR(255),
    is_verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for phone number lookup
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);

-- ============================================
-- BOOKING_SETTINGS TABLE
-- Stores global booking configuration
-- ============================================
CREATE TABLE IF NOT EXISTS booking_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default booking settings
INSERT INTO booking_settings (key, value, description) VALUES
    ('min_booking_duration', '1', 'Minimum booking duration in hours'),
    ('max_booking_duration', '8', 'Maximum booking duration in hours'),
    ('booking_buffer', '0', 'Buffer time between bookings in minutes'),
    ('advance_booking_days', '30', 'How many days in advance users can book'),
    ('default_open_time', '"08:00"', 'Default studio opening time'),
    ('default_close_time', '"22:00"', 'Default studio closing time')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- AVAILABILITY_SLOTS TABLE (BLOCKED SLOTS)
-- Stores blocked time slots for each studio
-- By default, all slots within operating hours are available
-- Admin adds entries here to BLOCK specific time slots
-- ============================================
CREATE TABLE IF NOT EXISTS availability_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    studio VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT false, -- false = blocked, entries in this table are blocked slots
    block_reason TEXT, -- Optional reason for blocking
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Ensure end_time is after start_time
    CONSTRAINT valid_time_range CHECK (end_time > start_time),
    -- Prevent duplicate slots for same studio/date/time
    CONSTRAINT unique_slot UNIQUE (studio, date, start_time, end_time)
);

-- Index for faster availability queries
CREATE INDEX IF NOT EXISTS idx_availability_studio_date ON availability_slots(studio, date);
CREATE INDEX IF NOT EXISTS idx_availability_date ON availability_slots(date);
CREATE INDEX IF NOT EXISTS idx_availability_is_available ON availability_slots(is_available);

-- ============================================
-- BOOKINGS TABLE
-- Stores all booking records
-- ============================================
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    phone_number VARCHAR(15) NOT NULL, -- Also stored as whatsapp_number in some contexts
    name VARCHAR(255),
    studio VARCHAR(100) NOT NULL,
    session_type VARCHAR(100), -- e.g., 'Karaoke', 'Live with musicians', 'Band', 'Recording'
    session_details TEXT, -- Detailed information about the booking
    group_size INTEGER DEFAULT 1,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
    total_amount DECIMAL(10, 2),
    notes TEXT,
    google_event_id VARCHAR(255), -- Google Calendar event ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    
    -- Ensure end_time is after start_time
    CONSTRAINT valid_booking_time_range CHECK (end_time > start_time)
);

-- Indexes for faster booking queries
CREATE INDEX IF NOT EXISTS idx_bookings_phone ON bookings(phone_number);
CREATE INDEX IF NOT EXISTS idx_bookings_studio_date ON bookings(studio, date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at);

-- ============================================
-- REMINDERS TABLE
-- Stores scheduled reminders for bookings
-- ============================================
CREATE TABLE IF NOT EXISTS reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('confirmation', '24h_reminder', '1h_reminder', 'custom')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for reminders
CREATE INDEX IF NOT EXISTS idx_reminders_booking ON reminders(booking_id);
CREATE INDEX IF NOT EXISTS idx_reminders_scheduled ON reminders(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_reminders_status ON reminders(status);

-- ============================================
-- LOGIN_OTPS TABLE
-- Stores OTP codes for phone authentication
-- ============================================
CREATE TABLE IF NOT EXISTS login_otps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(15) NOT NULL,
    code_hash VARCHAR(255) NOT NULL, -- bcrypt hashed OTP
    attempts INTEGER NOT NULL DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for OTP lookup
CREATE INDEX IF NOT EXISTS idx_login_otps_phone ON login_otps(phone);
CREATE INDEX IF NOT EXISTS idx_login_otps_expires ON login_otps(expires_at);

-- ============================================
-- TRUSTED_DEVICES TABLE
-- Schema moved to database/devices.sql
-- Run devices.sql after this schema to set up trusted devices
-- ============================================

-- ============================================
-- RATE_CARDS TABLE
-- Stores pricing information for different session types
-- ============================================
CREATE TABLE IF NOT EXISTS rate_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    studio VARCHAR(100) NOT NULL,
    session_type VARCHAR(100) NOT NULL,
    sub_option VARCHAR(100), -- e.g., 'upto_5', 'upto_8' for Karaoke
    hourly_rate DECIMAL(10, 2) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_rate_card UNIQUE (studio, session_type, sub_option)
);

-- Indexes for rate cards
CREATE INDEX IF NOT EXISTS idx_rate_cards_studio ON rate_cards(studio);
CREATE INDEX IF NOT EXISTS idx_rate_cards_session_type ON rate_cards(session_type);

-- Insert default rate cards
INSERT INTO rate_cards (studio, session_type, sub_option, hourly_rate) VALUES
    -- Studio A - Karaoke
    ('Studio A', 'Karaoke', 'upto_5', 400),
    ('Studio A', 'Karaoke', 'upto_8', 400),
    ('Studio A', 'Karaoke', '10', 400),
    ('Studio A', 'Karaoke', '20', 400),
    ('Studio A', 'Karaoke', '21_30', 500),
    -- Studio A - Live with musicians
    ('Studio A', 'Live with musicians', 'upto_2', 600),
    ('Studio A', 'Live with musicians', 'upto_4', 600),
    ('Studio A', 'Live with musicians', '5', 600),
    ('Studio A', 'Live with musicians', 'upto_8', 600),
    ('Studio A', 'Live with musicians', '9_12', 800),
    -- Studio A - Other
    ('Studio A', 'Only Drum Practice', NULL, 350),
    ('Studio A', 'Band', 'drum_only', 400),
    ('Studio A', 'Band', 'drum_amps', 500),
    ('Studio A', 'Band', 'drum_amps_guitars', 600),
    ('Studio A', 'Band', 'full', 600),
    ('Studio A', 'Recording', 'audio_recording', 700),
    ('Studio A', 'Recording', 'video_recording', 800),
    ('Studio A', 'Recording', 'chroma_key', 1200),
    -- Studio B
    ('Studio B', 'Karaoke', 'upto_5', 300),
    ('Studio B', 'Karaoke', 'upto_8', 300),
    ('Studio B', 'Karaoke', '10', 300),
    ('Studio B', 'Live with musicians', 'upto_2', 400),
    ('Studio B', 'Live with musicians', 'upto_4', 400),
    ('Studio B', 'Live with musicians', '5', 500),
    ('Studio B', 'Band', 'drum_only', 350),
    ('Studio B', 'Band', 'drum_amps', 400),
    ('Studio B', 'Band', 'drum_amps_guitars', 450),
    -- Studio C
    ('Studio C', 'Karaoke', 'upto_5', 250),
    ('Studio C', 'Live with musicians', 'upto_2', 350),
    ('Studio C', 'Band', 'drum_only', 300),
    ('Studio C', 'Band', 'drum_amps', 350)
ON CONFLICT (studio, session_type, sub_option) DO NOTHING;

-- ============================================
-- AUDIT_LOGS TABLE
-- Tracks all admin actions for accountability
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES admin_users(id),
    action VARCHAR(100) NOT NULL, -- e.g., 'create', 'update', 'delete', 'block', 'unblock'
    entity_type VARCHAR(50) NOT NULL, -- e.g., 'booking', 'availability_slot', 'setting'
    entity_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- ============================================
-- CONTACT_SUBMISSIONS TABLE
-- Stores contact form submissions
-- ============================================
CREATE TABLE IF NOT EXISTS contact_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    message TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'responded', 'closed')),
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for contact submissions
CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON contact_submissions(status);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at ON contact_submissions(created_at);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE studios ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STUDIOS POLICIES
-- ============================================
CREATE POLICY "Anyone can view active studios" ON studios
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage studios" ON studios
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid() 
            AND admin_users.is_active = true
        )
    );

-- ============================================
-- USERS POLICIES
-- ============================================
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid() 
            AND admin_users.is_active = true
        )
    );

-- ============================================
-- AVAILABILITY_SLOTS POLICIES
-- ============================================
CREATE POLICY "Anyone can view availability slots" ON availability_slots
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage availability" ON availability_slots
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid() 
            AND admin_users.is_active = true
        )
    );

-- ============================================
-- BOOKINGS POLICIES
-- ============================================
CREATE POLICY "Users can view own bookings" ON bookings
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid() 
            AND admin_users.is_active = true
        )
    );

CREATE POLICY "Anyone can create bookings" ON bookings
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own bookings" ON bookings
    FOR UPDATE USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid() 
            AND admin_users.is_active = true
        )
    );

CREATE POLICY "Admins can delete bookings" ON bookings
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid() 
            AND admin_users.is_active = true
        )
    );

-- ============================================
-- REMINDERS POLICIES
-- ============================================
CREATE POLICY "System can manage reminders" ON reminders
    FOR ALL USING (true);

-- ============================================
-- RATE_CARDS POLICIES
-- ============================================
CREATE POLICY "Anyone can view active rate cards" ON rate_cards
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage rate cards" ON rate_cards
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid() 
            AND admin_users.is_active = true
        )
    );

-- ============================================
-- ADMIN_USERS POLICIES
-- ============================================
CREATE POLICY "Admins can view admin users" ON admin_users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users au
            WHERE au.id = auth.uid() 
            AND au.is_active = true
        )
    );

CREATE POLICY "Super admins can manage admin users" ON admin_users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users au
            WHERE au.id = auth.uid() 
            AND au.is_active = true
            AND au.role = 'super_admin'
        )
    );

-- ============================================
-- AUDIT_LOGS POLICIES
-- ============================================
CREATE POLICY "Super admins can view audit logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid() 
            AND admin_users.is_active = true
            AND admin_users.role = 'super_admin'
        )
    );

CREATE POLICY "System can create audit logs" ON audit_logs
    FOR INSERT WITH CHECK (true);

-- ============================================
-- BOOKING_SETTINGS POLICIES
-- ============================================
CREATE POLICY "Anyone can view booking settings" ON booking_settings
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage booking settings" ON booking_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid() 
            AND admin_users.is_active = true
        )
    );

-- ============================================
-- LOGIN_OTPS POLICIES
-- ============================================
CREATE POLICY "System can manage OTPs" ON login_otps
    FOR ALL USING (true);

-- ============================================
-- CONTACT_SUBMISSIONS POLICIES
-- ============================================
CREATE POLICY "Anyone can create contact submissions" ON contact_submissions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view and manage contact submissions" ON contact_submissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid() 
            AND admin_users.is_active = true
        )
    );

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables with updated_at column
DROP TRIGGER IF EXISTS update_studios_updated_at ON studios;
CREATE TRIGGER update_studios_updated_at
    BEFORE UPDATE ON studios
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_availability_slots_updated_at ON availability_slots;
CREATE TRIGGER update_availability_slots_updated_at
    BEFORE UPDATE ON availability_slots
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rate_cards_updated_at ON rate_cards;
CREATE TRIGGER update_rate_cards_updated_at
    BEFORE UPDATE ON rate_cards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;
CREATE TRIGGER update_admin_users_updated_at
    BEFORE UPDATE ON admin_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_booking_settings_updated_at ON booking_settings;
CREATE TRIGGER update_booking_settings_updated_at
    BEFORE UPDATE ON booking_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to check if a user is an admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_users 
        WHERE id = user_id 
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if a time slot is available
CREATE OR REPLACE FUNCTION check_slot_availability(
    p_studio VARCHAR,
    p_date DATE,
    p_start_time TIME,
    p_end_time TIME,
    p_exclude_booking_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    has_blocked_slot BOOLEAN;
    has_conflict BOOLEAN;
BEGIN
    -- Check if there's a blocked slot overlapping this time
    SELECT EXISTS (
        SELECT 1 FROM availability_slots
        WHERE studio = p_studio
        AND date = p_date
        AND is_available = false
        AND start_time < p_end_time
        AND end_time > p_start_time
    ) INTO has_blocked_slot;
    
    -- Check for conflicting bookings
    SELECT EXISTS (
        SELECT 1 FROM bookings
        WHERE studio = p_studio
        AND date = p_date
        AND status IN ('pending', 'confirmed')
        AND id != COALESCE(p_exclude_booking_id, '00000000-0000-0000-0000-000000000000'::UUID)
        AND start_time < p_end_time
        AND end_time > p_start_time
    ) INTO has_conflict;
    
    -- Slot is available if not blocked and no conflicts
    RETURN NOT has_blocked_slot AND NOT has_conflict;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired OTPs
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
    DELETE FROM login_otps WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- VIEWS
-- ============================================

-- View for upcoming bookings with customer details
CREATE OR REPLACE VIEW upcoming_bookings AS
SELECT 
    b.*,
    s.name as studio_name,
    s.capacity as studio_capacity
FROM bookings b
LEFT JOIN studios s ON s.name = b.studio
WHERE b.date >= CURRENT_DATE
AND b.status IN ('pending', 'confirmed')
ORDER BY b.date, b.start_time;

-- View for daily availability summary
CREATE OR REPLACE VIEW daily_availability_summary AS
SELECT 
    a.date,
    a.studio,
    COUNT(*) as total_blocked_slots,
    COUNT(DISTINCT b.id) as booked_slots
FROM availability_slots a
LEFT JOIN bookings b ON b.studio = a.studio 
    AND b.date = a.date 
    AND b.status IN ('pending', 'confirmed')
    AND b.start_time >= a.start_time 
    AND b.end_time <= a.end_time
WHERE a.date >= CURRENT_DATE
GROUP BY a.date, a.studio
ORDER BY a.date, a.studio;

-- View for booking statistics
CREATE OR REPLACE VIEW booking_stats AS
SELECT 
    COUNT(*) as total_bookings,
    COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_bookings,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_bookings,
    COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_bookings,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_bookings,
    COUNT(*) FILTER (WHERE status = 'no_show') as no_show_bookings,
    COALESCE(SUM(total_amount) FILTER (WHERE status IN ('confirmed', 'completed')), 0) as total_revenue,
    COUNT(*) FILTER (WHERE date = CURRENT_DATE AND status IN ('pending', 'confirmed')) as today_bookings
FROM bookings;

-- ============================================
-- SAMPLE DATA NOTES
-- ============================================

-- To create a test admin, first create the user via Supabase Auth,
-- then run this with the user's UUID:
-- INSERT INTO admin_users (id, email, name, role) VALUES 
--     ('your-auth-user-uuid', 'admin@resonance.studio', 'Admin User', 'super_admin');

-- ============================================
-- CLEANUP COMMANDS (use with caution!)
-- ============================================

-- To drop all tables and start fresh (DESTRUCTIVE!):
/*
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS reminders CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS availability_slots CASCADE;
DROP TABLE IF EXISTS rate_cards CASCADE;
DROP TABLE IF EXISTS booking_settings CASCADE;
DROP TABLE IF EXISTS login_otps CASCADE;
DROP TABLE IF EXISTS contact_submissions CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS studios CASCADE;

DROP VIEW IF EXISTS upcoming_bookings CASCADE;
DROP VIEW IF EXISTS daily_availability_summary CASCADE;
DROP VIEW IF EXISTS booking_stats CASCADE;

DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
DROP FUNCTION IF EXISTS is_admin CASCADE;
DROP FUNCTION IF EXISTS check_slot_availability CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_otps CASCADE;
*/
