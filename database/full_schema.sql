-- ============================================================================================================
-- RESONANCE STUDIO BOOKING - COMPLETE DATABASE SCHEMA
-- ============================================================================================================
-- 
-- This file contains the complete database schema for the Resonance Studio Booking application.
-- Run this SQL in your Supabase SQL Editor to set up the entire database.
-- 
-- Version: 1.0.0
-- Last Updated: December 2025
-- Database: PostgreSQL (Supabase)
-- 
-- ============================================================================================================
-- TABLE OF CONTENTS
-- ============================================================================================================
-- 1.  EXTENSIONS
-- 2.  ENUMS & CUSTOM TYPES
-- 3.  TABLES
--     3.1  studios              - Studio information and configuration
--     3.2  admin_users          - Admin/staff user accounts
--     3.3  users                - Customer accounts
--     3.4  booking_settings     - Global booking configuration
--     3.5  availability_slots   - Blocked time slots for studios
--     3.6  bookings             - Customer booking records
--     3.7  reminders            - Scheduled booking reminders
--     3.8  login_otps           - OTP codes for phone authentication
--     3.9  trusted_devices      - Verified device fingerprints
--     3.10 rate_cards           - Pricing for session types
--     3.11 audit_logs           - Admin action tracking
--     3.12 contact_submissions  - Contact form entries
-- 4.  INDEXES
-- 5.  ROW LEVEL SECURITY (RLS) POLICIES
-- 6.  FUNCTIONS & TRIGGERS
-- 7.  VIEWS
-- 8.  SEED DATA
-- 9.  MAINTENANCE & CLEANUP
-- ============================================================================================================


-- ============================================================================================================
-- 1. EXTENSIONS
-- ============================================================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      -- UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";       -- Cryptographic functions (for OTP hashing)


-- ============================================================================================================
-- 2. ENUMS & CUSTOM TYPES
-- ============================================================================================================

-- Admin role types
DO $$ BEGIN
    CREATE TYPE admin_role AS ENUM ('admin', 'super_admin', 'staff');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Booking status types
DO $$ BEGIN
    CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed', 'no_show');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Reminder types
DO $$ BEGIN
    CREATE TYPE reminder_type AS ENUM ('confirmation', '24h_reminder', '1h_reminder', 'custom');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Reminder status types
DO $$ BEGIN
    CREATE TYPE reminder_status AS ENUM ('pending', 'sent', 'failed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Contact submission status
DO $$ BEGIN
    CREATE TYPE contact_status AS ENUM ('pending', 'responded', 'closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Session types offered
DO $$ BEGIN
    CREATE TYPE session_type_enum AS ENUM (
        'Karaoke',
        'Live with musicians',
        'Only Drum Practice',
        'Band',
        'Recording'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;


-- ============================================================================================================
-- 3. TABLES
-- ============================================================================================================

-- ============================================================================================================
-- 3.1 STUDIOS TABLE
-- ============================================================================================================
-- Stores information about each studio including capacity, rates, and amenities.
-- Studios are the core entities that can be booked.
-- ============================================================================================================

CREATE TABLE IF NOT EXISTS studios (
    -- Primary Key
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Studio Information
    name                VARCHAR(100) NOT NULL UNIQUE,           -- Display name (e.g., 'Studio A')
    description         TEXT,                                    -- Full description of the studio
    type                VARCHAR(100),                            -- Category: 'Recording Studio', 'Mixing Suite', 'Podcast Room'
    
    -- Capacity & Pricing
    capacity            INTEGER NOT NULL DEFAULT 1,              -- Maximum number of people
    hourly_rate         DECIMAL(10, 2) NOT NULL,                -- Default hourly rate (INR)
    
    -- Status
    is_active           BOOLEAN NOT NULL DEFAULT true,           -- Whether studio is available for booking
    
    -- Additional Features
    amenities           JSONB DEFAULT '[]'::jsonb,              -- Array of amenities: ["WiFi", "AC", "Soundproofing"]
    equipment           JSONB DEFAULT '[]'::jsonb,              -- Available equipment: ["Drums", "Amps", "Microphones"]
    image_url           TEXT,                                    -- Studio photo URL
    
    -- Timestamps
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE studios IS 'Stores all studio information including capacity, rates, and amenities';
COMMENT ON COLUMN studios.name IS 'Unique display name for the studio (e.g., Studio A, Studio B)';
COMMENT ON COLUMN studios.capacity IS 'Maximum number of people allowed in the studio';
COMMENT ON COLUMN studios.amenities IS 'JSON array of available amenities like WiFi, AC, etc.';


-- ============================================================================================================
-- 3.2 ADMIN_USERS TABLE
-- ============================================================================================================
-- Stores admin user information linked to Supabase auth.users.
-- Admins can manage bookings, availability, and settings.
-- ============================================================================================================

CREATE TABLE IF NOT EXISTS admin_users (
    -- Primary Key (linked to Supabase Auth)
    id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Admin Information
    email               VARCHAR(255) NOT NULL UNIQUE,
    name                VARCHAR(255),
    
    -- Role & Permissions
    role                VARCHAR(50) NOT NULL DEFAULT 'admin' 
                        CHECK (role IN ('admin', 'super_admin', 'staff')),
    /*
        Roles:
        - super_admin: Full access including other admin management
        - admin: Can manage bookings, availability, settings
        - staff: View-only access with limited actions
    */
    
    -- Status
    is_active           BOOLEAN NOT NULL DEFAULT true,
    
    -- Tracking
    last_login_at       TIMESTAMP WITH TIME ZONE,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE admin_users IS 'Admin accounts linked to Supabase auth for dashboard access';
COMMENT ON COLUMN admin_users.role IS 'Permission level: super_admin, admin, or staff';


-- ============================================================================================================
-- 3.3 USERS TABLE
-- ============================================================================================================
-- Stores customer user information identified by phone number.
-- Customers are verified via OTP before making bookings.
-- ============================================================================================================

CREATE TABLE IF NOT EXISTS users (
    -- Primary Key
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Contact Information
    phone_number        VARCHAR(15) NOT NULL UNIQUE,             -- Primary identifier (10-digit Indian phone)
    name                VARCHAR(255),                            -- Customer's full name
    email               VARCHAR(255),                            -- Optional email for notifications
    
    -- Verification Status
    is_verified         BOOLEAN NOT NULL DEFAULT false,          -- Whether phone is verified via OTP
    
    -- Statistics
    total_bookings      INTEGER DEFAULT 0,                       -- Lifetime booking count
    
    -- Timestamps
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE users IS 'Customer accounts identified by verified phone numbers';
COMMENT ON COLUMN users.phone_number IS 'Primary identifier - 10 digit Indian phone number';


-- ============================================================================================================
-- 3.4 BOOKING_SETTINGS TABLE
-- ============================================================================================================
-- Stores global configuration for the booking system.
-- Key-value pairs allow flexible settings without schema changes.
-- ============================================================================================================

CREATE TABLE IF NOT EXISTS booking_settings (
    -- Primary Key
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Setting
    key                 VARCHAR(100) NOT NULL UNIQUE,            -- Setting identifier
    value               JSONB NOT NULL,                          -- Setting value (supports various types)
    description         TEXT,                                    -- Human-readable description
    
    -- Timestamps
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE booking_settings IS 'Global booking configuration as key-value pairs';
COMMENT ON COLUMN booking_settings.key IS 'Setting name like min_booking_duration, max_booking_duration';
COMMENT ON COLUMN booking_settings.value IS 'JSON value allowing strings, numbers, arrays, objects';

/*
Available Settings:
- min_booking_duration: Minimum hours per booking (default: 1)
- max_booking_duration: Maximum hours per booking (default: 8)
- booking_buffer: Buffer minutes between bookings (default: 0)
- advance_booking_days: How many days ahead users can book (default: 30)
- default_open_time: Studio opening time (default: "08:00")
- default_close_time: Studio closing time (default: "22:00")
- cancellation_policy: Hours before booking when cancellation is allowed
*/


-- ============================================================================================================
-- 3.5 AVAILABILITY_SLOTS TABLE (BLOCKED SLOTS)
-- ============================================================================================================
-- Stores BLOCKED time slots for studios.
-- By default, all slots within operating hours are available.
-- Admins add entries here to BLOCK specific time ranges.
-- ============================================================================================================

CREATE TABLE IF NOT EXISTS availability_slots (
    -- Primary Key
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Slot Identification
    studio              VARCHAR(100) NOT NULL,                   -- Studio name (matches studios.name)
    date                DATE NOT NULL,                           -- Date of the blocked slot
    start_time          TIME NOT NULL,                           -- Block start time
    end_time            TIME NOT NULL,                           -- Block end time
    
    -- Status
    is_available        BOOLEAN NOT NULL DEFAULT false,          -- false = blocked (entries are blocks)
    block_reason        TEXT,                                    -- Reason for blocking: 'Maintenance', 'Private Event'
    
    -- Tracking
    created_by          UUID REFERENCES auth.users(id),          -- Admin who created the block
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_time_range CHECK (end_time > start_time),
    CONSTRAINT unique_slot UNIQUE (studio, date, start_time, end_time)
);

COMMENT ON TABLE availability_slots IS 'Blocked time slots - entries represent UNAVAILABLE times';
COMMENT ON COLUMN availability_slots.is_available IS 'Always false - entries in this table are blocked slots';
COMMENT ON COLUMN availability_slots.block_reason IS 'Optional reason like Maintenance, Private Event, Holiday';


-- ============================================================================================================
-- 3.6 BOOKINGS TABLE
-- ============================================================================================================
-- Core table storing all customer booking records.
-- Tracks session details, timing, status, and integrations.
-- ============================================================================================================

CREATE TABLE IF NOT EXISTS bookings (
    -- Primary Key
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Customer Reference
    user_id             UUID REFERENCES auth.users(id),          -- Optional link to Supabase auth user
    phone_number        VARCHAR(15) NOT NULL,                    -- Customer phone (also used for SMS)
    name                VARCHAR(255),                            -- Customer name
    email               VARCHAR(255),                            -- Customer email for confirmations
    
    -- Studio & Session
    studio              VARCHAR(100) NOT NULL,                   -- Studio name
    session_type        VARCHAR(100),                            -- Type: 'Karaoke', 'Band', 'Recording', etc.
    session_details     TEXT,                                    -- Detailed info: equipment, participants, etc.
    group_size          INTEGER DEFAULT 1,                       -- Number of participants
    
    -- Timing
    date                DATE NOT NULL,                           -- Booking date
    start_time          TIME NOT NULL,                           -- Session start time
    end_time            TIME NOT NULL,                           -- Session end time
    duration_hours      DECIMAL(4, 2) GENERATED ALWAYS AS 
                        (EXTRACT(EPOCH FROM (end_time - start_time)) / 3600) STORED,
    
    -- Pricing
    rate_per_hour       DECIMAL(10, 2),                          -- Hourly rate at time of booking
    total_amount        DECIMAL(10, 2),                          -- Total booking amount
    
    -- Status
    status              VARCHAR(20) NOT NULL DEFAULT 'pending' 
                        CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
    /*
        Status Flow:
        pending -> confirmed -> completed (normal flow)
        pending -> cancelled (customer cancels)
        confirmed -> cancelled (admin cancels)
        confirmed -> no_show (customer didn't appear)
    */
    
    -- Notes
    notes               TEXT,                                    -- Admin notes
    customer_notes      TEXT,                                    -- Customer special requests
    
    -- Integrations
    google_event_id     VARCHAR(255),                            -- Google Calendar event ID
    sms_sent            BOOLEAN DEFAULT false,                   -- Whether confirmation SMS was sent
    
    -- Cancellation Tracking
    cancelled_at        TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    cancelled_by        VARCHAR(50),                             -- 'customer', 'admin', 'system'
    
    -- Modification Tracking
    is_modified         BOOLEAN DEFAULT false,
    original_booking_id UUID,                                    -- If this is a modification
    modification_count  INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_booking_time_range CHECK (end_time > start_time),
    CONSTRAINT valid_group_size CHECK (group_size >= 1)
);

COMMENT ON TABLE bookings IS 'All customer booking records with session and payment details';
COMMENT ON COLUMN bookings.session_details IS 'JSON-like details about equipment, recording options, etc.';
COMMENT ON COLUMN bookings.duration_hours IS 'Auto-calculated booking duration in hours';


-- ============================================================================================================
-- 3.7 REMINDERS TABLE
-- ============================================================================================================
-- Stores scheduled SMS/notification reminders for bookings.
-- Supports various reminder types at different intervals.
-- ============================================================================================================

CREATE TABLE IF NOT EXISTS reminders (
    -- Primary Key
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Booking Reference
    booking_id          UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    
    -- Reminder Details
    scheduled_at        TIMESTAMP WITH TIME ZONE NOT NULL,       -- When to send the reminder
    type                VARCHAR(50) NOT NULL 
                        CHECK (type IN ('confirmation', '24h_reminder', '1h_reminder', 'custom')),
    message             TEXT,                                    -- Custom message content
    
    -- Status
    status              VARCHAR(20) NOT NULL DEFAULT 'pending' 
                        CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
    
    -- Execution Tracking
    sent_at             TIMESTAMP WITH TIME ZONE,                -- Actual send time
    error_message       TEXT,                                    -- Error details if failed
    retry_count         INTEGER DEFAULT 0,                       -- Number of retry attempts
    
    -- Timestamps
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE reminders IS 'Scheduled SMS/notification reminders for bookings';
COMMENT ON COLUMN reminders.type IS 'confirmation (immediate), 24h_reminder, 1h_reminder, or custom';


-- ============================================================================================================
-- 3.8 LOGIN_OTPS TABLE
-- ============================================================================================================
-- Stores OTP codes for phone number verification.
-- OTPs are hashed for security and have expiration times.
-- ============================================================================================================

CREATE TABLE IF NOT EXISTS login_otps (
    -- Primary Key
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- OTP Details
    phone               VARCHAR(15) NOT NULL,                    -- Phone number requesting OTP
    code_hash           VARCHAR(255) NOT NULL,                   -- bcrypt hashed 6-digit OTP
    
    -- Security
    attempts            INTEGER NOT NULL DEFAULT 0,              -- Failed verification attempts
    max_attempts        INTEGER NOT NULL DEFAULT 3,              -- Max allowed attempts
    
    -- Expiration
    expires_at          TIMESTAMP WITH TIME ZONE NOT NULL,       -- OTP expiration time (5 minutes)
    
    -- Tracking
    ip_address          INET,                                    -- Requester's IP
    user_agent          TEXT,                                    -- Requester's browser/device
    
    -- Timestamps
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_at         TIMESTAMP WITH TIME ZONE                 -- When OTP was successfully verified
);

COMMENT ON TABLE login_otps IS 'OTP codes for phone verification with rate limiting';
COMMENT ON COLUMN login_otps.code_hash IS 'bcrypt hashed OTP - never store plain text';
COMMENT ON COLUMN login_otps.attempts IS 'Track failed attempts for rate limiting';


-- ============================================================================================================
-- 3.9 TRUSTED_DEVICES TABLE
-- ============================================================================================================
-- Stores verified device fingerprints for phone numbers.
-- Users on trusted devices skip OTP verification for faster booking.
-- ============================================================================================================

CREATE TABLE IF NOT EXISTS trusted_devices (
    -- Primary Key
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Device Identification
    phone               VARCHAR(15) NOT NULL,                    -- Associated phone number
    device_fingerprint  VARCHAR(255) NOT NULL,                   -- Unique device identifier hash
    device_name         VARCHAR(255),                            -- e.g., 'Chrome on Windows', 'Safari on iPhone'
    
    -- Status
    is_active           BOOLEAN NOT NULL DEFAULT true,           -- Whether device is still trusted
    
    -- Tracking
    last_used_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),  -- Last activity timestamp
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_device_per_phone UNIQUE (phone, device_fingerprint)
);

COMMENT ON TABLE trusted_devices IS 'Verified devices that can skip OTP verification';
COMMENT ON COLUMN trusted_devices.device_fingerprint IS 'Unique browser/device identifier hash';


-- ============================================================================================================
-- 3.10 RATE_CARDS TABLE
-- ============================================================================================================
-- Stores pricing information for different session types and studios.
-- Supports sub-options for participant counts and equipment choices.
-- ============================================================================================================

CREATE TABLE IF NOT EXISTS rate_cards (
    -- Primary Key
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Rate Card Identification
    studio              VARCHAR(100) NOT NULL,                   -- Studio name
    session_type        VARCHAR(100) NOT NULL,                   -- Session type: 'Karaoke', 'Band', etc.
    sub_option          VARCHAR(100),                            -- Sub-option: 'upto_5', 'drum_amps', 'audio_recording'
    
    -- Pricing
    hourly_rate         DECIMAL(10, 2) NOT NULL,                -- Rate per hour (INR)
    description         TEXT,                                    -- Human-readable description
    
    -- Capacity Limits (for validation)
    min_participants    INTEGER DEFAULT 1,
    max_participants    INTEGER,
    
    -- Status
    is_active           BOOLEAN NOT NULL DEFAULT true,
    
    -- Timestamps
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_rate_card UNIQUE (studio, session_type, sub_option)
);

COMMENT ON TABLE rate_cards IS 'Pricing matrix for studios, session types, and options';
COMMENT ON COLUMN rate_cards.sub_option IS 'Participant range (upto_5) or equipment (drum_amps) or recording type';

/*
Sub-option Examples:
- Karaoke: '1_5', '6_10', '11_20', '21_30' (participant ranges)
- Live with musicians: '1_2', '3_4', '5', '6_8', '9_12'
- Band: 'drum_only', 'drum_amps', 'drum_amps_guitars', 'full'
- Recording: 'audio_recording', 'video_recording', 'chroma_key'
*/


-- ============================================================================================================
-- 3.11 AUDIT_LOGS TABLE
-- ============================================================================================================
-- Tracks all admin actions for accountability and debugging.
-- Stores before/after data for changes.
-- ============================================================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    -- Primary Key
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Actor
    admin_id            UUID REFERENCES admin_users(id),         -- Admin who performed the action
    admin_email         VARCHAR(255),                            -- Cached email for deleted admins
    
    -- Action Details
    action              VARCHAR(100) NOT NULL,                   -- Action type: 'create', 'update', 'delete', 'block', 'login'
    entity_type         VARCHAR(50) NOT NULL,                    -- Entity: 'booking', 'availability_slot', 'setting', 'admin'
    entity_id           UUID,                                    -- ID of affected entity
    
    -- Data Changes
    old_data            JSONB,                                   -- Previous state
    new_data            JSONB,                                   -- New state
    change_summary      TEXT,                                    -- Human-readable change description
    
    -- Request Context
    ip_address          INET,
    user_agent          TEXT,
    
    -- Timestamp
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE audit_logs IS 'Complete audit trail of all admin actions';
COMMENT ON COLUMN audit_logs.action IS 'Action types: create, update, delete, block, unblock, login, logout, etc.';


-- ============================================================================================================
-- 3.12 CONTACT_SUBMISSIONS TABLE
-- ============================================================================================================
-- Stores contact form submissions from the website.
-- Tracks response status for customer support.
-- ============================================================================================================

CREATE TABLE IF NOT EXISTS contact_submissions (
    -- Primary Key
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Contact Information
    first_name          VARCHAR(255) NOT NULL,
    last_name           VARCHAR(255),
    email               VARCHAR(255) NOT NULL,
    phone               VARCHAR(15),
    
    -- Message
    subject             VARCHAR(255),
    message             TEXT NOT NULL,
    
    -- Status
    status              VARCHAR(20) NOT NULL DEFAULT 'pending' 
                        CHECK (status IN ('pending', 'responded', 'closed')),
    
    -- Response Tracking
    responded_at        TIMESTAMP WITH TIME ZONE,
    responded_by        UUID REFERENCES admin_users(id),
    response_notes      TEXT,
    
    -- Timestamps
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE contact_submissions IS 'Customer inquiries from the contact form';


-- ============================================================================================================
-- 4. INDEXES
-- ============================================================================================================

-- Studios Indexes
CREATE INDEX IF NOT EXISTS idx_studios_active ON studios(is_active);
CREATE INDEX IF NOT EXISTS idx_studios_type ON studios(type);

-- Admin Users Indexes
CREATE INDEX IF NOT EXISTS idx_admin_users_active ON admin_users(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);

-- Users Indexes
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Availability Slots Indexes
CREATE INDEX IF NOT EXISTS idx_availability_studio_date ON availability_slots(studio, date);
CREATE INDEX IF NOT EXISTS idx_availability_date ON availability_slots(date);
CREATE INDEX IF NOT EXISTS idx_availability_is_available ON availability_slots(is_available);
CREATE INDEX IF NOT EXISTS idx_availability_created_by ON availability_slots(created_by);

-- Bookings Indexes (Critical for performance)
CREATE INDEX IF NOT EXISTS idx_bookings_phone ON bookings(phone_number);
CREATE INDEX IF NOT EXISTS idx_bookings_studio_date ON bookings(studio, date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at);
CREATE INDEX IF NOT EXISTS idx_bookings_upcoming ON bookings(date, start_time) WHERE status IN ('pending', 'confirmed');

-- Reminders Indexes
CREATE INDEX IF NOT EXISTS idx_reminders_booking ON reminders(booking_id);
CREATE INDEX IF NOT EXISTS idx_reminders_scheduled ON reminders(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_reminders_status ON reminders(status);
CREATE INDEX IF NOT EXISTS idx_reminders_pending ON reminders(scheduled_at) WHERE status = 'pending';

-- Login OTPs Indexes
CREATE INDEX IF NOT EXISTS idx_login_otps_phone ON login_otps(phone);
CREATE INDEX IF NOT EXISTS idx_login_otps_expires ON login_otps(expires_at);

-- Trusted Devices Indexes
CREATE INDEX IF NOT EXISTS idx_trusted_devices_phone ON trusted_devices(phone);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_fingerprint ON trusted_devices(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_active ON trusted_devices(is_active);

-- Rate Cards Indexes
CREATE INDEX IF NOT EXISTS idx_rate_cards_studio ON rate_cards(studio);
CREATE INDEX IF NOT EXISTS idx_rate_cards_session_type ON rate_cards(session_type);
CREATE INDEX IF NOT EXISTS idx_rate_cards_active ON rate_cards(is_active);

-- Audit Logs Indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- Contact Submissions Indexes
CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON contact_submissions(status);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at ON contact_submissions(created_at);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_email ON contact_submissions(email);


-- ============================================================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================================================

-- Enable RLS on all tables
ALTER TABLE studios ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE trusted_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------
-- STUDIOS POLICIES
-- ----------------------------------------
DROP POLICY IF EXISTS "Anyone can view active studios" ON studios;
CREATE POLICY "Anyone can view active studios" ON studios
    FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage studios" ON studios;
CREATE POLICY "Admins can manage studios" ON studios
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid() 
            AND admin_users.is_active = true
        )
    );

-- ----------------------------------------
-- ADMIN_USERS POLICIES
-- ----------------------------------------
DROP POLICY IF EXISTS "Admins can view admin users" ON admin_users;
CREATE POLICY "Admins can view admin users" ON admin_users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users au
            WHERE au.id = auth.uid() 
            AND au.is_active = true
        )
    );

DROP POLICY IF EXISTS "Super admins can manage admin users" ON admin_users;
CREATE POLICY "Super admins can manage admin users" ON admin_users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users au
            WHERE au.id = auth.uid() 
            AND au.is_active = true
            AND au.role = 'super_admin'
        )
    );

-- ----------------------------------------
-- USERS POLICIES
-- ----------------------------------------
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all users" ON users;
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid() 
            AND admin_users.is_active = true
        )
    );

DROP POLICY IF EXISTS "System can create users" ON users;
CREATE POLICY "System can create users" ON users
    FOR INSERT WITH CHECK (true);

-- ----------------------------------------
-- BOOKING_SETTINGS POLICIES
-- ----------------------------------------
DROP POLICY IF EXISTS "Anyone can view booking settings" ON booking_settings;
CREATE POLICY "Anyone can view booking settings" ON booking_settings
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage booking settings" ON booking_settings;
CREATE POLICY "Admins can manage booking settings" ON booking_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid() 
            AND admin_users.is_active = true
        )
    );

-- ----------------------------------------
-- AVAILABILITY_SLOTS POLICIES
-- ----------------------------------------
DROP POLICY IF EXISTS "Anyone can view availability slots" ON availability_slots;
CREATE POLICY "Anyone can view availability slots" ON availability_slots
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage availability" ON availability_slots;
CREATE POLICY "Admins can manage availability" ON availability_slots
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid() 
            AND admin_users.is_active = true
        )
    );

-- ----------------------------------------
-- BOOKINGS POLICIES
-- ----------------------------------------
DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;
CREATE POLICY "Users can view own bookings" ON bookings
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid() 
            AND admin_users.is_active = true
        )
    );

DROP POLICY IF EXISTS "Anyone can create bookings" ON bookings;
CREATE POLICY "Anyone can create bookings" ON bookings
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own bookings" ON bookings;
CREATE POLICY "Users can update own bookings" ON bookings
    FOR UPDATE USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid() 
            AND admin_users.is_active = true
        )
    );

DROP POLICY IF EXISTS "Admins can delete bookings" ON bookings;
CREATE POLICY "Admins can delete bookings" ON bookings
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid() 
            AND admin_users.is_active = true
        )
    );

-- ----------------------------------------
-- REMINDERS POLICIES
-- ----------------------------------------
DROP POLICY IF EXISTS "System can manage reminders" ON reminders;
CREATE POLICY "System can manage reminders" ON reminders
    FOR ALL USING (true);

-- ----------------------------------------
-- LOGIN_OTPS POLICIES
-- ----------------------------------------
DROP POLICY IF EXISTS "System can manage OTPs" ON login_otps;
CREATE POLICY "System can manage OTPs" ON login_otps
    FOR ALL USING (true);

-- ----------------------------------------
-- TRUSTED_DEVICES POLICIES
-- ----------------------------------------
DROP POLICY IF EXISTS "System can manage trusted devices" ON trusted_devices;
CREATE POLICY "System can manage trusted devices" ON trusted_devices
    FOR ALL USING (true);

DROP POLICY IF EXISTS "Users can view own trusted devices" ON trusted_devices;
CREATE POLICY "Users can view own trusted devices" ON trusted_devices
    FOR SELECT USING (true);

-- ----------------------------------------
-- RATE_CARDS POLICIES
-- ----------------------------------------
DROP POLICY IF EXISTS "Anyone can view active rate cards" ON rate_cards;
CREATE POLICY "Anyone can view active rate cards" ON rate_cards
    FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage rate cards" ON rate_cards;
CREATE POLICY "Admins can manage rate cards" ON rate_cards
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid() 
            AND admin_users.is_active = true
        )
    );

-- ----------------------------------------
-- AUDIT_LOGS POLICIES
-- ----------------------------------------
DROP POLICY IF EXISTS "Super admins can view audit logs" ON audit_logs;
CREATE POLICY "Super admins can view audit logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid() 
            AND admin_users.is_active = true
            AND admin_users.role = 'super_admin'
        )
    );

DROP POLICY IF EXISTS "System can create audit logs" ON audit_logs;
CREATE POLICY "System can create audit logs" ON audit_logs
    FOR INSERT WITH CHECK (true);

-- ----------------------------------------
-- CONTACT_SUBMISSIONS POLICIES
-- ----------------------------------------
DROP POLICY IF EXISTS "Anyone can create contact submissions" ON contact_submissions;
CREATE POLICY "Anyone can create contact submissions" ON contact_submissions
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view and manage contact submissions" ON contact_submissions;
CREATE POLICY "Admins can view and manage contact submissions" ON contact_submissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid() 
            AND admin_users.is_active = true
        )
    );


-- ============================================================================================================
-- 6. FUNCTIONS & TRIGGERS
-- ============================================================================================================

-- ----------------------------------------
-- Updated At Trigger Function
-- ----------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
DROP TRIGGER IF EXISTS update_studios_updated_at ON studios;
CREATE TRIGGER update_studios_updated_at
    BEFORE UPDATE ON studios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;
CREATE TRIGGER update_admin_users_updated_at
    BEFORE UPDATE ON admin_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_booking_settings_updated_at ON booking_settings;
CREATE TRIGGER update_booking_settings_updated_at
    BEFORE UPDATE ON booking_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_availability_slots_updated_at ON availability_slots;
CREATE TRIGGER update_availability_slots_updated_at
    BEFORE UPDATE ON availability_slots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rate_cards_updated_at ON rate_cards;
CREATE TRIGGER update_rate_cards_updated_at
    BEFORE UPDATE ON rate_cards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------
-- Trusted Device Functions
-- ----------------------------------------
CREATE OR REPLACE FUNCTION update_device_last_used()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_used_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_trusted_devices_last_used ON trusted_devices;
CREATE TRIGGER update_trusted_devices_last_used
    BEFORE UPDATE ON trusted_devices
    FOR EACH ROW EXECUTE FUNCTION update_device_last_used();

-- Check if device is trusted for a phone number
CREATE OR REPLACE FUNCTION is_device_trusted(
    p_phone VARCHAR,
    p_device_fingerprint VARCHAR
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM trusted_devices
        WHERE phone = p_phone
        AND device_fingerprint = p_device_fingerprint
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add or update a trusted device
CREATE OR REPLACE FUNCTION add_trusted_device(
    p_phone VARCHAR,
    p_device_fingerprint VARCHAR,
    p_device_name VARCHAR DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    device_id UUID;
BEGIN
    INSERT INTO trusted_devices (phone, device_fingerprint, device_name)
    VALUES (p_phone, p_device_fingerprint, p_device_name)
    ON CONFLICT (phone, device_fingerprint) 
    DO UPDATE SET 
        last_used_at = NOW(),
        is_active = true,
        device_name = COALESCE(EXCLUDED.device_name, trusted_devices.device_name)
    RETURNING id INTO device_id;
    
    RETURN device_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Revoke a specific trusted device
CREATE OR REPLACE FUNCTION revoke_trusted_device(
    p_phone VARCHAR,
    p_device_fingerprint VARCHAR
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE trusted_devices
    SET is_active = false
    WHERE phone = p_phone
    AND device_fingerprint = p_device_fingerprint;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Revoke all trusted devices for a phone number
CREATE OR REPLACE FUNCTION revoke_all_trusted_devices(
    p_phone VARCHAR
)
RETURNS INTEGER AS $$
DECLARE
    affected_count INTEGER;
BEGIN
    UPDATE trusted_devices
    SET is_active = false
    WHERE phone = p_phone
    AND is_active = true;
    
    GET DIAGNOSTICS affected_count = ROW_COUNT;
    RETURN affected_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------
-- Admin Helper Functions
-- ----------------------------------------
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

CREATE OR REPLACE FUNCTION is_super_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_users 
        WHERE id = user_id 
        AND is_active = true
        AND role = 'super_admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------
-- Availability Check Function
-- ----------------------------------------
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

-- ----------------------------------------
-- Cleanup Functions
-- ----------------------------------------
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM login_otps WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION cleanup_old_devices()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM trusted_devices
    WHERE is_active = false
    AND last_used_at < NOW() - INTERVAL '90 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-complete old bookings
CREATE OR REPLACE FUNCTION auto_complete_past_bookings()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE bookings
    SET status = 'completed', updated_at = NOW()
    WHERE status = 'confirmed'
    AND (date < CURRENT_DATE OR (date = CURRENT_DATE AND end_time < CURRENT_TIME));
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------
-- Statistics Functions
-- ----------------------------------------
CREATE OR REPLACE FUNCTION get_booking_stats(
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    total_bookings BIGINT,
    confirmed_bookings BIGINT,
    pending_bookings BIGINT,
    cancelled_bookings BIGINT,
    completed_bookings BIGINT,
    no_show_bookings BIGINT,
    total_revenue DECIMAL,
    average_booking_value DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT,
        COUNT(*) FILTER (WHERE status = 'confirmed')::BIGINT,
        COUNT(*) FILTER (WHERE status = 'pending')::BIGINT,
        COUNT(*) FILTER (WHERE status = 'cancelled')::BIGINT,
        COUNT(*) FILTER (WHERE status = 'completed')::BIGINT,
        COUNT(*) FILTER (WHERE status = 'no_show')::BIGINT,
        COALESCE(SUM(total_amount) FILTER (WHERE status IN ('confirmed', 'completed')), 0)::DECIMAL,
        COALESCE(AVG(total_amount) FILTER (WHERE status IN ('confirmed', 'completed')), 0)::DECIMAL
    FROM bookings
    WHERE date BETWEEN p_start_date AND p_end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================================================
-- 7. VIEWS
-- ============================================================================================================

-- View for upcoming bookings with studio details
CREATE OR REPLACE VIEW upcoming_bookings AS
SELECT 
    b.id,
    b.phone_number,
    b.name,
    b.email,
    b.studio,
    b.session_type,
    b.session_details,
    b.group_size,
    b.date,
    b.start_time,
    b.end_time,
    b.status,
    b.total_amount,
    b.notes,
    b.google_event_id,
    b.created_at,
    s.name as studio_name,
    s.capacity as studio_capacity,
    s.type as studio_type
FROM bookings b
LEFT JOIN studios s ON s.name = b.studio
WHERE b.date >= CURRENT_DATE
AND b.status IN ('pending', 'confirmed')
ORDER BY b.date, b.start_time;

-- View for today's bookings
CREATE OR REPLACE VIEW todays_bookings AS
SELECT 
    b.*,
    s.capacity as studio_capacity
FROM bookings b
LEFT JOIN studios s ON s.name = b.studio
WHERE b.date = CURRENT_DATE
AND b.status IN ('pending', 'confirmed')
ORDER BY b.start_time;

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

-- View for active trusted devices
CREATE OR REPLACE VIEW active_trusted_devices AS
SELECT 
    id,
    phone,
    device_fingerprint,
    device_name,
    last_used_at,
    created_at
FROM trusted_devices
WHERE is_active = true
ORDER BY last_used_at DESC;

-- View for pending reminders
CREATE OR REPLACE VIEW pending_reminders AS
SELECT 
    r.*,
    b.phone_number,
    b.name,
    b.studio,
    b.date,
    b.start_time
FROM reminders r
JOIN bookings b ON b.id = r.booking_id
WHERE r.status = 'pending'
AND r.scheduled_at <= NOW() + INTERVAL '1 hour'
ORDER BY r.scheduled_at;


-- ============================================================================================================
-- 8. SEED DATA
-- ============================================================================================================

-- Default Studios
INSERT INTO studios (name, type, hourly_rate, capacity, is_active, description, amenities) VALUES
    ('Studio A', 'Recording Studio', 500, 30, true, 'Our largest studio with full recording capabilities, ideal for large groups and professional recordings.', '["AC", "Soundproofing", "Professional Microphones", "Mixing Console", "Video Recording"]'::jsonb),
    ('Studio B', 'Mixing Suite', 400, 12, true, 'Medium-sized studio perfect for small bands and live sessions with musicians.', '["AC", "Soundproofing", "Amplifiers", "Basic Recording"]'::jsonb),
    ('Studio C', 'Podcast Room', 250, 5, true, 'Intimate studio for small groups, karaoke sessions, and podcast recordings.', '["AC", "Soundproofing", "Podcast Setup"]'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Default Booking Settings
INSERT INTO booking_settings (key, value, description) VALUES
    ('min_booking_duration', '1', 'Minimum booking duration in hours'),
    ('max_booking_duration', '8', 'Maximum booking duration in hours'),
    ('booking_buffer', '0', 'Buffer time between bookings in minutes'),
    ('advance_booking_days', '30', 'How many days in advance users can book'),
    ('default_open_time', '"08:00"', 'Default studio opening time'),
    ('default_close_time', '"22:00"', 'Default studio closing time'),
    ('otp_expiry_minutes', '5', 'OTP expiration time in minutes'),
    ('max_otp_attempts', '3', 'Maximum OTP verification attempts'),
    ('cancellation_hours', '24', 'Hours before booking when cancellation is allowed')
ON CONFLICT (key) DO NOTHING;

-- Default Rate Cards
INSERT INTO rate_cards (studio, session_type, sub_option, hourly_rate, min_participants, max_participants) VALUES
    -- Studio A - Karaoke
    ('Studio A', 'Karaoke', '1_5', 400, 1, 5),
    ('Studio A', 'Karaoke', '6_10', 400, 6, 10),
    ('Studio A', 'Karaoke', '11_20', 400, 11, 20),
    ('Studio A', 'Karaoke', '21_30', 500, 21, 30),
    -- Studio A - Live with musicians
    ('Studio A', 'Live with musicians', '1_2', 600, 1, 2),
    ('Studio A', 'Live with musicians', '3_4', 600, 3, 4),
    ('Studio A', 'Live with musicians', '5', 600, 5, 5),
    ('Studio A', 'Live with musicians', '6_8', 600, 6, 8),
    ('Studio A', 'Live with musicians', '9_12', 800, 9, 12),
    -- Studio A - Other sessions
    ('Studio A', 'Only Drum Practice', NULL, 350, 1, 2),
    ('Studio A', 'Band', 'drum_only', 400, 1, 10),
    ('Studio A', 'Band', 'drum_amps', 500, 1, 10),
    ('Studio A', 'Band', 'drum_amps_guitars', 600, 1, 10),
    ('Studio A', 'Band', 'full', 600, 1, 10),
    ('Studio A', 'Recording', 'audio_recording', 700, 1, 10),
    ('Studio A', 'Recording', 'video_recording', 800, 1, 10),
    ('Studio A', 'Recording', 'chroma_key', 1200, 1, 10),
    -- Studio B
    ('Studio B', 'Karaoke', '1_5', 300, 1, 5),
    ('Studio B', 'Karaoke', '6_10', 300, 6, 10),
    ('Studio B', 'Live with musicians', '1_2', 400, 1, 2),
    ('Studio B', 'Live with musicians', '3_4', 400, 3, 4),
    ('Studio B', 'Live with musicians', '5', 500, 5, 5),
    ('Studio B', 'Band', 'drum_only', 350, 1, 8),
    ('Studio B', 'Band', 'drum_amps', 400, 1, 8),
    ('Studio B', 'Band', 'drum_amps_guitars', 450, 1, 8),
    -- Studio C
    ('Studio C', 'Karaoke', '1_5', 250, 1, 5),
    ('Studio C', 'Live with musicians', '1_2', 350, 1, 2),
    ('Studio C', 'Band', 'drum_only', 300, 1, 5),
    ('Studio C', 'Band', 'drum_amps', 350, 1, 5)
ON CONFLICT (studio, session_type, sub_option) DO NOTHING;


-- ============================================================================================================
-- 9. MAINTENANCE & CLEANUP
-- ============================================================================================================

/*
-- ============================================================================================================
-- SCHEDULED MAINTENANCE QUERIES (Run periodically via Supabase Edge Functions or cron)
-- ============================================================================================================

-- Clean up expired OTPs (run every hour)
SELECT cleanup_expired_otps();

-- Clean up old inactive devices (run daily)
SELECT cleanup_old_devices();

-- Auto-complete past bookings (run daily)
SELECT auto_complete_past_bookings();

-- Archive old audit logs (run monthly) - Move to archive table
-- INSERT INTO audit_logs_archive SELECT * FROM audit_logs WHERE created_at < NOW() - INTERVAL '1 year';
-- DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '1 year';


-- ============================================================================================================
-- CREATE ADMIN USER (Run after creating user via Supabase Auth)
-- ============================================================================================================

-- INSERT INTO admin_users (id, email, name, role) VALUES 
--     ('your-auth-user-uuid', 'admin@resonance.studio', 'Admin User', 'super_admin');


-- ============================================================================================================
-- DESTRUCTIVE CLEANUP (USE WITH EXTREME CAUTION!)
-- ============================================================================================================

-- Drop all tables and start fresh:
/*
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS reminders CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS availability_slots CASCADE;
DROP TABLE IF EXISTS rate_cards CASCADE;
DROP TABLE IF EXISTS booking_settings CASCADE;
DROP TABLE IF EXISTS login_otps CASCADE;
DROP TABLE IF EXISTS trusted_devices CASCADE;
DROP TABLE IF EXISTS contact_submissions CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS studios CASCADE;

DROP VIEW IF EXISTS upcoming_bookings CASCADE;
DROP VIEW IF EXISTS todays_bookings CASCADE;
DROP VIEW IF EXISTS daily_availability_summary CASCADE;
DROP VIEW IF EXISTS booking_stats CASCADE;
DROP VIEW IF EXISTS active_trusted_devices CASCADE;
DROP VIEW IF EXISTS pending_reminders CASCADE;

DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
DROP FUNCTION IF EXISTS update_device_last_used CASCADE;
DROP FUNCTION IF EXISTS is_device_trusted CASCADE;
DROP FUNCTION IF EXISTS add_trusted_device CASCADE;
DROP FUNCTION IF EXISTS revoke_trusted_device CASCADE;
DROP FUNCTION IF EXISTS revoke_all_trusted_devices CASCADE;
DROP FUNCTION IF EXISTS is_admin CASCADE;
DROP FUNCTION IF EXISTS is_super_admin CASCADE;
DROP FUNCTION IF EXISTS check_slot_availability CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_otps CASCADE;
DROP FUNCTION IF EXISTS cleanup_old_devices CASCADE;
DROP FUNCTION IF EXISTS auto_complete_past_bookings CASCADE;
DROP FUNCTION IF EXISTS get_booking_stats CASCADE;

DROP TYPE IF EXISTS admin_role CASCADE;
DROP TYPE IF EXISTS booking_status CASCADE;
DROP TYPE IF EXISTS reminder_type CASCADE;
DROP TYPE IF EXISTS reminder_status CASCADE;
DROP TYPE IF EXISTS contact_status CASCADE;
DROP TYPE IF EXISTS session_type_enum CASCADE;
*/

*/


-- ============================================================================================================
-- END OF SCHEMA
-- ============================================================================================================
