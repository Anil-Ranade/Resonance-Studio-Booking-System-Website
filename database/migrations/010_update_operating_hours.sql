-- Update standard operating hours to 8:00 AM–9:30 PM.
INSERT INTO booking_settings (key, value, description)
VALUES ('default_open_time', '"08:00"', 'Default studio opening time')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO booking_settings (key, value, description)
VALUES ('default_close_time', '"21:30"', 'Default studio closing time')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
