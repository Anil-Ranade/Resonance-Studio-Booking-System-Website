-- Trigger to automatically update investor revenue
-- Run this in Supabase SQL Editor

-- 1. Create the function to calculate and update revenue
CREATE OR REPLACE FUNCTION update_investor_revenue()
RETURNS TRIGGER AS $$
DECLARE
    v_investor_id UUID;
    v_total_revenue DECIMAL(10, 2);
BEGIN
    -- Determine the investor_id (from new or old record)
    IF (TG_OP = 'DELETE') THEN
        v_investor_id := OLD.investor_id;
    ELSE
        v_investor_id := NEW.investor_id;
    END IF;

    -- If no investor_id, skip
    IF v_investor_id IS NULL THEN
        RETURN NULL;
    END IF;

    -- Calculate total revenue from confirmed/completed bookings for this investor
    SELECT COALESCE(SUM(total_amount), 0)
    INTO v_total_revenue
    FROM bookings
    WHERE investor_id = v_investor_id
      AND status IN ('confirmed', 'completed');

    -- Update the investor_accounts table
    UPDATE investor_accounts
    SET current_revenue = v_total_revenue,
        updated_at = NOW()
    WHERE user_id = v_investor_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 2. Create the trigger on bookings table
DROP TRIGGER IF EXISTS trigger_update_investor_revenue ON bookings;
CREATE TRIGGER trigger_update_investor_revenue
    AFTER INSERT OR UPDATE OR DELETE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_investor_revenue();
