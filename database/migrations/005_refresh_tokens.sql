-- Migration: Add Refresh Tokens Table
-- This table stores refresh token hashes for token revocation and rotation support

-- =====================================================
-- TABLE: refresh_tokens
-- =====================================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_phone VARCHAR(15) NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    device_fingerprint VARCHAR(255),
    device_name VARCHAR(255) DEFAULT 'Unknown Device',
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMPTZ,
    
    -- Unique constraint on token hash for fast lookup
    CONSTRAINT uq_refresh_token_hash UNIQUE (token_hash)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_phone ON refresh_tokens(user_phone);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON refresh_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_device ON refresh_tokens(device_fingerprint);

-- Enable Row Level Security
ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only service role can manage refresh tokens
DROP POLICY IF EXISTS "Refresh tokens managed by service role" ON refresh_tokens;
CREATE POLICY "Refresh tokens managed by service role" ON refresh_tokens
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Add comment
COMMENT ON TABLE refresh_tokens IS 'Stores refresh token hashes for secure token-based authentication with revocation support';
