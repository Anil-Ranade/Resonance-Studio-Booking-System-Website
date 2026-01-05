-- Backfill investor revenue
-- Run this in Supabase SQL Editor to recalculate revenue for all investors

DO $$
DECLARE
    r RECORD;
    v_total DECIMAL(10, 2);
BEGIN
    -- Loop through all active investor accounts
    FOR r IN SELECT user_id FROM investor_accounts WHERE status = 'active'
    LOOP
        -- Calculate total from bookings (including recently assigned ones)
        SELECT COALESCE(SUM(total_amount), 0)
        INTO v_total
        FROM bookings
        WHERE investor_id = r.user_id
          AND status IN ('confirmed', 'completed');
          
        -- Update the account
        UPDATE investor_accounts
        SET current_revenue = v_total,
            updated_at = NOW()
        WHERE user_id = r.user_id;
        
        RAISE NOTICE 'Updated investor % revenue to %', r.user_id, v_total;
    END LOOP;
END $$;
