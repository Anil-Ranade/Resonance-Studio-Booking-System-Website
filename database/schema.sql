-- Resonance Studio Database Schema
-- Run this SQL in your Supabase SQL Editor

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
    capacity INTEGER NOT NULL DEFAULT 1,
    hourly_rate DECIMAL(10, 2) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    amenities JSONB DEFAULT '[]'::jsonb,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default studios
INSERT INTO studios (name, description, capacity, hourly_rate, is_active) VALUES
    ('Studio A', 'Premium recording studio with top-tier equipment', 15, 4000.00, true),
    ('Studio B', 'Mid-size studio perfect for bands', 6, 2500.00, true),
    ('Studio C', 'Intimate podcast and voice-over room', 3, 1500.00, true)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- USERS TABLE
-- Stores customer information (identified by WhatsApp number)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    whatsapp_number VARCHAR(15) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_whatsapp ON users(whatsapp_number);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================
-- AVAILABILITY_SLOTS TABLE
-- Stores available time slots for each studio
-- ============================================
CREATE TABLE IF NOT EXISTS availability_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    studio VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT true,
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
    whatsapp_number VARCHAR(15) NOT NULL,
    name VARCHAR(255),
    studio VARCHAR(100) NOT NULL,
    session_type VARCHAR(100),
    group_size INTEGER DEFAULT 1,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
    total_amount DECIMAL(10, 2),
    notes TEXT,
    google_event_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    
    -- Ensure end_time is after start_time
    CONSTRAINT valid_booking_time_range CHECK (end_time > start_time)
);

-- Indexes for faster booking queries
CREATE INDEX IF NOT EXISTS idx_bookings_whatsapp ON bookings(whatsapp_number);
CREATE INDEX IF NOT EXISTS idx_bookings_studio_date ON bookings(studio, date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);

-- ============================================
-- REMINDERS TABLE
-- Stores scheduled reminders for bookings
-- ============================================
CREATE TABLE IF NOT EXISTS reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('confirmation', '24h_reminder', '1h_reminder', 'follow_up')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for processing pending reminders
CREATE INDEX IF NOT EXISTS idx_reminders_status_scheduled ON reminders(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_reminders_booking_id ON reminders(booking_id);

-- ============================================
-- CONTACTS TABLE
-- Stores contact form submissions
-- ============================================
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    subject VARCHAR(255),
    message TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
    replied_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);

-- ============================================
-- RATE_CARDS TABLE
-- Stores pricing information per studio and session type
-- ============================================
CREATE TABLE IF NOT EXISTS rate_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    studio VARCHAR(100) NOT NULL,
    session_type VARCHAR(100) NOT NULL,
    hourly_rate DECIMAL(10, 2) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_rate_card UNIQUE (studio, session_type)
);

-- Insert default rate cards
INSERT INTO rate_cards (studio, session_type, hourly_rate) VALUES
    ('Studio C', 'Recording', 1500.00),
    ('Studio C', 'Mixing', 1200.00),
    ('Studio C', 'Podcast', 1000.00),
    ('Studio C', 'Voice Over', 800.00),
    ('Studio B', 'Recording', 2500.00),
    ('Studio B', 'Mixing', 2000.00),
    ('Studio B', 'Podcast', 1500.00),
    ('Studio B', 'Voice Over', 1200.00),
    ('Studio A', 'Recording', 4000.00),
    ('Studio A', 'Mixing', 3500.00),
    ('Studio A', 'Podcast', 2500.00),
    ('Studio A', 'Voice Over', 2000.00)
ON CONFLICT (studio, session_type) DO NOTHING;

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

-- ============================================
-- AUDIT_LOG TABLE
-- Tracks all admin actions for accountability
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES admin_users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_admin ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE studios ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Studios: Everyone can read active studios
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

-- Users: Anyone can create (for booking), admins can view all
CREATE POLICY "Anyone can create users" ON users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view users" ON users
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage users" ON users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid() 
            AND admin_users.is_active = true
        )
    );

-- Availability Slots: Everyone can read available slots
CREATE POLICY "Anyone can view available slots" ON availability_slots
    FOR SELECT USING (is_available = true);

CREATE POLICY "Admins can manage availability" ON availability_slots
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid() 
            AND admin_users.is_active = true
        )
    );

-- Bookings: Users can view their own bookings, admins can view all
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

-- Reminders: Only admins can manage
CREATE POLICY "Service role can manage reminders" ON reminders
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid() 
            AND admin_users.is_active = true
        )
    );

-- Contacts: Anyone can create, only admins can read
CREATE POLICY "Anyone can submit contact" ON contacts
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage contacts" ON contacts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid() 
            AND admin_users.is_active = true
        )
    );

-- Rate Cards: Anyone can read, only admins can modify
CREATE POLICY "Anyone can view rate cards" ON rate_cards
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage rate cards" ON rate_cards
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid() 
            AND admin_users.is_active = true
        )
    );

-- Admin Users: Only admins can view/manage
CREATE POLICY "Admins can view admin users" ON admin_users
    FOR SELECT USING (
        id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM admin_users au
            WHERE au.id = auth.uid() 
            AND au.is_active = true
            AND au.role = 'super_admin'
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

-- Audit Logs: Only super admins can view
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
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers to relevant tables
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
    has_availability BOOLEAN;
    has_conflict BOOLEAN;
BEGIN
    -- Check if there's an availability slot covering this time
    SELECT EXISTS (
        SELECT 1 FROM availability_slots
        WHERE studio = p_studio
        AND date = p_date
        AND start_time <= p_start_time
        AND end_time >= p_end_time
        AND is_available = true
    ) INTO has_availability;
    
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
    
    RETURN has_availability AND NOT has_conflict;
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
    COUNT(*) as total_slots,
    SUM(CASE WHEN a.is_available THEN 1 ELSE 0 END) as available_slots,
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

-- ============================================
-- SAMPLE DATA (for testing - remove in production)
-- ============================================

-- To create a test admin, first create the user via Supabase Auth,
-- then run this with the user's UUID:
-- INSERT INTO admin_users (id, email, name, role) VALUES 
--     ('your-auth-user-uuid', 'admin@resonance.studio', 'Admin User', 'super_admin');

-- Sample availability slots (for next 7 days)
-- You can run this to populate initial availability:
/*
DO $$
DECLARE
    d DATE;
    studio TEXT;
BEGIN
    FOR d IN SELECT generate_series(CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', INTERVAL '1 day')::DATE LOOP
        FOREACH studio IN ARRAY ARRAY['Studio A', 'Studio B', 'Studio C'] LOOP
            INSERT INTO availability_slots (studio, date, start_time, end_time, is_available)
            VALUES (studio, d, '08:00', '22:00', true)
            ON CONFLICT (studio, date, start_time, end_time) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;
*/
