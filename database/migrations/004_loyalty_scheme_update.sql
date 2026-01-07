-- =====================================================
-- LOYALTY SCHEME UPDATE v2
-- Adds: First-time user ₹500 bonus + Increased milestone reward to ₹2,000
-- =====================================================

-- 1. Create table to track first-time booking bonuses
CREATE TABLE IF NOT EXISTS first_booking_bonuses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number VARCHAR(15) NOT NULL UNIQUE,  -- One bonus per phone number
    amount DECIMAL(10, 2) NOT NULL DEFAULT 500.00,
    booking_id UUID REFERENCES bookings(id),  -- The booking that triggered the bonus
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_first_booking_bonuses_phone ON first_booking_bonuses(phone_number);

-- Enable RLS
ALTER TABLE first_booking_bonuses ENABLE ROW LEVEL SECURITY;

-- Policy for first_booking_bonuses
DROP POLICY IF EXISTS "Users can view their own first booking bonuses" ON first_booking_bonuses;
CREATE POLICY "Users can view their own first booking bonuses" ON first_booking_bonuses
    FOR SELECT USING (true);

-- 2. Function to check and award first-time booking bonus
CREATE OR REPLACE FUNCTION check_first_booking_bonus(p_phone_number VARCHAR, p_booking_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_booking_count INTEGER;
    v_already_claimed BOOLEAN := FALSE;
    v_bonus_id UUID;
BEGIN
    -- Check if this phone has already received the first-booking bonus
    SELECT EXISTS(
        SELECT 1 FROM first_booking_bonuses 
        WHERE phone_number = p_phone_number
    ) INTO v_already_claimed;
    
    IF v_already_claimed THEN
        RETURN jsonb_build_object(
            'eligible', false,
            'reason', 'already_claimed',
            'message', 'First booking bonus already claimed'
        );
    END IF;
    
    -- Count total bookings for this phone number
    SELECT COUNT(*) INTO v_booking_count
    FROM bookings 
    WHERE phone_number = p_phone_number
    AND status IN ('pending', 'confirmed', 'completed');
    
    -- If this is their first booking, award the bonus
    IF v_booking_count <= 1 THEN
        INSERT INTO first_booking_bonuses (phone_number, booking_id)
        VALUES (p_phone_number, p_booking_id)
        RETURNING id INTO v_bonus_id;
        
        RETURN jsonb_build_object(
            'eligible', true,
            'awarded', true,
            'bonus_id', v_bonus_id,
            'amount', 500,
            'message', 'First booking bonus of ₹500 awarded!'
        );
    ELSE
        RETURN jsonb_build_object(
            'eligible', false,
            'reason', 'not_first_booking',
            'message', 'Not a first-time booking'
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 3. Function to check if user has first-booking bonus (for display)
CREATE OR REPLACE FUNCTION get_first_booking_bonus_status(p_phone_number VARCHAR)
RETURNS JSONB AS $$
DECLARE
    v_bonus RECORD;
    v_booking_count INTEGER;
BEGIN
    -- Check if already claimed
    SELECT * INTO v_bonus
    FROM first_booking_bonuses 
    WHERE phone_number = p_phone_number;
    
    IF FOUND THEN
        RETURN jsonb_build_object(
            'has_bonus', true,
            'amount', v_bonus.amount,
            'claimed_at', v_bonus.created_at
        );
    END IF;
    
    -- Check if eligible (first booking)
    SELECT COUNT(*) INTO v_booking_count
    FROM bookings 
    WHERE phone_number = p_phone_number
    AND status IN ('pending', 'confirmed', 'completed');
    
    IF v_booking_count = 0 THEN
        RETURN jsonb_build_object(
            'has_bonus', false,
            'eligible', true,
            'amount', 500,
            'message', 'Will receive ₹500 bonus on first booking'
        );
    ELSE
        RETURN jsonb_build_object(
            'has_bonus', false,
            'eligible', false
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 4. Update claim_loyalty_reward to award ₹2,000 instead of ₹1,500
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
    
    -- Extract booking IDs from the JSON
    SELECT ARRAY(
        SELECT (elem::text)::UUID 
        FROM jsonb_array_elements_text(v_status->'booking_ids') as elem
    ) INTO v_booking_ids;
    
    -- Create Reward Record with NEW amount of 2000
    INSERT INTO loyalty_rewards (phone_number, amount, booking_ids)
    VALUES (p_phone_number, 2000.00, v_booking_ids)
    RETURNING id INTO v_reward_id;
    
    -- Mark bookings as rewarded
    FOREACH v_id IN ARRAY v_booking_ids LOOP
        UPDATE bookings SET is_loyalty_rewarded = TRUE WHERE id = v_id;
    END LOOP;
    
    RETURN jsonb_build_object('success', true, 'reward_id', v_reward_id);
END;
$$ LANGUAGE plpgsql;

-- 5. Update default amount in loyalty_rewards table
ALTER TABLE loyalty_rewards 
ALTER COLUMN amount SET DEFAULT 2000.00;
