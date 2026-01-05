# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Security Measures Implemented

### 1. Authentication & Authorization

#### Customer Authentication
- **OTP-based authentication** via Email (Resend)
- OTPs are hashed using **bcrypt** (10 salt rounds) before storage
- OTPs expire after **5 minutes**
- Maximum **5 verification attempts** per OTP
- Old OTPs are deleted before generating new ones (prevents replay attacks)
- **Cookie-based session management** with HttpOnly secure cookies
- **Auto-login** for trusted devices with valid session cookies

#### Admin Authentication
- **Supabase Auth** handles email/password authentication
- Access tokens verified on every admin API request
- Admin status verified against `admin_users` table
- Active status check (`is_active = true`)

#### Staff Authentication
- **Supabase Auth** handles staff email/password authentication
- Staff status verified against `admin_users` table (role: `staff`)
- Access tokens verified on every staff API request
- Staff has limited permissions compared to admin

#### Investor Authentication
- **Supabase Auth** handles investor email/password authentication
- Investor status verified against `admin_users` table (role: `investor`)
- Can only access dashboards and bookings specifically assigned to them


#### Secure Booking Page Access
- **Authentication required** to view, edit, or cancel bookings
- Session verification on every protected page load
- Cookie-based auth tokens with HttpOnly and Secure flags
- Automatic session refresh for seamless user experience
- Logout endpoint clears all session cookies

#### Edit/Cancel Booking Verification
- Email-based booking lookup
- OTP sent to registered email for verification
- Prevents unauthorized booking modifications
- Time-based restrictions (48h for confirmed bookings)

### 2. HTTP Security Headers

The following headers are enforced via `next.config.ts`:

| Header | Value | Purpose |
|--------|-------|---------|
| Strict-Transport-Security | max-age=63072000; includeSubDomains; preload | Force HTTPS |
| X-Frame-Options | SAMEORIGIN | Prevent clickjacking |
| X-Content-Type-Options | nosniff | Prevent MIME sniffing |
| Referrer-Policy | strict-origin-when-cross-origin | Control referrer info |
| Permissions-Policy | camera=(), microphone=(), geolocation=() | Restrict browser APIs |

### 3. Input Validation & Sanitization

- Phone numbers: 10 digits only, non-digits stripped
- OTP codes: 6 digits only, validated format
- Email addresses: RFC-compliant format, max 254 characters
- Text inputs: HTML tags (`<`, `>`) removed to prevent XSS
- Length limits: 1000 characters default, 5000 for long text

### 4. Database Security

- **Row Level Security (RLS)** enabled on all tables
- Users can only access their own records
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
- Auth cookies: HttpOnly, Secure, SameSite=Lax

### 6. Session Security

- HttpOnly cookies prevent XSS token theft
- Secure flag ensures HTTPS-only transmission
- SameSite=Lax prevents CSRF attacks
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
1. Enable RLS on all tables
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
Currently, rate limiting is implemented at the OTP level (max attempts). For production deployments, consider adding:
- IP-based rate limiting (via Vercel, Cloudflare, or middleware)
- Global API rate limiting
- DDoS protection

### Content Security Policy
A strict CSP is not currently implemented due to dynamic content requirements. Consider adding a CSP header if your security requirements demand it.

## Dependencies

Run `npm audit` regularly to check for vulnerabilities in dependencies.

Current status (as of December 2025): **0 vulnerabilities**

## Recent Security Updates (January 2026)

- Added **atomic booking mechanism** with PostgreSQL row-level locking to prevent race conditions
- Implemented **`create_booking_atomic`** and **`update_booking_atomic`** database functions
- Updated all booking APIs (`/api/book`, `/api/admin/book`, `/api/staff/book`) to use atomic operations
- Preserved admin/staff **skip_validation** override capability for emergency bookings
- Added **`check_rate_limit`** database function infrastructure for future IP-based rate limiting

## Contact

For security concerns, contact:
- **Developer**: Ashutosh Swamy
- **GitHub**: [@ashutoshswamy](https://github.com/ashutoshswamy)
