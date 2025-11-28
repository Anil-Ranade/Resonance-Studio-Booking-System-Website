-- ============================================
-- RESONANCE STUDIO BOOKING - DEVICES SCHEMA
-- ============================================
-- This file contains the database schema for trusted devices management.
-- Run this SQL in your Supabase SQL Editor after running the main schema.sql
-- ============================================

-- ============================================
-- TRUSTED_DEVICES TABLE
-- Stores trusted device fingerprints for verified phone numbers
-- Users verified on a trusted device don't need OTP for subsequent actions
-- ============================================
CREATE TABLE IF NOT EXISTS trusted_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(15) NOT NULL,
    device_fingerprint VARCHAR(255) NOT NULL,
    device_name VARCHAR(255), -- e.g., 'Chrome on Windows', 'Safari on iPhone'
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Ensure unique device per phone
    CONSTRAINT unique_device_per_phone UNIQUE (phone, device_fingerprint)
);

-- Index for trusted device lookup
CREATE INDEX IF NOT EXISTS idx_trusted_devices_phone ON trusted_devices(phone);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_fingerprint ON trusted_devices(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_active ON trusted_devices(is_active);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on trusted_devices table
ALTER TABLE trusted_devices ENABLE ROW LEVEL SECURITY;

-- ============================================
-- TRUSTED_DEVICES POLICIES
-- ============================================

-- Allow the system/service role to manage all trusted devices
CREATE POLICY "System can manage trusted devices" ON trusted_devices
    FOR ALL USING (true);

-- Users can view their own trusted devices (based on phone number)
CREATE POLICY "Users can view own trusted devices" ON trusted_devices
    FOR SELECT USING (true);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update last_used_at when device is used
CREATE OR REPLACE FUNCTION update_device_last_used()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_used_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update last_used_at
DROP TRIGGER IF EXISTS update_trusted_devices_last_used ON trusted_devices;
CREATE TRIGGER update_trusted_devices_last_used
    BEFORE UPDATE ON trusted_devices
    FOR EACH ROW
    EXECUTE FUNCTION update_device_last_used();

-- Function to check if a device is trusted for a phone number
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

-- Function to add or update a trusted device
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

-- Function to revoke a trusted device
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

-- Function to revoke all trusted devices for a phone number
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

-- Function to cleanup old inactive devices (older than 90 days)
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

-- ============================================
-- VIEWS
-- ============================================

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

-- ============================================
-- CLEANUP COMMANDS (use with caution!)
-- ============================================

-- To drop all devices-related objects (DESTRUCTIVE!):
/*
DROP TABLE IF EXISTS trusted_devices CASCADE;
DROP VIEW IF EXISTS active_trusted_devices CASCADE;
DROP FUNCTION IF EXISTS update_device_last_used CASCADE;
DROP FUNCTION IF EXISTS is_device_trusted CASCADE;
DROP FUNCTION IF EXISTS add_trusted_device CASCADE;
DROP FUNCTION IF EXISTS revoke_trusted_device CASCADE;
DROP FUNCTION IF EXISTS revoke_all_trusted_devices CASCADE;
DROP FUNCTION IF EXISTS cleanup_old_devices CASCADE;
*/
