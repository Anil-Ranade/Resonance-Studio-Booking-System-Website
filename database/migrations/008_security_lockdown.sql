-- =====================================================
-- 008: Security lockdown
-- =====================================================
-- Run in the Supabase SQL editor.
--
-- The browser only uses Supabase for admin/staff sign-in; every table and
-- function is reached through Next.js API routes with the service role key.
-- The public anon key ships to every visitor, so anything granted to anon
-- (or to PUBLIC, the Postgres default for functions) is world-readable/callable.

-- 1. Views exposed customer names, phones and emails to the anon key
REVOKE SELECT ON v_todays_bookings, v_upcoming_bookings, v_booking_stats FROM anon, authenticated;

-- 2. Functions default to EXECUTE for PUBLIC: lock them to the service role
--    (create_booking_atomic, claim_loyalty_reward, check_rate_limit, ...)
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO service_role;

-- 3. Any Supabase-authenticated account (staff, investors, or anyone who can
--    sign up) had ALL on every table. Admin pages go through the API instead.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM authenticated;

-- 4. Read-everything policies (service role bypasses RLS, so nothing needs these)
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Bookings viewable by everyone for availability check" ON bookings;

-- 5. Rate limiter: cleanup only touches the endpoint being checked.
--    Previously a short-window check deleted every other endpoint's history,
--    silently resetting long-window limits.
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
    DELETE FROM rate_limits
    WHERE endpoint = p_endpoint
      AND created_at < (NOW() - (p_window_seconds || ' seconds')::INTERVAL);

    SELECT COUNT(*) INTO v_count
    FROM rate_limits
    WHERE ip_address = p_ip_address
      AND endpoint = p_endpoint
      AND created_at > (NOW() - (p_window_seconds || ' seconds')::INTERVAL);

    IF v_count >= p_limit THEN
        RETURN FALSE;
    END IF;

    INSERT INTO rate_limits (ip_address, endpoint) VALUES (p_ip_address, p_endpoint);
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION check_rate_limit FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION check_rate_limit TO service_role;
