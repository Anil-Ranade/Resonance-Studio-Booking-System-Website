-- =====================================================
-- ATOMIC BOOKING FUNCTION - Race Condition Prevention
-- =====================================================
-- 
-- This function creates bookings atomically using row-level locking
-- to prevent race conditions where two users try to book the same
-- slot simultaneously.
--
-- Run this SQL in your Supabase SQL Editor before deploying the
-- updated API code.
--
-- Created: January 2026
-- =====================================================

-- Robust cleanup: Drop ALL existing versions of the functions to avoid ambiguity
DO $$ 
DECLARE 
    r RECORD;
BEGIN 
    -- Drop all 'create_booking_atomic' functions
    FOR r IN 
        SELECT oid::regprocedure::text as func_signature 
        FROM pg_proc 
        WHERE proname = 'create_booking_atomic' 
    LOOP 
        EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_signature || ' CASCADE'; 
    END LOOP;
END $$;

-- Function to create booking atomically with locking
CREATE OR REPLACE FUNCTION create_booking_atomic(
    p_phone_number VARCHAR,
    p_studio VARCHAR,
    p_session_type VARCHAR,
    p_date DATE,
    p_start_time TIME,
    p_end_time TIME,
    p_name VARCHAR DEFAULT NULL,
    p_email VARCHAR DEFAULT NULL,
    p_session_details TEXT DEFAULT NULL,
    p_total_amount DECIMAL DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_created_by_staff_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_booking_id UUID;
    v_conflict_count INTEGER;
    v_booking_record RECORD;
BEGIN
    -- Validate time range
    IF p_end_time <= p_start_time THEN
        RETURN json_build_object(
            'success', false,
            'error', 'End time must be after start time'
        );
    END IF;

    -- Lock existing bookings that might conflict
    -- FOR UPDATE prevents other transactions from modifying these rows
    -- This is the key to preventing race conditions
    PERFORM id FROM bookings
    WHERE studio = p_studio
      AND date = p_date
      AND status IN ('confirmed', 'pending')
      AND start_time < p_end_time
      AND end_time > p_start_time
    FOR UPDATE;
    
    -- Check for conflicts after acquiring locks
    SELECT COUNT(*) INTO v_conflict_count
    FROM bookings
    WHERE studio = p_studio
      AND date = p_date
      AND status IN ('confirmed', 'pending')
      AND start_time < p_end_time
      AND end_time > p_start_time;
    
    IF v_conflict_count > 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Time slot is no longer available',
            'conflict_count', v_conflict_count
        );
    END IF;
    
    -- Also check blocked availability slots
    IF EXISTS (
        SELECT 1 FROM availability_slots
        WHERE studio = p_studio
          AND date = p_date
          AND is_available = FALSE
          AND start_time < p_end_time
          AND end_time > p_start_time
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'This time slot is blocked'
        );
    END IF;
    
    -- Insert the booking
    INSERT INTO bookings (
        phone_number, name, email, studio, session_type,
        session_details, date, start_time, end_time,
        status, total_amount, notes, created_by_staff_id,
        confirmed_at
    ) VALUES (
        p_phone_number, p_name, p_email, p_studio, p_session_type,
        COALESCE(p_session_details, p_session_type), p_date, p_start_time, p_end_time,
        'confirmed', p_total_amount, p_notes, p_created_by_staff_id,
        NOW()
    )
    RETURNING * INTO v_booking_record;
    
    -- Return success with booking data
    RETURN json_build_object(
        'success', true,
        'booking_id', v_booking_record.id,
        'booking', row_to_json(v_booking_record)
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users and service role
GRANT EXECUTE ON FUNCTION create_booking_atomic TO authenticated;
GRANT EXECUTE ON FUNCTION create_booking_atomic TO service_role;

-- =====================================================
-- ATOMIC BOOKING UPDATE FUNCTION
-- =====================================================
-- For updating existing bookings while preventing conflicts

-- Drop existing function to prevent ambiguity
DROP FUNCTION IF EXISTS update_booking_atomic(UUID, VARCHAR, VARCHAR, VARCHAR, VARCHAR, TEXT, DATE, TIME, TIME, DECIMAL);

CREATE OR REPLACE FUNCTION update_booking_atomic(
    p_booking_id UUID,
    p_phone_number VARCHAR,
    p_name VARCHAR DEFAULT NULL,
    p_studio VARCHAR DEFAULT NULL,
    p_session_type VARCHAR DEFAULT NULL,
    p_session_details TEXT DEFAULT NULL,
    p_date DATE DEFAULT NULL,
    p_start_time TIME DEFAULT NULL,
    p_end_time TIME DEFAULT NULL,
    p_total_amount DECIMAL DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_existing_booking RECORD;
    v_conflict_count INTEGER;
    v_updated_booking RECORD;
    v_new_studio VARCHAR;
    v_new_date DATE;
    v_new_start TIME;
    v_new_end TIME;
BEGIN
    -- Fetch existing booking and verify ownership
    SELECT * INTO v_existing_booking
    FROM bookings
    WHERE id = p_booking_id
      AND phone_number = p_phone_number
    FOR UPDATE;
    
    IF v_existing_booking IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Booking not found or does not belong to this phone number'
        );
    END IF;
    
    -- Check if booking can be modified
    IF v_existing_booking.status = 'cancelled' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Cannot modify a cancelled booking'
        );
    END IF;
    
    IF v_existing_booking.status = 'completed' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Cannot modify a completed booking'
        );
    END IF;
    
    -- Determine new values (use provided or keep existing)
    v_new_studio := COALESCE(p_studio, v_existing_booking.studio);
    v_new_date := COALESCE(p_date, v_existing_booking.date);
    v_new_start := COALESCE(p_start_time, v_existing_booking.start_time);
    v_new_end := COALESCE(p_end_time, v_existing_booking.end_time);
    
    -- Validate time range
    IF v_new_end <= v_new_start THEN
        RETURN json_build_object(
            'success', false,
            'error', 'End time must be after start time'
        );
    END IF;
    
    -- Lock and check for conflicts (excluding this booking)
    PERFORM id FROM bookings
    WHERE studio = v_new_studio
      AND date = v_new_date
      AND status IN ('confirmed', 'pending')
      AND id != p_booking_id
      AND start_time < v_new_end
      AND end_time > v_new_start
    FOR UPDATE;
    
    SELECT COUNT(*) INTO v_conflict_count
    FROM bookings
    WHERE studio = v_new_studio
      AND date = v_new_date
      AND status IN ('confirmed', 'pending')
      AND id != p_booking_id
      AND start_time < v_new_end
      AND end_time > v_new_start;
    
    IF v_conflict_count > 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Time slot is no longer available',
            'conflict_count', v_conflict_count
        );
    END IF;
    
    -- Update the booking
    UPDATE bookings SET
        name = COALESCE(p_name, name),
        studio = v_new_studio,
        session_type = COALESCE(p_session_type, session_type),
        session_details = COALESCE(p_session_details, session_details),
        date = v_new_date,
        start_time = v_new_start,
        end_time = v_new_end,
        total_amount = COALESCE(p_total_amount, total_amount),
        updated_at = NOW()
    WHERE id = p_booking_id
    RETURNING * INTO v_updated_booking;
    
    RETURN json_build_object(
        'success', true,
        'booking_id', v_updated_booking.id,
        'booking', row_to_json(v_updated_booking)
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_booking_atomic TO authenticated;
GRANT EXECUTE ON FUNCTION update_booking_atomic TO service_role;
