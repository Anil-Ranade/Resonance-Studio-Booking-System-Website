-- Migration: 007_investor_scheme
-- Description: Add support for Investor/Franchise scheme

-- 1. Update admin_role ENUM
-- We cannot directly ALTER ENUM in a migration easily without knowing if it exists, 
-- but we can use the following trick to add the value if it doesn't exist.
DO $$ 
BEGIN
    ALTER TYPE admin_role ADD VALUE IF NOT EXISTS 'investor';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create investor_accounts table
CREATE TABLE IF NOT EXISTS investor_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    deposit_amount DECIMAL(10, 2) NOT NULL DEFAULT 30000.00,
    target_revenue DECIMAL(10, 2) NOT NULL DEFAULT 45000.00,
    current_revenue DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'withdrawn'
    joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT uq_investor_user UNIQUE (user_id),
    CONSTRAINT chk_investor_status CHECK (status IN ('active', 'completed', 'withdrawn'))
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_investor_accounts_user_id ON investor_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_investor_accounts_status ON investor_accounts(status);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_investor_accounts_updated_at ON investor_accounts;
CREATE TRIGGER update_investor_accounts_updated_at
    BEFORE UPDATE ON investor_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 3. Add investor_id to bookings table
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS investor_id UUID REFERENCES admin_users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_investor_id ON bookings(investor_id);

-- 4. RLS Policies

-- Enable RLS
ALTER TABLE investor_accounts ENABLE ROW LEVEL SECURITY;

-- Policies for investor_accounts

-- Admins can view all investor accounts
DROP POLICY IF EXISTS "Admins can view all investor accounts" ON investor_accounts;
CREATE POLICY "Admins can view all investor accounts" ON investor_accounts
    FOR SELECT USING (
        auth.uid() IN (SELECT id FROM admin_users WHERE role IN ('admin', 'super_admin') AND is_active = true)
    );

-- Investors can view their own account
DROP POLICY IF EXISTS "Investors can view their own account" ON investor_accounts;
CREATE POLICY "Investors can view their own account" ON investor_accounts
    FOR SELECT USING (
        auth.uid() = user_id
    );

-- Admins can manage investor accounts
DROP POLICY IF EXISTS "Admins can manage investor accounts" ON investor_accounts;
CREATE POLICY "Admins can manage investor accounts" ON investor_accounts
    FOR ALL USING (
        auth.uid() IN (SELECT id FROM admin_users WHERE role IN ('admin', 'super_admin') AND is_active = true)
    );

-- Update Bookings RLS to allow Investors to view their assigned bookings
-- Existing policy: "Bookings can be managed by service role" and public read for validation.
-- We need a policy for authenticated admin users (staff/investor) to view bookings.

-- Drop existing restricted policies if any that might conflict, or add new specific ones.
-- The `init.sql` showed:
-- "Bookings viewable by everyone for availability check" (SELECT true) -> This covers reading for everyone.
-- "Bookings can be managed by service role" (ALL service_role)

-- We need to ensure Investors can't *edit* bookings they don't own, or maybe they shouldn't edit at all?
-- The requirements say they "get the customers", "attend their sessions". So they might need edit access.
-- For now, let's give them read access via the public policy (already exists) 
-- and if we need specific filtering logic in the API, we handle it there.
-- However, for *Admin Dashboard* usage, we often rely on RLS if we use the Supabase client directly.
-- But since the API uses `service_role` (likely), RLS might be bypassed in API routes.
-- Let's check `app/lib/supabase.ts` or similar to see how the client is initialized.
-- `app/api/auth/verify-otp/route.ts` used `SUPABASE_SERVICE_ROLE_KEY`, so it bypasses RLS.
-- So RLS on bookings specifically for investors might not be strictly needed for the API to work, 
-- BUT it is good practice.

-- Let's add a policy just in case client-side fetching is used.
DROP POLICY IF EXISTS "Investors can view assigned bookings" ON bookings;
CREATE POLICY "Investors can view assigned bookings" ON bookings
    FOR SELECT USING (
        investor_id = auth.uid() OR 
        auth.uid() IN (SELECT id FROM admin_users WHERE role IN ('admin', 'super_admin', 'staff') AND is_active = true)
    );
