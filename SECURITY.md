# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Security Measures Implemented

### 1. Authentication & Authorization

#### Customer Authentication
- **OTP-based authentication** via SMS (Twilio)
- OTPs are hashed using **bcrypt** (10 salt rounds) before storage
- OTPs expire after **5 minutes**
- Maximum **5 verification attempts** per OTP
- Old OTPs are deleted before generating new ones (prevents replay attacks)

#### Admin Authentication
- **Supabase Auth** handles email/password authentication
- Access tokens verified on every admin API request
- Admin status verified against `admin_users` table
- Active status check (`is_active = true`)

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

## Contact

For security concerns, contact:
- **Developer**: Ashutosh Swamy
- **GitHub**: [@ashutoshswamy](https://github.com/ashutoshswamy)
