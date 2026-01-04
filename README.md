# Resonance Studio Booking

A modern, full-stack studio booking and management platform built with Next.js 16 and React 19.

![Next.js](https://img.shields.io/badge/Next.js-16.0.10-black?logo=next.js)
![React](https://img.shields.io/badge/React-19.2.0-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?logo=tailwind-css)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)
![Security](https://img.shields.io/badge/Security-Hardened-green?logo=shield)

## 📖 Overview

Resonance Studio Booking is a comprehensive booking system that allows customers to book music studio sessions, manage their bookings, and provides an admin dashboard for complete studio management. The application features email-based OTP authentication, Google Calendar integration, Google Sheets logging, email notifications, and enterprise-grade security measures.

## ✨ Features

### 🎵 Studio Booking

- Interactive multi-step booking wizard
- Real-time studio availability checking
- Multiple session types support:
  - 🎤 Karaoke (up to 30 participants)
  - 🎵 Live with Musicians
  - 🥁 Drum Practice
  - 🎸 Band Rehearsal
  - 📻 Recording (Audio/Video/Chroma Key)
  - 📋 Meetings / Classes (without Sound Operator)
- Smart studio suggestions based on group size
- Configurable booking duration limits (min/max hours)
- Advance booking restrictions (up to 30 days)
- Booking buffer time between sessions
- **Prompt Payment Discount** - "Pay Now & Save" logic with calculated discounts


### 📱 Secure Authentication

- Email-based OTP verification via Resend
- Secure phone number verification flow
- **Trusted device management** with cookie-based auto-login
- Session-based authentication for booking access
- Rate limiting with cooldown protection
- Bcrypt-hashed OTP storage (10 salt rounds)

### 📅 Google Calendar Integration

- Automatic calendar event creation for bookings
- Sync bookings with owner's Google Calendar
- Event details include customer info and booking ID
- Automatic event updates on booking changes

### 📊 Google Sheets Integration

- All bookings logged to Google Sheets for reporting
- Tracks new bookings, updates, and cancellations
- Real-time audit trail of all booking activities
- Automated timestamp and action logging

### 📧 Email Notifications

- OTP verification codes via email (Resend)
- Booking confirmation emails
- Booking update and cancellation notifications
- Beautiful dark-themed email templates

### 👤 My Bookings

- **Secure authentication required** to view bookings
- Auto-login with trusted devices
- View personal booking history
- Cancel bookings with confirmation
- Track booking status (confirmed, cancelled, completed, no_show)
- View upcoming and past bookings
- Past bookings auto-marked as completed

### ✏️ Edit Booking

- Email-based booking lookup
- OTP verification for security
- Modify confirmed bookings
- Time restrictions (48 hours before session)

### ❌ Cancel Booking

- Email-based booking lookup
- OTP verification for secure cancellation
- Cancellation restrictions based on booking time
- Email confirmation of cancellation

### 🔧 Admin Dashboard

- Secure Supabase Auth-based admin authentication
- Dashboard statistics (total bookings, revenue, today's bookings)
- Booking management (view, cancel, mark no_show, mark completed)
- **Admin booking creation** - Create bookings on behalf of customers
- **WhatsApp reminder messages** - Send reminders within 24 hours of booking time
- **Invoice printing** - Generate and print professional booking invoices
- **Booking restore/delete** - Restore cancelled bookings or permanently delete
- **Staff management** - Create and manage staff members
- Availability slot management (block/unblock)
- Payment verification management
- Bulk availability operations

- Configurable booking settings
- **Payment Verification** - Verify prompt payment bookings (`payments/`)
- **Admin Reminders** - Standalone page for managing WhatsApp reminders
- Audit logging for all admin actions


### 👥 Staff Portal

- Separate staff authentication (Supabase Auth)
- Staff dashboard with booking statistics
- Staff booking management with WhatsApp integration
- Staff booking creation capability
- **Invoice printing** - Generate invoices for bookings
- **Booking deletion** - Remove cancelled/no-show bookings
- Limited permissions compared to admin

### 💰 Rate Card

- Dynamic studio pricing display
- Session type-based pricing
- Sub-options for group sizes
- Per-studio rate configuration

### 📍 Multiple Studios

- Support for 3 studio spaces (Studio A, B, C)
- Per-studio capacity management
- Individual availability per studio
- Studio-specific amenities

### 📞 Contact & Support

- Contact form
- Comprehensive FAQ section
- Policies page

### 🖼️ Additional Pages

- Photo gallery
- About page
- Rate card display
- **Display page** - Public schedule view for studio monitors

### 🔍 SEO & Performance

- Dynamic sitemap generation (`/sitemap.xml`)
- **JSON-LD structured data** - LocalBusiness and FAQPage schemas
- Open Graph and Twitter card meta tags
- Geo-location meta tags for local SEO
- Optimized robots.txt configuration
- Performance-optimized animations with reduced motion support

## 🛠 Tech Stack

| Category       | Technology                   |
| -------------- | ---------------------------- |
| **Framework**  | Next.js 16.0.10 (App Router) |
| **UI Library** | React 19.2.0                 |
| **Language**   | TypeScript 5                 |
| **Styling**    | Tailwind CSS 4               |
| **Animations** | Framer Motion 12             |
| **Icons**      | Lucide React                 |
| **Database**   | Supabase (PostgreSQL)        |
| **Auth**       | JWT + OTP (bcryptjs)         |
| **Calendar**   | Google Calendar API          |
| **Sheets**     | Google Sheets API            |
| **Email**      | Resend                       |

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Resend account (for Email notifications)
- Google Cloud project (for Calendar API & Sheets integration)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/ashutoshswamy/Resonance-Studio-Booking.git
   cd Resonance-Studio-Booking
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Configure the following variables:

   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   # Email (Resend)
   RESEND_API_KEY=your_resend_api_key
   RESEND_FROM_EMAIL=noreply@yourdomain.com

   # Google Calendar
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   GOOGLE_REFRESH_TOKEN=your_refresh_token
   GOOGLE_CALENDAR_ID=your_calendar_id

   #Google Sheets
   GOOGLE_SHEET_ID=your_google_sheet_id

   # JWT (use strong, random strings - min 32 characters)
   JWT_SECRET=your_jwt_secret_min_32_chars
   REFRESH_TOKEN_SECRET=your_refresh_token_secret_min_32_chars
   ```

   > ⚠️ **Security Note**: Never commit `.env.local` to version control. Use strong, randomly generated secrets for JWT_SECRET (minimum 32 characters). Rotate secrets periodically.

4. **Set up the database**

   Run the SQL schema in your Supabase SQL Editor:

   ```bash
   # 1. Run database/schemas/init.sql
   # 2. Run all files in database/migrations/ in order
   # 3. Run function definitions from database/functions/
   ```

5. **Run the development server**

   ```bash
   npm run dev
   ```

6. **Open the app**

   Visit [http://localhost:3000](http://localhost:3000)

### Scripts

| Command         | Description              |
| --------------- | ------------------------ |
| `npm run dev`   | Start development server |
| `npm run build` | Build for production     |
| `npm run start` | Start production server  |
| `npm run lint`  | Run ESLint               |

## 📁 Project Structure

```
├── app/
│   ├── layout.tsx              # Root layout with metadata
│   ├── page.tsx                # Root page (redirects to /home)
│   ├── globals.css             # Global styles & CSS variables
│   ├── loading.tsx             # Global loading state
│   ├── sitemap.ts              # Dynamic sitemap generator
│   │
│   ├── home/                   # Landing page
│   ├── booking/                # Booking wizard
│   │   ├── components/         # Step components (10 steps)
│   │   ├── contexts/           # Booking context
│   │   ├── new/                # New booking flow
│   │   └── utils/              # Helper utilities
│   ├── confirmation/           # Booking confirmation
│   ├── view-bookings/          # View bookings (secure)
│   ├── my-bookings/            # User booking history
│   ├── edit-booking/           # Edit existing bookings
│   ├── cancel-booking/         # Cancel bookings with verification
│   │
│   ├── admin/                  # Admin section
│   │   ├── login/              # Admin login
│   │   ├── reminders/          # Standalone reminders page
│   │   └── (dashboard)/        # Protected routes
│   │       ├── dashboard/      # Overview stats
│   │       ├── bookings/       # Booking management
│   │       ├── availability/   # Slot management
│   │       ├── staff/          # Staff management
│   │       ├── payments/       # Payment verification
│   │       └── settings/       # Configuration
│   │
│   ├── staff/                  # Staff portal
│   │   ├── login/              # Staff login
│   │   └── (dashboard)/        # Protected staff routes
│   │       ├── dashboard/      # Staff overview
│   │       └── bookings/       # Staff booking management
│   │
│   ├── api/                    # API routes
│   │   ├── auth/               # Authentication endpoints
│   │   │   ├── send-otp/       # Send OTP email
│   │   │   ├── verify-otp/     # Verify OTP code
│   │   │   ├── verify-device/  # Verify trusted device
│   │   │   ├── status/         # Check auth status
│   │   │   ├── auto-login/     # Auto-login for trusted devices
│   │   │   ├── refresh/        # Refresh auth session
│   │   │   └── logout/         # Logout and clear session
│   │   ├── book/               # Booking creation
│   │   ├── bookings/           # Booking operations
│   │   │   ├── cancel/         # Cancel with notification
│   │   │   ├── cancel-silent/  # Silent cancellation
│   │   │   └── upcoming/       # Upcoming bookings
│   │   ├── availability/       # Availability checks
│   │   ├── admin/              # Admin endpoints
│   │   │   ├── login/          # Admin authentication
│   │   │   ├── stats/          # Dashboard statistics
│   │   │   ├── bookings/       # Booking management
│   │   │   ├── availability/   # Availability management
│   │   │   ├── staff/          # Staff CRUD operations
│   │   │   ├── settings/       # Settings management
│   │   │   └── book/           # Admin booking creation
│   │   ├── staff/              # Staff endpoints
│   │   │   ├── login/          # Staff authentication
│   │   │   ├── stats/          # Staff statistics
│   │   │   ├── bookings/       # Staff booking ops
│   │   │   └── book/           # Staff booking creation
│   │   ├── rates/              # Rate card data
│   │   ├── studios/            # Studio information
│   │   ├── settings/           # Public settings
│   │   ├── contact/            # Contact form
│   │   ├── check-user/         # User verification
│   │   └── display/            # Display endpoints
│   │
│   ├── components/             # Shared components
│   │   ├── Navigation.tsx      # Main navigation
│   │   ├── Footer.tsx          # Site footer
│   │   ├── MainContent.tsx     # Main content wrapper
│   │   ├── OTPLogin.tsx        # OTP login component
│   │   ├── OTPVerification.tsx # OTP verification
│   │   └── ClearCache.tsx      # Cache clearing utility
│   │
│   ├── studios/                # Studio information
│   ├── rate-card/              # Pricing display
│   ├── availability/           # Public availability view
│   ├── gallery/                # Photo gallery
│   ├── about/                  # About page
│   ├── contact/                # Contact form
│   ├── review/                 # Review page
│   ├── display/                # Public display page
│   ├── faq/                    # FAQs
│   └── policies/               # Terms & policies
│
├── lib/                        # Utility libraries
│   ├── supabase.ts             # Supabase client (server)
│   ├── supabaseClient.ts       # Supabase client (browser)
│   ├── supabaseServer.ts       # Supabase server utilities
│   ├── supabaseAuth.ts         # Auth utilities
│   ├── googleCalendar.ts       # Google Calendar integration
│   ├── googleSheets.ts         # Google Sheets integration for booking logs
│   ├── email.ts                # Resend email service
│   ├── otpStore.ts             # OTP management
│   ├── tokens.ts               # Auth token management
│   ├── authClient.ts           # Client-side auth utilities
│   ├── deviceFingerprint.ts    # Device fingerprinting
│   ├── OptimizedMotion.tsx     # Performance-optimized animations
│   └── useDevicePerformance.ts # Device performance hook
│
├── database/
│   ├── schemas/                # Base database schema
│   ├── migrations/             # Sequential database migrations
│   └── functions/              # Complex database functions
│
├── scripts/
│   └── get_refresh_token.js    # Google OAuth token helper
│
└── public/                     # Static assets
    ├── favicon.ico             # Favicon
    ├── android-chrome-*.png    # Android icons
    ├── apple-touch-icon.png    # Apple touch icon
    ├── robots.txt              # Robots configuration
    └── site.webmanifest        # PWA manifest
```

## 📚 Documentation

For detailed documentation including:

- Application workflow diagrams
- Color palette reference
- Database schema details
- API endpoint documentation

See [DOCUMENTATION.md](./DOCUMENTATION.md)

## 🔒 Security Features

- **HTTP Security Headers** - HSTS, X-Frame-Options, X-Content-Type-Options, CSP-ready
- **Supabase Auth** for admin and staff authentication
- **Secure booking page access** - Authentication required to view/edit/cancel bookings
- **OTP verification** with bcrypt hashing (10 salt rounds)
- **Cookie-based session management** - Secure HttpOnly cookies for auth tokens
- **Row Level Security (RLS)** policies in Supabase
- **Trusted device management** with device fingerprinting and auto-login
- **Rate limiting** for OTP requests (5 max attempts, 5-minute expiry)
- **Input sanitization** for XSS prevention
- **Audit logging** for all admin actions
- **Environment variable protection** - All secrets in `.env.local`
- **HTTPS enforcement** via Strict-Transport-Security header

## 📄 License

This project is proprietary software developed for Resonance Studio.

## 👨‍💻 Author

**Ashutosh Swamy**

- GitHub: [@ashutoshswamy](https://github.com/ashutoshswamy)

---

_Built for Resonance Studio_
