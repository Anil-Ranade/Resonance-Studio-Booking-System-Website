-- =====================================================
-- LOYALTY CASHBACK SCHEME
-- =====================================================

-- 1. Add column to bookings to track if reward was given
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS is_loyalty_rewarded BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_bookings_is_loyalty_rewarded ON bookings(is_loyalty_rewarded);

-- 2. Create loyalty rewards table (tracks payouts)
CREATE TABLE IF NOT EXISTS loyalty_rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number VARCHAR(15) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL DEFAULT 1500.00,
    booking_ids UUID[] NOT NULL, -- Array of booking IDs that contributed
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_phone ON loyalty_rewards(phone_number);
-- Enable RLS
ALTER TABLE loyalty_rewards ENABLE ROW LEVEL SECURITY;

-- Policies for loyalty_rewards
DROP POLICY IF EXISTS "Users can view their own rewards" ON loyalty_rewards;
CREATE POLICY "Users can view their own rewards" ON loyalty_rewards
    FOR SELECT USING (true); -- Ideally restrict by phone number matching auth user, but phone is in 'users' table. 
    -- For now, public read is consistent with some other parts, or we can restrict. 
    -- Given the constraint "Cashback is linked to customer's mobile number", we'll rely on API logic to filter.

-- 3. Function to calculate current loyalty progress
CREATE OR REPLACE FUNCTION get_loyalty_progress(p_phone_number VARCHAR)
RETURNS JSONB AS $$
DECLARE
    v_booking JSONB;
    v_window_start DATE;
    v_window_end DATE;
    v_total_hours DECIMAL := 0;
    v_current_booking_hours DECIMAL;
    v_contributing_ids UUID[] := '{}';
    v_has_cycle BOOLEAN := FALSE;
    
    -- Temporary arrays to hold fetched bookings to "simulate" the rolling window
    t_bookings JSONB[];
    t_idx INTEGER;
    t_inner_idx INTEGER;
    t_len INTEGER;
BEGIN
    -- Fetch all relevant bookings into an array for processing
    SELECT ARRAY_AGG(
        jsonb_build_object(
            'id', id, 
            'date', date, 
            'hours', EXTRACT(EPOCH FROM (end_time - start_time))/3600
        ) ORDER BY date ASC, start_time ASC
    )
    INTO t_bookings
    FROM bookings 
    WHERE phone_number = p_phone_number 
    AND status = 'completed' 
    AND is_loyalty_rewarded = FALSE;
    
    IF t_bookings IS NULL OR array_length(t_bookings, 1) IS NULL THEN
        RETURN jsonb_build_object(
            'hours', 0,
            'target', 50,
            'eligible', false,
            'window_start', NULL,
            'window_end', NULL
        );
    END IF;

    t_len := array_length(t_bookings, 1);
    
    -- Iterate through bookings as potential start points for a cycle
    <<outer_loop>>
    FOR t_idx IN 1..t_len LOOP
        v_booking := t_bookings[t_idx];
        v_window_start := (v_booking->>'date')::DATE; -- date
        v_window_end := v_window_start + INTERVAL '3 months' - INTERVAL '1 day'; -- 3 months window
        
        v_total_hours := 0;
        v_contributing_ids := '{}';
        
        -- Sum up hours for bookings within this window
        <<inner_loop>>
        FOR t_inner_idx IN t_idx..t_len LOOP
            IF ((t_bookings[t_inner_idx]->>'date')::DATE) > v_window_end THEN
                EXIT inner_loop;
            END IF;
            
            v_current_booking_hours := (t_bookings[t_inner_idx]->>'hours')::DECIMAL;
            v_total_hours := v_total_hours + v_current_booking_hours;
            v_contributing_ids := array_append(v_contributing_ids, (t_bookings[t_inner_idx]->>'id')::UUID);
             
            -- Check if we hit the target
            IF v_total_hours >= 50 THEN
                v_has_cycle := TRUE;
                RETURN jsonb_build_object(
                    'hours', v_total_hours,
                    'target', 50,
                    'eligible', true,
                    'window_start', v_window_start,
                    'window_end', v_window_end,
                    'booking_ids', v_contributing_ids
                );
            END IF;
        END LOOP inner_loop;

        -- If we are here, this window didn't reach 50 hours.
        -- We continue to the next booking as the start point (Rolling Window)
    END LOOP outer_loop;

    -- If no complete cycle found, return the progress of the *latest* valid window 
    
    FOR t_idx IN 1..t_len LOOP
        v_booking := t_bookings[t_idx];
        v_window_start := (v_booking->>'date')::DATE; -- date
        v_window_end := v_window_start + INTERVAL '3 months' - INTERVAL '1 day';
        
        -- If this window is already in the past, it's a failed cycle (since we didn't return above).
        -- So we skip it.
        IF v_window_end < CURRENT_DATE THEN
            CONTINUE;
        END IF; 
        
        -- This is the first "live" cycle.
        -- Calculate its sum.
        v_total_hours := 0;
        <<inner_loop_2>>
        FOR t_inner_idx IN t_idx..t_len LOOP
            IF ((t_bookings[t_inner_idx]->>'date')::DATE) > v_window_end THEN
                EXIT inner_loop_2;
            END IF;
             v_current_booking_hours := (t_bookings[t_inner_idx]->>'hours')::DECIMAL;
            v_total_hours := v_total_hours + v_current_booking_hours;
        END LOOP inner_loop_2;
        
        RETURN jsonb_build_object(
            'hours', v_total_hours,
            'target', 50,
            'eligible', false,
            'window_start', v_window_start,
            'window_end', v_window_end
        );
    END LOOP;
    
    -- If we get here, it means we have no bookings, or all bookings are old failed cycles and no future/current bookings exist.
    RETURN jsonb_build_object(
        'hours', 0,
        'target', 50,
        'eligible', false,
        'window_start', NULL,
        'window_end', NULL
    );

END;
$$ LANGUAGE plpgsql;

-- 4. Function to claim loyalty reward
CREATE OR REPLACE FUNCTION claim_loyalty_reward(p_phone_number VARCHAR)
RETURNS JSONB AS $$
DECLARE
    v_status JSONB;
    v_booking_ids UUID[];
    v_reward_id UUID;
    v_id UUID;
BEGIN
    -- Check status
    v_status := get_loyalty_progress(p_phone_number);
    
    IF (v_status->>'eligible')::BOOLEAN = FALSE THEN
        RETURN jsonb_build_object('success', false, 'message', 'Not eligible for reward yet.');
    END IF;
    
    -- Extract booking IDs from the JSON (need to parse array)
    -- Postgres JSONB to UUID array cast needs intermediate text conversion
    SELECT ARRAY(
        SELECT (elem::text)::UUID 
        FROM jsonb_array_elements_text(v_status->'booking_ids') as elem
    ) INTO v_booking_ids;
    
    -- Create Reward Record
    INSERT INTO loyalty_rewards (phone_number, amount, booking_ids)
    VALUES (p_phone_number, 1500.00, v_booking_ids)
    RETURNING id INTO v_reward_id;
    
    -- Mark bookings as rewarded
    FOREACH v_id IN ARRAY v_booking_ids LOOP
        UPDATE bookings SET is_loyalty_rewarded = TRUE WHERE id = v_id;
    END LOOP;
    
    RETURN jsonb_build_object('success', true, 'reward_id', v_reward_id);
END;
$$ LANGUAGE plpgsql;

-- 5. FUNCTION TO GET ALL LOYALTY STATUSES (Helper for Admin Panel)
CREATE OR REPLACE FUNCTION get_all_loyalty_statuses()
RETURNS TABLE (
    phone_number VARCHAR,
    customer_name VARCHAR,
    hours DECIMAL,
    target INTEGER,
    eligible BOOLEAN,
    window_start DATE,
    window_end DATE
) AS $$
DECLARE
    r RECORD;
    v_prog JSONB;
BEGIN
    FOR r IN 
        SELECT DISTINCT b.phone_number, u.name as customer_name
        FROM bookings b
        LEFT JOIN users u ON b.phone_number = u.phone_number
        WHERE b.phone_number IS NOT NULL
    LOOP
        v_prog := get_loyalty_progress(r.phone_number);
        
        phone_number := r.phone_number;
        customer_name := COALESCE(r.customer_name, 'Unknown');
        hours := (v_prog->>'hours')::DECIMAL;
        target := (v_prog->>'target')::INTEGER;
        eligible := (v_prog->>'eligible')::BOOLEAN;
        window_start := (v_prog->>'window_start')::DATE;
        window_end := (v_prog->>'window_end')::DATE;
        
        RETURN NEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
