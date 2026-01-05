CREATE OR REPLACE FUNCTION get_dashboard_stats(
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL,
    p_studio TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_bookings INTEGER;
    v_confirmed_bookings INTEGER;
    v_cancelled_bookings INTEGER;
    v_completed_bookings INTEGER;
    v_today_bookings INTEGER;
    v_total_revenue NUMERIC;
    v_available_slots INTEGER;
    v_today DATE := CURRENT_DATE;
BEGIN
    -- 1. Total Bookings
    SELECT COUNT(*) INTO v_total_bookings
    FROM bookings
    WHERE (p_start_date IS NULL OR date >= p_start_date)
      AND (p_end_date IS NULL OR date <= p_end_date)
      AND (p_studio IS NULL OR p_studio = 'all' OR studio = p_studio);

    -- 2. Confirmed Bookings
    SELECT COUNT(*) INTO v_confirmed_bookings
    FROM bookings
    WHERE status = 'confirmed'
      AND (p_start_date IS NULL OR date >= p_start_date)
      AND (p_end_date IS NULL OR date <= p_end_date)
      AND (p_studio IS NULL OR p_studio = 'all' OR studio = p_studio);

    -- 3. Cancelled Bookings
    SELECT COUNT(*) INTO v_cancelled_bookings
    FROM bookings
    WHERE status = 'cancelled'
      AND (p_start_date IS NULL OR date >= p_start_date)
      AND (p_end_date IS NULL OR date <= p_end_date)
      AND (p_studio IS NULL OR p_studio = 'all' OR studio = p_studio);

    -- 4. Completed Bookings
    SELECT COUNT(*) INTO v_completed_bookings
    FROM bookings
    WHERE status = 'completed'
      AND (p_start_date IS NULL OR date >= p_start_date)
      AND (p_end_date IS NULL OR date <= p_end_date)
      AND (p_studio IS NULL OR p_studio = 'all' OR studio = p_studio);

    -- 5. Today's Confirmed Bookings (Always for current date)
    SELECT COUNT(*) INTO v_today_bookings
    FROM bookings
    WHERE date = v_today
      AND status = 'confirmed'
      AND (p_studio IS NULL OR p_studio = 'all' OR studio = p_studio);

    -- 6. Total Revenue (from confirmed and completed bookings)
    SELECT COALESCE(SUM(total_amount), 0) INTO v_total_revenue
    FROM bookings
    WHERE status IN ('confirmed', 'completed')
      AND (p_start_date IS NULL OR date >= p_start_date)
      AND (p_end_date IS NULL OR date <= p_end_date)
      AND (p_studio IS NULL OR p_studio = 'all' OR studio = p_studio);

    -- 7. Available Slots for Today
    SELECT COUNT(*) INTO v_available_slots
    FROM availability_slots
    WHERE date = v_today
      AND is_available = TRUE;

    -- Return generic JSON object
    RETURN jsonb_build_object(
        'totalBookings', v_total_bookings,
        'confirmedBookings', v_confirmed_bookings,
        'cancelledBookings', v_cancelled_bookings,
        'completedBookings', v_completed_bookings,
        'todayBookings', v_today_bookings,
        'totalRevenue', v_total_revenue,
        'availableSlots', v_available_slots
    );
END;
$$;
