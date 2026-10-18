CREATE TABLE IF NOT EXISTS password_reset_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number VARCHAR(15) NOT NULL,
  name VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMPTZ,
  CONSTRAINT chk_password_reset_request_status CHECK (status IN ('pending', 'resolved'))
);

CREATE INDEX IF NOT EXISTS idx_password_reset_requests_status_created
  ON password_reset_requests(status, created_at DESC);

ALTER TABLE password_reset_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON password_reset_requests FROM anon, authenticated;
GRANT ALL ON password_reset_requests TO service_role;
