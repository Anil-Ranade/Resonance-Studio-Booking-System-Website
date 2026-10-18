-- 011: Security hardening for existing deployments
-- API routes use service_role for private data. Browser sessions only use
-- Supabase Auth and must not receive direct table/function access.

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM authenticated;

DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Bookings viewable by everyone for availability check" ON bookings;

DROP POLICY IF EXISTS "Users can view their own rewards" ON loyalty_rewards;
CREATE POLICY "Users can view their own rewards" ON loyalty_rewards
  FOR SELECT USING (false);

DROP POLICY IF EXISTS "Users can view their own first booking bonuses" ON first_booking_bonuses;
CREATE POLICY "Users can view their own first booking bonuses" ON first_booking_bonuses
  FOR SELECT USING (false);

REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO service_role;

-- Keep the limiter callable only by the server-side service-role client.
REVOKE EXECUTE ON FUNCTION check_rate_limit(VARCHAR, VARCHAR, INTEGER, INTEGER)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION check_rate_limit(VARCHAR, VARCHAR, INTEGER, INTEGER)
  TO service_role;
