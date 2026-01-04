-- =====================================================
-- RATE LIMITING IMPLEMENTATION
-- =====================================================
-- Run this in your Supabase SQL Editor to set up rate limiting.

-- 1. Create the rate_limits table
CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address VARCHAR(45) NOT NULL,
    endpoint VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups and cleanup
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_endpoint ON rate_limits(ip_address, endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limits_created_at ON rate_limits(created_at);

-- 2. Enable RLS (though only service role will access this usually, good practice)
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Allow read/write access to service role only (API routes will use service role or RPC)
CREATE POLICY "Service role can manage rate limits" 
ON rate_limits 
USING (auth.role() = 'service_role');

-- 3. Stored Procedure to check and record rate limit
-- Returns TRUE if request is allowed, FALSE if limited.
CREATE OR REPLACE FUNCTION check_rate_limit(
    p_ip_address VARCHAR,
    p_endpoint VARCHAR,
    p_limit INTEGER,
    p_window_seconds INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    v_count INTEGER;
BEGIN
    -- 1. Cleanup old records for this IP/Endpoint to keep table small
    -- (Optimization: In high volume systems, move this to a scheduled cron job)
    DELETE FROM rate_limits 
    WHERE created_at < (NOW() - (p_window_seconds || ' seconds')::INTERVAL);

    -- 2. Count requests in the window
    SELECT COUNT(*) INTO v_count
    FROM rate_limits
    WHERE ip_address = p_ip_address 
      AND endpoint = p_endpoint
      AND created_at > (NOW() - (p_window_seconds || ' seconds')::INTERVAL);

    -- 3. Check limit
    IF v_count >= p_limit THEN
        RETURN FALSE;
    END IF;

    -- 4. Record new request
    INSERT INTO rate_limits (ip_address, endpoint)
    VALUES (p_ip_address, p_endpoint);

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- SECURITY DEFINER allows the function to run with privileges of the creator (usually postgres/admin),
-- bypassing RLS on the table if needed, which is useful here since anonymous users call this via API.

-- Grant execute to anon and authenticated roles so the API can call it
GRANT EXECUTE ON FUNCTION check_rate_limit TO anon;
GRANT EXECUTE ON FUNCTION check_rate_limit TO authenticated;
GRANT EXECUTE ON FUNCTION check_rate_limit TO service_role;
