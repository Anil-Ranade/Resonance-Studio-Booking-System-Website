-- =====================================================
-- RESONANCE STUDIO BOOKING SYSTEM - DATABASE SCHEMA
-- =====================================================
-- 
-- This schema is designed for Supabase (PostgreSQL) with
-- Row Level Security (RLS) policies and proper indexing.
--
-- Last Updated: December 2025
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- CUSTOM TYPES (ENUMS)
-- =====================================================

-- Booking status type
DO $$ BEGIN
    CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed', 'no_show');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Session type
DO $$ BEGIN
    CREATE TYPE session_type AS ENUM ('karaoke', 'live', 'drum_practice', 'band', 'recording');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Admin role type
DO $$ BEGIN
    CREATE TYPE admin_role AS ENUM ('admin', 'super_admin', 'staff');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Audit action type
DO $$ BEGIN
    CREATE TYPE audit_action AS ENUM ('create', 'update', 'delete', 'confirm', 'cancel', 'block', 'unblock', 'login', 'logout', 'whatsapp_reminder_sent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- TABLE: studios
-- Description: Studio information (name, type, capacity, 
-- hourly rates, amenities)
-- =====================================================
CREATE TABLE IF NOT EXISTS studios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    type VARCHAR(100) NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 10,
    hourly_rate DECIMAL(10, 2) NOT NULL DEFAULT 0,
    description TEXT,
    amenities JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create index on studios
CREATE INDEX IF NOT EXISTS idx_studios_is_active ON studios(is_active);
CREATE INDEX IF NOT EXISTS idx_studios_name ON studios(name);

-- =====================================================
-- TABLE: users
-- Description: Customer information (phone, name, email, 
-- verification status)
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number VARCHAR(15) NOT NULL UNIQUE,
    name VARCHAR(255),
    email VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    total_bookings INTEGER DEFAULT 0,
    last_booking_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes on users
CREATE INDEX IF NOT EXISTS idx_users_phone_number ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- =====================================================
-- TABLE: admin_users
-- Description: Admin user accounts linked to Supabase Auth
-- (roles: admin, super_admin, staff)
-- =====================================================
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255),
    role admin_role DEFAULT 'staff',
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes on admin_users
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON admin_users(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);

-- =====================================================
-- TABLE: bookings
-- Description: All booking records with status tracking
-- =====================================================
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number VARCHAR(15) NOT NULL,
    name VARCHAR(255),
    email VARCHAR(255),
    studio VARCHAR(100) NOT NULL,
    session_type VARCHAR(100) NOT NULL,
    session_details TEXT,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    total_amount DECIMAL(10, 2),
    notes TEXT,
    google_event_id VARCHAR(255),
    email_sent BOOLEAN DEFAULT FALSE,
    sms_sent BOOLEAN DEFAULT FALSE,
    whatsapp_reminder_sent_at TIMESTAMPTZ DEFAULT NULL,
    created_by_staff_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    cancelled_at TIMESTAMPTZ,
    cancelled_by VARCHAR(50),
    cancellation_reason TEXT,
    confirmed_at TIMESTAMPTZ,
    confirmed_by VARCHAR(50),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_time_range CHECK (end_time > start_time),
    CONSTRAINT chk_status CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show'))
);

-- Create indexes on bookings
CREATE INDEX IF NOT EXISTS idx_bookings_phone_number ON bookings(phone_number);
CREATE INDEX IF NOT EXISTS idx_bookings_studio ON bookings(studio);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_studio_date ON bookings(studio, date);
CREATE INDEX IF NOT EXISTS idx_bookings_date_status ON bookings(date, status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_created_by_staff ON bookings(created_by_staff_id);

-- =====================================================
-- TABLE: availability_slots
-- Description: Blocked time slots per studio
-- (used to manually block availability)
-- =====================================================
CREATE TABLE IF NOT EXISTS availability_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    studio VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT FALSE,  -- FALSE = blocked
    reason TEXT,
    created_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_availability_time_range CHECK (end_time > start_time),
    -- Prevent duplicate blocked slots
    CONSTRAINT uq_availability_slot UNIQUE (studio, date, start_time, end_time)
);

-- Create indexes on availability_slots
CREATE INDEX IF NOT EXISTS idx_availability_studio ON availability_slots(studio);
CREATE INDEX IF NOT EXISTS idx_availability_date ON availability_slots(date);
CREATE INDEX IF NOT EXISTS idx_availability_studio_date ON availability_slots(studio, date);
CREATE INDEX IF NOT EXISTS idx_availability_is_available ON availability_slots(is_available);

-- =====================================================
-- TABLE: booking_settings
-- Description: System configuration for booking rules
-- (min/max hours, buffer, advance days, operating hours)
-- =====================================================
CREATE TABLE IF NOT EXISTS booking_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) NOT NULL UNIQUE,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create index on booking_settings
CREATE INDEX IF NOT EXISTS idx_booking_settings_key ON booking_settings(key);

-- Insert default booking settings
INSERT INTO booking_settings (key, value, description) VALUES
    ('min_booking_duration', '1', 'Minimum booking duration in hours'),
    ('max_booking_duration', '8', 'Maximum booking duration in hours'),
    ('booking_buffer', '0', 'Buffer time between bookings in minutes'),
    ('advance_booking_days', '30', 'How many days in advance bookings can be made'),
    ('default_open_time', '"08:00"', 'Default studio opening time'),
    ('default_close_time', '"22:00"', 'Default studio closing time')
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- TABLE: login_otps
-- Description: OTP verification records (bcrypt hashed)
-- =====================================================
CREATE TABLE IF NOT EXISTS login_otps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(15) NOT NULL,
    email VARCHAR(255),
    code_hash VARCHAR(255) NOT NULL,
    attempts INTEGER DEFAULT 0,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes on login_otps
CREATE INDEX IF NOT EXISTS idx_login_otps_phone ON login_otps(phone);
CREATE INDEX IF NOT EXISTS idx_login_otps_expires_at ON login_otps(expires_at);
CREATE INDEX IF NOT EXISTS idx_login_otps_phone_expires ON login_otps(phone, expires_at);

-- =====================================================
-- TABLE: trusted_devices
-- Description: Verified device fingerprints for trusted
-- device login (skip OTP)
-- =====================================================
CREATE TABLE IF NOT EXISTS trusted_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(15) NOT NULL,
    device_fingerprint VARCHAR(255) NOT NULL,
    device_name VARCHAR(255) DEFAULT 'Unknown Device',
    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique constraint on phone + fingerprint combination
    CONSTRAINT uq_trusted_device UNIQUE (phone, device_fingerprint)
);

-- Create indexes on trusted_devices
CREATE INDEX IF NOT EXISTS idx_trusted_devices_phone ON trusted_devices(phone);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_fingerprint ON trusted_devices(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_phone_fingerprint ON trusted_devices(phone, device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_is_active ON trusted_devices(is_active);

-- =====================================================
-- TABLE: rate_cards
-- Description: Pricing per studio, session type, and 
-- sub-option
-- =====================================================
CREATE TABLE IF NOT EXISTS rate_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    studio VARCHAR(100) NOT NULL,
    session_type VARCHAR(100) NOT NULL,
    sub_option VARCHAR(100),  -- e.g., participant range, equipment type
    hourly_rate DECIMAL(10, 2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    description TEXT,
    min_participants INTEGER,
    max_participants INTEGER,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique constraint
    CONSTRAINT uq_rate_card UNIQUE (studio, session_type, sub_option)
);

-- Create indexes on rate_cards
CREATE INDEX IF NOT EXISTS idx_rate_cards_studio ON rate_cards(studio);
CREATE INDEX IF NOT EXISTS idx_rate_cards_session_type ON rate_cards(session_type);
CREATE INDEX IF NOT EXISTS idx_rate_cards_is_active ON rate_cards(is_active);
CREATE INDEX IF NOT EXISTS idx_rate_cards_studio_session ON rate_cards(studio, session_type);

-- =====================================================
-- TABLE: audit_logs
-- Description: Admin action tracking for accountability
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes on audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON audit_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- =====================================================
-- UPDATE TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for studios
DROP TRIGGER IF EXISTS update_studios_updated_at ON studios;
CREATE TRIGGER update_studios_updated_at
    BEFORE UPDATE ON studios
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for users
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for admin_users
DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;
CREATE TRIGGER update_admin_users_updated_at
    BEFORE UPDATE ON admin_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for bookings
DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for availability_slots
DROP TRIGGER IF EXISTS update_availability_slots_updated_at ON availability_slots;
CREATE TRIGGER update_availability_slots_updated_at
    BEFORE UPDATE ON availability_slots
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for booking_settings
DROP TRIGGER IF EXISTS update_booking_settings_updated_at ON booking_settings;
CREATE TRIGGER update_booking_settings_updated_at
    BEFORE UPDATE ON booking_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for rate_cards
DROP TRIGGER IF EXISTS update_rate_cards_updated_at ON rate_cards;
CREATE TRIGGER update_rate_cards_updated_at
    BEFORE UPDATE ON rate_cards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE studios ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE trusted_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Studios Policies (Public read, Admin write)
DROP POLICY IF EXISTS "Studios are viewable by everyone" ON studios;
CREATE POLICY "Studios are viewable by everyone" ON studios
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Studios are editable by admins" ON studios;
CREATE POLICY "Studios are editable by admins" ON studios
    FOR ALL USING (
        auth.uid() IN (SELECT id FROM admin_users WHERE is_active = true)
    );

-- Users Policies
DROP POLICY IF EXISTS "Users can view their own data" ON users;
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can be managed by service role" ON users;
CREATE POLICY "Users can be managed by service role" ON users
    FOR ALL USING (auth.role() = 'service_role');

-- Admin Users Policies
DROP POLICY IF EXISTS "Admin users viewable by authenticated admins" ON admin_users;
CREATE POLICY "Admin users viewable by authenticated admins" ON admin_users
    FOR SELECT USING (
        auth.uid() IN (SELECT id FROM admin_users WHERE is_active = true)
    );

DROP POLICY IF EXISTS "Admin users manageable by super admins" ON admin_users;
CREATE POLICY "Admin users manageable by super admins" ON admin_users
    FOR ALL USING (
        auth.uid() IN (SELECT id FROM admin_users WHERE role = 'super_admin' AND is_active = true)
    );

-- Bookings Policies
DROP POLICY IF EXISTS "Bookings viewable by everyone for availability check" ON bookings;
CREATE POLICY "Bookings viewable by everyone for availability check" ON bookings
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Bookings can be managed by service role" ON bookings;
CREATE POLICY "Bookings can be managed by service role" ON bookings
    FOR ALL USING (auth.role() = 'service_role');

-- Availability Slots Policies
DROP POLICY IF EXISTS "Availability slots are viewable by everyone" ON availability_slots;
CREATE POLICY "Availability slots are viewable by everyone" ON availability_slots
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Availability slots managed by admins" ON availability_slots;
CREATE POLICY "Availability slots managed by admins" ON availability_slots
    FOR ALL USING (
        auth.uid() IN (SELECT id FROM admin_users WHERE is_active = true)
    );

-- Booking Settings Policies
DROP POLICY IF EXISTS "Booking settings are viewable by everyone" ON booking_settings;
CREATE POLICY "Booking settings are viewable by everyone" ON booking_settings
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Booking settings managed by admins" ON booking_settings;
CREATE POLICY "Booking settings managed by admins" ON booking_settings
    FOR ALL USING (
        auth.uid() IN (SELECT id FROM admin_users WHERE is_active = true)
    );

-- Login OTPs Policies (Service role only)
DROP POLICY IF EXISTS "OTPs managed by service role" ON login_otps;
CREATE POLICY "OTPs managed by service role" ON login_otps
    FOR ALL USING (auth.role() = 'service_role');

-- Trusted Devices Policies (Service role only)
DROP POLICY IF EXISTS "Trusted devices managed by service role" ON trusted_devices;
CREATE POLICY "Trusted devices managed by service role" ON trusted_devices
    FOR ALL USING (auth.role() = 'service_role');

-- Rate Cards Policies
DROP POLICY IF EXISTS "Rate cards are viewable by everyone" ON rate_cards;
CREATE POLICY "Rate cards are viewable by everyone" ON rate_cards
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Rate cards managed by admins" ON rate_cards;
CREATE POLICY "Rate cards managed by admins" ON rate_cards
    FOR ALL USING (
        auth.uid() IN (SELECT id FROM admin_users WHERE is_active = true)
    );

-- Audit Logs Policies
DROP POLICY IF EXISTS "Audit logs viewable by admins" ON audit_logs;
CREATE POLICY "Audit logs viewable by admins" ON audit_logs
    FOR SELECT USING (
        auth.uid() IN (SELECT id FROM admin_users WHERE is_active = true)
    );

DROP POLICY IF EXISTS "Audit logs insertable by service role" ON audit_logs;
CREATE POLICY "Audit logs insertable by service role" ON audit_logs
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- SAMPLE DATA (Optional - for development/testing)
-- =====================================================

-- Insert sample studios
INSERT INTO studios (name, type, capacity, hourly_rate, description) VALUES
    ('Studio A', 'Main Recording Studio', 30, 600, 'Our largest studio with full recording capabilities'),
    ('Studio B', 'Rehearsal Room', 12, 400, 'Perfect for band rehearsals and live sessions'),
    ('Studio C', 'Practice Room', 5, 250, 'Compact room for individual or small group practice')
ON CONFLICT (name) DO NOTHING;

-- Insert sample rate cards based on the pricing structure
-- Karaoke rates for Studio A
INSERT INTO rate_cards (studio, session_type, sub_option, hourly_rate, min_participants, max_participants) VALUES
    ('Studio A', 'karaoke', '1-5 people', 400, 1, 5),
    ('Studio A', 'karaoke', '6-10 people', 400, 6, 10),
    ('Studio A', 'karaoke', '11-20 people', 400, 11, 20),
    ('Studio A', 'karaoke', '21-30 people', 500, 21, 30),
    ('Studio A', 'live', '1-2 musicians', 600, 1, 2),
    ('Studio A', 'live', '3-4 musicians', 600, 3, 4),
    ('Studio A', 'live', '5 musicians', 600, 5, 5),
    ('Studio A', 'live', '6-8 musicians', 600, 6, 8),
    ('Studio A', 'band', 'drum_only', 400, 1, 6),
    ('Studio A', 'band', 'drum_amps', 500, 1, 6),
    ('Studio A', 'band', 'drum_amps_guitars', 600, 1, 6),
    ('Studio A', 'band', 'full_setup', 600, 1, 6),
    ('Studio A', 'drum_practice', 'solo', 350, 1, 1),
    ('Studio A', 'recording', 'audio', 700, 1, 4),
    ('Studio A', 'recording', 'video', 800, 1, 4),
    ('Studio A', 'recording', 'chroma_key', 1200, 1, 4),
    -- Studio B rates
    ('Studio B', 'karaoke', '1-5 people', 300, 1, 5),
    ('Studio B', 'karaoke', '6-10 people', 300, 6, 10),
    ('Studio B', 'karaoke', '11-12 people', 350, 11, 12),
    ('Studio B', 'live', '1-2 musicians', 400, 1, 2),
    ('Studio B', 'live', '3-4 musicians', 400, 3, 4),
    ('Studio B', 'live', '5 musicians', 450, 5, 5),
    ('Studio B', 'band', 'drum_only', 350, 1, 6),
    ('Studio B', 'band', 'drum_amps', 400, 1, 6),
    ('Studio B', 'band', 'drum_amps_guitars', 450, 1, 6),
    -- Studio C rates
    ('Studio C', 'karaoke', '1-5 people', 250, 1, 5),
    ('Studio C', 'live', '1-2 musicians', 350, 1, 2),
    ('Studio C', 'band', 'without_drum', 300, 1, 5)
ON CONFLICT (studio, session_type, sub_option) DO NOTHING;

-- =====================================================
-- HELPFUL VIEWS
-- =====================================================

-- View for today's bookings
CREATE OR REPLACE VIEW v_todays_bookings AS
SELECT 
    b.*,
    s.name as studio_name,
    s.type as studio_type
FROM bookings b
LEFT JOIN studios s ON b.studio = s.name
WHERE b.date = CURRENT_DATE
AND b.status IN ('confirmed', 'pending')
ORDER BY b.start_time;

-- View for upcoming bookings
CREATE OR REPLACE VIEW v_upcoming_bookings AS
SELECT 
    b.*,
    s.name as studio_name,
    s.type as studio_type
FROM bookings b
LEFT JOIN studios s ON b.studio = s.name
WHERE b.date >= CURRENT_DATE
AND b.status IN ('confirmed', 'pending')
ORDER BY b.date, b.start_time;

-- View for booking statistics
CREATE OR REPLACE VIEW v_booking_stats AS
SELECT
    COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_count,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
    COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_count,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
    COUNT(*) FILTER (WHERE date = CURRENT_DATE AND status IN ('confirmed', 'pending')) as today_count,
    COALESCE(SUM(total_amount) FILTER (WHERE status IN ('confirmed', 'completed')), 0) as total_revenue
FROM bookings;

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to check if a time slot is available
CREATE OR REPLACE FUNCTION is_slot_available(
    p_studio VARCHAR,
    p_date DATE,
    p_start_time TIME,
    p_end_time TIME,
    p_exclude_booking_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_has_conflict BOOLEAN;
    v_is_blocked BOOLEAN;
BEGIN
    -- Check for conflicting bookings
    SELECT EXISTS(
        SELECT 1 FROM bookings
        WHERE studio = p_studio
        AND date = p_date
        AND status IN ('confirmed', 'pending')
        AND start_time < p_end_time
        AND end_time > p_start_time
        AND (p_exclude_booking_id IS NULL OR id != p_exclude_booking_id)
    ) INTO v_has_conflict;
    
    -- Check for blocked slots
    SELECT EXISTS(
        SELECT 1 FROM availability_slots
        WHERE studio = p_studio
        AND date = p_date
        AND is_available = FALSE
        AND start_time < p_end_time
        AND end_time > p_start_time
    ) INTO v_is_blocked;
    
    RETURN NOT v_has_conflict AND NOT v_is_blocked;
END;
$$ LANGUAGE plpgsql;

-- Function to get available studios for a given time slot
CREATE OR REPLACE FUNCTION get_available_studios(
    p_date DATE,
    p_start_time TIME,
    p_end_time TIME
)
RETURNS TABLE (
    studio_id UUID,
    studio_name VARCHAR,
    studio_type VARCHAR,
    capacity INTEGER,
    hourly_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT s.id, s.name, s.type, s.capacity, s.hourly_rate
    FROM studios s
    WHERE s.is_active = TRUE
    AND is_slot_available(s.name, p_date, p_start_time, p_end_time);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CLEANUP JOBS (To be run periodically via Supabase cron)
-- =====================================================

-- Function to cleanup expired OTPs (recommended to run every 5 minutes)
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM login_otps WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to mark past bookings as completed (recommended to run daily)
CREATE OR REPLACE FUNCTION complete_past_bookings()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE bookings
    SET status = 'completed', completed_at = NOW(), updated_at = NOW()
    WHERE status = 'confirmed'
    AND (date < CURRENT_DATE OR (date = CURRENT_DATE AND end_time < CURRENT_TIME));
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant select on public tables to anon
GRANT SELECT ON studios, availability_slots, booking_settings, rate_cards TO anon;
GRANT SELECT ON v_todays_bookings, v_upcoming_bookings, v_booking_stats TO anon;

-- Grant full access to authenticated users (with RLS)
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================
-- END OF SCHEMA
-- =====================================================
