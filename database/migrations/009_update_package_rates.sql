-- Update karaoke brackets and college-student band package.
DELETE FROM rate_cards
WHERE session_type = 'karaoke'
  AND sub_option IN ('1-5 people', '6-10 people', '11-20 people', '11-12 people');

DELETE FROM rate_cards
WHERE studio = 'Studio A'
  AND session_type = 'band';

INSERT INTO rate_cards (studio, session_type, sub_option, hourly_rate, min_participants, max_participants) VALUES
  ('Studio A', 'karaoke', '1-8 people', 400, 1, 8),
  ('Studio A', 'karaoke', '9-12 people', 400, 9, 12),
  ('Studio A', 'karaoke', '13-20 people', 400, 13, 20),
  ('Studio B', 'karaoke', '1-8 people', 300, 1, 8),
  ('Studio B', 'karaoke', '9-12 people', 300, 9, 12),
  ('Studio C', 'karaoke', '1-8 people', 250, 1, 8)
ON CONFLICT (studio, session_type, sub_option) DO UPDATE
SET hourly_rate = EXCLUDED.hourly_rate,
    min_participants = EXCLUDED.min_participants,
    max_participants = EXCLUDED.max_participants;

INSERT INTO rate_cards (studio, session_type, sub_option, hourly_rate, min_participants, max_participants)
VALUES ('Studio A', 'band', 'college_students_package', 500, 1, 6)
ON CONFLICT (studio, session_type, sub_option) DO UPDATE
SET hourly_rate = EXCLUDED.hourly_rate,
    min_participants = EXCLUDED.min_participants,
    max_participants = EXCLUDED.max_participants;
