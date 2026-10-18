-- Customer passwords are stored as bcrypt hashes, never plaintext.
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
COMMENT ON COLUMN users.password_hash IS 'bcrypt password hash; never store or return the plaintext password';
