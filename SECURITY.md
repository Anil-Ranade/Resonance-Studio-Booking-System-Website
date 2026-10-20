# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Security Measures Implemented

### 1. Authentication & Authorization

#### Customer Authentication
- Customer booking flow requires a **10-digit WhatsApp number, name, and password**
- Existing customers receive their saved name automatically; new customers set a password
- Customer passwords are stored as bcrypt hashes and are never stored in plaintext
- Forgot-password requests are created through `/forgot-password` and resolved by authorized admins
- Customer data is used for WhatsApp booking confirmations and one-day advance reminders
- **Cookie-based session management** with HttpOnly secure cookies
- **Auto-login** for trusted devices with valid session cookies

#### Admin Authentication
- **Supabase Auth** handles email/password authentication
- Access tokens verified on every admin API request
- Admin status verified against `admin_users` table
- Active status check (`is_active = true`)
- Successful admin login stores the Supabase session in an HttpOnly cookie

#### Staff Authentication
- **Supabase Auth** handles staff email/password authentication
- Staff status verified against `admin_users` table (role: `staff`)
- Access tokens verified on every staff API request
- Staff has limited permissions compared to admin
- Successful staff login stores the Supabase session in an HttpOnly cookie


#### Secure Booking Page Access
- **Authentication required** to view, edit, or cancel bookings
- Session verification on every protected page load
- Cookie-based auth tokens with HttpOnly and Secure flags
- Automatic session refresh for seamless user experience
- Logout endpoint clears all session cookies

#### Edit/Cancel Booking Verification
- Mobile number and name are collected in the customer flow
- Private booking fields require a verified customer session
- Public online changes are free more than 24 hours before the session
- Within 24 hours, customers must contact the studio; late cancellation is 50% and no-show is 100%

### 2. HTTP Security Headers

The following headers are enforced via `next.config.ts`:

| Header | Value | Purpose |
|--------|-------|---------|
| Strict-Transport-Security | max-age=63072000; includeSubDomains; preload | Force HTTPS |
| X-Frame-Options | SAMEORIGIN | Prevent clickjacking |
| X-Content-Type-Options | nosniff | Prevent MIME sniffing |
| Referrer-Policy | strict-origin-when-cross-origin | Control referrer info |
| Permissions-Policy | camera=(), microphone=(), geolocation=() | Restrict browser APIs |
| Content-Security-Policy | Self-hosted scripts/styles and approved connections | Reduce XSS impact |

### 3. Input Validation & Sanitization

- Phone numbers: 10 digits only, non-digits stripped
- Mobile numbers: exactly 10 digits
- Email addresses: validated where operational email integrations use them
- Text inputs: HTML tags (`<`, `>`) removed to prevent XSS
- Length limits: 1000 characters default, 5000 for long text

### 4. Database Security

- **Row Level Security (RLS)** enabled on protected tables after migrations are applied
- Private users and bookings are accessed through server-side service-role APIs
- Browser-authenticated sessions do not receive broad direct table/function grants
- **UUID primary keys** (non-sequential, non-guessable)
- **Enum types** for constrained values
- **Service role key** used only server-side

### 5. Secret Management

- All secrets in `.env.local` (never committed)
- `.env*` patterns in `.gitignore`
- JWT secrets: minimum 32 characters recommended
- Service role key: never exposed to client
- Resend API key: server-only, never exposed
- Google API credentials: server-only (Calendar & Sheets access)
- Auth cookies: HttpOnly, Secure in production, SameSite=Strict

### 6. Session Security

- HttpOnly cookies prevent XSS token theft
- Secure flag ensures HTTPS-only transmission
- SameSite=Strict reduces CSRF exposure
- Session expiry with automatic refresh
- Logout properly clears all auth cookies
- Trusted device fingerprints stored securely

### 7. Booking Security

- **Atomic booking with row-level locking** - Uses PostgreSQL `FOR UPDATE` to prevent race conditions when two users try to book the same slot simultaneously
- **Database-level conflict prevention** - All booking creation and updates use the `create_booking_atomic` and `update_booking_atomic` PostgreSQL functions
- **Duplicate booking prevention** - Exact same phone, studio, date, start/end time are rejected
- **Time-based conflict checking** - Prevents overlapping bookings for same studio
- **Immediate confirmation** - All bookings are confirmed immediately (no pending state)
- **Past booking protection** - Past bookings auto-marked as completed
- **Google Sheets audit logging** - All booking actions logged for accountability
- **Admin/Staff attribution** - Bookings created by team are clearly marked
- **WhatsApp reminder tracking** - All reminders logged in audit_logs table
- **Booking restore control** - Only cancelled/no-show bookings can be restored

### 8. Invoice Generation Security

- **Client-side generation** - Invoices generated in browser, no server-side PDF generation
- **No sensitive data exposure** - Minimal customer info, no payment details stored
- **Print-only functionality** - No download or storage of invoice files
- **Browser security** - Uses browser's native print capabilities

## Reporting a Vulnerability

If you discover a security vulnerability, please:

1. **Do NOT** open a public GitHub issue
2. Email the developer directly with details
3. Include steps to reproduce the vulnerability
4. Allow reasonable time for a fix before disclosure

## Security Best Practices for Deployment

### Environment Variables
```bash
# Generate strong secrets
openssl rand -base64 32  # For JWT_SECRET
```

### Supabase Configuration
1. Enable RLS on all protected tables
2. Review and test RLS policies
3. Use anon key for client, service role for server only
4. Enable audit logging

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Use strong, unique JWT secrets (32+ chars)
- [ ] Verify all RLS policies
- [ ] Enable HTTPS only
- [ ] Set up monitoring and alerting
- [ ] Regularly rotate secrets
- [ ] Keep dependencies updated (`npm audit`)

## Known Security Considerations

### Rate Limiting
Rate limiting is database-backed and applied across public/authentication-sensitive API routes. It uses endpoint and client keys and fails closed if the rate-limit check cannot complete. Production deployments should still use provider-level DDoS protection.

### Password Reset Operations
Admins can resolve customer reset requests from `/admin/password-requests`. The current workflow lets an admin set a replacement password and share it through WhatsApp; use a temporary password and ask the customer to change it after signing in.

## Dependencies

Run `npm audit` regularly to check for vulnerabilities in dependencies.

Dependency status must be checked in the deployment environment with `npm audit`; it was not independently verified in this workspace because registry access was unavailable.

## Recent Security Updates (October 2026)

- Added **atomic booking mechanism** with PostgreSQL row-level locking to prevent race conditions
- Implemented **`create_booking_atomic`** and **`update_booking_atomic`** database functions
- Updated all booking APIs (`/api/book`, `/api/admin/book`, `/api/staff/book`) to use atomic operations
- Preserved admin/staff **skip_validation** override capability for emergency bookings
- Added **`check_rate_limit`** database function for endpoint and client-key rate limiting
- Enforced admin/super-admin roles on admin APIs
- Redacted unauthenticated booking lookups and limited customer status responses
- Added fail-closed rate limiting, CSP, and trusted-device session checks
- Added per-phone customer-password rate limiting
- Added HttpOnly admin/staff session cookies and cookie logout
- Logout now disables the trusted device used by the customer session
- Added customer password setup/login and admin-managed password reset requests
- Added database migration `011_security_hardening.sql`
- Removed vulnerable development-only dependency chains; run `npm audit` in the deployment environment to verify dependencies

## Contact

For security concerns, contact:
- **Developer**: Ashutosh Swamy
- **GitHub**: [@ashutoshswamy](https://github.com/ashutoshswamy)
