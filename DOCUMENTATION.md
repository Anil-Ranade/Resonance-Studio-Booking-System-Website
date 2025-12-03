# Resonance Studio Booking System

A modern, full-stack studio booking application built for Resonance Studio. This application allows customers to book music studio sessions, manage their bookings, and provides an admin dashboard for studio management.

---

## 📋 Table of Contents

- [Tech Stack](#-tech-stack)
- [Application Workflow](#-application-workflow)
- [Color Palette](#-color-palette)
- [Project Structure](#-project-structure)
- [Features](#-features)
- [Database Schema](#-database-schema)
- [API Endpoints](#-api-endpoints)
- [Environment Variables](#-environment-variables)
- [Security](#-security)

---

## 🛠 Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.0.4 | React framework with App Router |
| **React** | 19.2.0 | UI library |
| **TypeScript** | ^5 | Type-safe JavaScript |
| **Tailwind CSS** | ^4 | Utility-first CSS framework |
| **Framer Motion** | ^12.23.24 | Animation library |
| **Lucide React** | ^0.554.0 | Icon library |

### Backend
| Technology | Purpose |
|------------|---------|
| **Next.js API Routes** | RESTful API endpoints |
| **Supabase** | PostgreSQL database & authentication |
| **Google Calendar API** | Calendar integration for bookings |
| **Twilio** | SMS notifications & OTP verification |

### Authentication & Security
| Technology | Purpose |
|------------|---------|
| **JWT (jsonwebtoken)** | Token-based admin authentication |
| **bcryptjs** | Password/OTP hashing |
| **OTP-based Auth** | Phone number verification |
| **Device Fingerprinting** | Trusted device management |

### Development Tools
| Technology | Purpose |
|------------|---------|
| **ESLint** | Code linting |
| **PostCSS** | CSS processing |
| **TypeScript** | Type checking |

---

## 🔄 Application Workflow

### Customer Booking Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CUSTOMER JOURNEY                               │
└─────────────────────────────────────────────────────────────────────────┘

    ┌──────────┐     ┌──────────────┐     ┌─────────────────┐
    │  Home    │────▶│  Choose      │────▶│  Configure      │
    │  Page    │     │  Session     │     │  Session        │
    └──────────┘     │  Type        │     │  Details        │
                     └──────────────┘     └────────┬────────┘
                                                   │
                                                   ▼
    ┌──────────┐     ┌──────────────┐     ┌─────────────────┐
    │  Select  │◀────│  Choose      │◀────│  Select Date    │
    │  Studio  │     │  Time Slot   │     │  & View         │
    └────┬─────┘     └──────────────┘     │  Availability   │
         │                                └─────────────────┘
         ▼
    ┌──────────────┐     ┌──────────────┐     ┌─────────────────┐
    │  Enter Phone │────▶│  Verify OTP  │────▶│  Review &       │
    │  Number      │     │  (SMS)       │     │  Confirm        │
    └──────────────┘     └──────────────┘     └────────┬────────┘
                                                       │
                                                       ▼
    ┌──────────────────────────────────────────────────────────────────┐
    │  ✅ Booking Confirmed + SMS Sent + Calendar Event Created        │
    └──────────────────────────────────────────────────────────────────┘
```

### Step-by-Step Booking Process

1. **Home Page (`/home`)**
   - Browse studio information and services
   - View available session types
   - Access quick booking actions

2. **Session Selection (`/booking`)**
   - Choose session type:
     - 🎤 **Karaoke** - Sing along with friends (up to 30 people)
     - 🎵 **Live with Musicians** - Live performance session (up to 12 people)
     - 🥁 **Only Drum Practice** - Solo drum practice
     - 🎸 **Band** - Full band rehearsal with equipment options
     - 📻 **Recording** - Audio/Video/Chroma Key packages

3. **Configure Session Details**
   - Select participant count (varies by session type)
   - Choose equipment needs (for Band sessions):
     - Drum Only
     - Drum + Amps
     - Drum + Amps + Guitars
     - Full Setup
   - Select recording options (for Recording sessions):
     - Audio Recording
     - Video Recording
     - Chroma Key Recording
     - SD Card Recording

4. **Date & Time Selection**
   - View availability calendar
   - Select available time slots (1-8 hours)
   - Real-time availability checking
   - 30-day advance booking limit

5. **Studio Selection**
   - System auto-suggests appropriate studio based on:
     - Group size
     - Session type
     - Studio capacity
   - Manual studio selection available

6. **Phone Verification**
   - Enter 10-digit phone number
   - Receive 6-digit OTP via SMS (Twilio)
   - OTP expires in 5 minutes
   - Verify OTP to confirm identity
   - Trusted device option for faster future logins

7. **Review & Confirmation**
   - Review all booking details
   - View calculated pricing
   - Confirm booking

8. **Booking Confirmation**
   - Booking saved to database
   - Google Calendar event created
   - SMS confirmation sent
   - Redirect to confirmation page with details

### Admin Workflow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           ADMIN DASHBOARD                                │
└─────────────────────────────────────────────────────────────────────────┘

    ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
    │    Login     │────▶│  Dashboard   │────▶│   Manage     │
    │   (JWT)      │     │  Overview    │     │   Bookings   │
    └──────────────┘     └──────────────┘     └──────────────┘
                               │
           ┌───────────────────┼───────────────────┐
           ▼                   ▼                   ▼
    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
    │ Availability │    │   Booking    │    │   Settings   │
    │  Management  │    │   History    │    │  & Config    │
    └──────────────┘    └──────────────┘    └──────────────┘
           │                   │                   │
           ▼                   ▼                   ▼
    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
    │ Block/Unblock│    │ View/Cancel/ │    │ Min/Max Hours│
    │ Time Slots   │    │ Confirm      │    │ Buffer Time  │
    │ Bulk Ops     │    │ Bookings     │    │ Advance Days │
    └──────────────┘    └──────────────┘    └──────────────┘
```

### Admin Features

- **Dashboard** (`/admin/dashboard`)
  - Total bookings count
  - Revenue statistics
  - Today's bookings
  - Recent booking activity

- **Bookings** (`/admin/bookings`)
  - View all bookings with filters
  - Confirm pending bookings
  - Cancel bookings
  - View booking details

- **Availability** (`/admin/availability`)
  - Block specific time slots
  - Unblock time slots
  - Bulk availability management
  - Per-studio availability control

- **Settings** (`/admin/settings`)
  - Minimum booking duration (hours)
  - Maximum booking duration (hours)
  - Booking buffer time (minutes)
  - Advance booking days limit
  - Operating hours configuration

---

## 🎨 Color Palette

### Primary Colors

| Color Name | Hex Code | Usage |
|------------|----------|-------|
| **Primary** | `#8b5cf6` | Main brand color, buttons, accents |
| **Primary Light** | `#a78bfa` | Hover states, highlights |
| **Primary Dark** | `#7c3aed` | Active states, emphasis |

### Accent Colors

| Color Name | Hex Code | Usage |
|------------|----------|-------|
| **Accent** | `#f59e0b` | Call-to-action, highlights |
| **Accent Light** | `#fbbf24` | Hover states |
| **Accent Dark** | `#d97706` | Active states |

### Background Colors

| Color Name | Hex Code / Value | Usage |
|------------|------------------|-------|
| **Background Dark** | `#0f0f1a` | Main background |
| **Background Darker** | `#080810` | Secondary background |
| **Card Background** | `rgba(255, 255, 255, 0.03)` | Card surfaces |
| **Card Hover** | `rgba(255, 255, 255, 0.06)` | Card hover states |

### Text Colors

| Color Name | Hex Code | Usage |
|------------|----------|-------|
| **Text Primary** | `#ffffff` | Main text |
| **Text Secondary** | `#a1a1aa` | Secondary text |
| **Text Muted** | `#71717a` | Muted/disabled text |

### Border Colors

| Color Name | Value | Usage |
|------------|-------|-------|
| **Border Light** | `rgba(255, 255, 255, 0.1)` | Subtle borders |
| **Border Medium** | `rgba(255, 255, 255, 0.15)` | Visible borders |

### Gradients

| Gradient Name | Value | Usage |
|---------------|-------|-------|
| **Primary Gradient** | `linear-gradient(135deg, #667eea 0%, #764ba2 100%)` | Buttons, highlights |
| **Accent Gradient** | `linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)` | CTAs, emphasis |
| **Background Gradient** | `linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)` | Page background |

### Visual Color Reference

```
Primary Colors:
█████ #8b5cf6 (Primary)
█████ #a78bfa (Primary Light)
█████ #7c3aed (Primary Dark)

Accent Colors:
█████ #f59e0b (Accent)
█████ #fbbf24 (Accent Light)
█████ #d97706 (Accent Dark)

Background Colors:
█████ #0f0f1a (Dark)
█████ #080810 (Darker)

Text Colors:
█████ #ffffff (Primary)
█████ #a1a1aa (Secondary)
█████ #71717a (Muted)
```

---

## 📁 Project Structure

```
├── app/
│   ├── layout.tsx              # Root layout with metadata
│   ├── page.tsx                # Root page (redirects to /home)
│   ├── loading.tsx             # Global loading state
│   ├── globals.css             # Global styles & CSS variables
│   │
│   ├── home/                   # Landing page
│   │   ├── page.tsx
│   │   └── loading.tsx
│   │
│   ├── booking/                # Booking flow
│   │   ├── page.tsx            # Main booking page
│   │   ├── layout.tsx          # Booking layout
│   │   ├── components/         # Step components
│   │   │   ├── SessionStep.tsx       # Session type selection
│   │   │   ├── ParticipantsStep.tsx  # Participant configuration
│   │   │   ├── TimeStep.tsx          # Date/time selection
│   │   │   ├── StudioStep.tsx        # Studio selection
│   │   │   ├── PhoneStep.tsx         # Phone number input
│   │   │   ├── OTPStep.tsx           # OTP verification
│   │   │   ├── ReviewStep.tsx        # Review booking
│   │   │   ├── ConfirmStep.tsx       # Confirmation
│   │   │   └── StepLayout.tsx        # Step wrapper
│   │   ├── contexts/
│   │   │   └── BookingContext.tsx    # Booking state management
│   │   └── utils/
│   │       └── studioSuggestion.ts   # Studio recommendation logic
│   │
│   ├── confirmation/           # Booking confirmation page
│   ├── my-bookings/            # User booking history
│   ├── view-bookings/          # View bookings (alternative)
│   ├── login/                  # User login page
│   │
│   ├── admin/                  # Admin section
│   │   ├── layout.tsx          # Admin layout
│   │   ├── page.tsx            # Admin root (redirects)
│   │   ├── login/              # Admin login
│   │   │   └── page.tsx
│   │   └── (dashboard)/        # Protected admin routes
│   │       ├── layout.tsx      # Dashboard layout with nav
│   │       ├── dashboard/      # Overview stats
│   │       ├── bookings/       # Booking management
│   │       ├── availability/   # Slot management
│   │       └── settings/       # System settings
│   │
│   ├── api/                    # API routes
│   │   ├── auth/               # Authentication
│   │   │   ├── send-otp/       # Send OTP SMS
│   │   │   ├── verify-otp/     # Verify OTP code
│   │   │   └── verify-device/  # Device verification
│   │   ├── book/               # Create booking
│   │   ├── bookings/           # Booking operations
│   │   │   ├── route.ts        # Get bookings
│   │   │   ├── cancel/         # Cancel booking
│   │   │   ├── cancel-silent/  # Silent cancellation
│   │   │   └── upcoming/       # Upcoming bookings
│   │   ├── availability/       # Check availability
│   │   ├── check-user/         # User verification
│   │   ├── contact/            # Contact form
│   │   ├── rates/              # Rate card data
│   │   ├── settings/           # Public settings
│   │   ├── studios/            # Studio information
│   │   ├── display/            # Display endpoints
│   │   │   └── bookings/
│   │   └── admin/              # Admin-only endpoints
│   │       ├── login/          # Admin authentication
│   │       ├── stats/          # Dashboard statistics
│   │       ├── bookings/       # Booking management
│   │       ├── availability/   # Availability management
│   │       ├── settings/       # Settings management
│   │       └── book/           # Admin booking creation
│   │
│   ├── display/                # Public display page
│   ├── studios/                # Studio information page
│   ├── rate-card/              # Pricing display
│   ├── availability/           # Public availability view
│   ├── gallery/                # Photo gallery
│   ├── about/                  # About page
│   ├── contact/                # Contact form
│   ├── review/                 # Review page
│   ├── faq/                    # FAQs
│   └── policies/               # Terms & policies
│
├── components/                 # Shared components
│   ├── Navigation.tsx          # Main navigation
│   └── OTPLogin.tsx            # OTP login component
│
├── lib/                        # Utility libraries
│   ├── supabase.ts             # Supabase client (server)
│   ├── supabaseClient.ts       # Supabase client (browser)
│   ├── supabaseServer.ts       # Supabase server utilities
│   ├── supabaseAuth.ts         # Auth utilities
│   ├── googleCalendar.ts       # Google Calendar integration
│   ├── google-calendar.ts      # Alternative calendar utils
│   ├── sms.ts                  # Twilio SMS service
│   ├── otpStore.ts             # OTP management
│   ├── deviceFingerprint.ts    # Device fingerprinting
│   ├── OptimizedMotion.tsx     # Performance-optimized animations
│   └── useDevicePerformance.ts # Device performance hook
│
├── database/
│   ├── schema.sql              # Main database schema (711 lines)
│   └── devices.sql             # Trusted devices schema
│
├── scripts/
│   └── get_refresh_token.js    # Google OAuth token helper
│
└── public/                     # Static assets
    ├── favicon.ico
    ├── android-chrome-*.png
    ├── apple-touch-icon.png
    └── site.webmanifest
```

---

## ✨ Features

### Customer Features
- ✅ Interactive multi-step booking wizard
- ✅ Real-time availability checking
- ✅ Multiple session types (Karaoke, Band, Recording, etc.)
- ✅ Smart studio suggestions based on group size
- ✅ OTP-based phone verification
- ✅ SMS booking confirmations
- ✅ Trusted device management for faster logins
- ✅ View and cancel bookings
- ✅ Responsive design (mobile-first)
- ✅ Smooth animations with reduced motion support

### Admin Features
- ✅ Secure JWT-based admin authentication
- ✅ Dashboard with booking statistics & revenue
- ✅ Booking management (confirm, cancel, view details)
- ✅ Availability slot management (block/unblock)
- ✅ Bulk availability operations
- ✅ Configurable booking settings
- ✅ Audit logging for all actions

### Technical Features
- ✅ Google Calendar integration (auto-create events)
- ✅ Twilio SMS notifications
- ✅ Supabase PostgreSQL database with RLS
- ✅ JWT authentication for admins
- ✅ Device fingerprinting for trusted devices
- ✅ Smooth animations (Framer Motion)
- ✅ Accessibility support (reduced motion)
- ✅ Performance-optimized motion components

---

## 🗄 Database Schema

### Core Tables

| Table | Purpose |
|-------|---------|
| `studios` | Studio information (name, type, capacity, hourly rates, amenities) |
| `users` | Customer information (phone, name, email, verification status) |
| `admin_users` | Admin user accounts (roles: admin, super_admin, staff) |
| `bookings` | All booking records with status tracking |
| `availability_slots` | Blocked time slots per studio |
| `booking_settings` | System configuration (min/max hours, buffer, etc.) |
| `login_otps` | OTP verification records (bcrypt hashed) |
| `reminders` | Scheduled booking reminders |
| `rate_cards` | Pricing per studio, session type, and sub-option |
| `audit_logs` | Admin action tracking for accountability |
| `contact_submissions` | Contact form submissions |
| `trusted_devices` | Verified device fingerprints |

### Database Features
- UUID primary keys throughout
- Row Level Security (RLS) policies
- Automatic timestamps (created_at, updated_at)
- Indexed columns for performance
- Constraint validation (time ranges, statuses)

---

## 🔌 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/send-otp` | Send OTP to phone number |
| `POST` | `/api/auth/verify-otp` | Verify OTP code |
| `POST` | `/api/auth/verify-device` | Verify trusted device |

### Bookings

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/bookings` | Get user's bookings |
| `POST` | `/api/book` | Create new booking |
| `POST` | `/api/bookings/cancel` | Cancel booking with notification |
| `POST` | `/api/bookings/cancel-silent` | Cancel booking silently |
| `GET` | `/api/bookings/upcoming` | Get upcoming bookings |

### Availability

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/availability` | Check studio availability |
| `GET` | `/api/studios` | Get studio information |
| `GET` | `/api/rates` | Get rate card data |

### Public

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/settings` | Get public booking settings |
| `POST` | `/api/contact` | Submit contact form |
| `POST` | `/api/check-user` | Check if user exists |

### Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/admin/login` | Admin authentication |
| `GET` | `/api/admin/stats` | Dashboard statistics |
| `GET` | `/api/admin/bookings` | Get all bookings |
| `PUT` | `/api/admin/bookings` | Update booking status |
| `GET` | `/api/admin/availability` | Get blocked slots |
| `POST` | `/api/admin/availability` | Block time slots |
| `DELETE` | `/api/admin/availability` | Unblock time slots |
| `GET` | `/api/admin/settings` | Get all settings |
| `PUT` | `/api/admin/settings` | Update settings |
| `POST` | `/api/admin/book` | Admin creates booking |

---

## ⚙️ Environment Variables

```env
# ===================
# SUPABASE
# ===================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# ===================
# TWILIO SMS
# ===================
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890

# ===================
# GOOGLE CALENDAR
# ===================
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REFRESH_TOKEN=your_refresh_token
GOOGLE_CALENDAR_ID=your_calendar_id

# ===================
# JWT SECRETS
# ===================
JWT_SECRET=your_jwt_secret_for_users
ADMIN_JWT_SECRET=your_admin_jwt_secret

# ===================
# APP CONFIG
# ===================
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🔒 Security

### Authentication
- **Customer Auth**: Phone-based OTP verification
  - 6-digit OTP sent via Twilio SMS
  - OTP expires in 5 minutes
  - Maximum 3 verification attempts
  - Bcrypt-hashed OTP storage
  
- **Admin Auth**: JWT-based authentication
  - Secure password hashing
  - Token-based session management
  - Protected API routes

### Database Security
- Row Level Security (RLS) policies on all tables
- Users can only view/edit their own data
- Admins have elevated access via policy checks
- Service role key for server-side operations only

### Device Trust
- Device fingerprinting for trusted devices
- Skip OTP for verified devices
- Device trust can be revoked

### Rate Limiting
- OTP request cooldown (60 seconds)
- Maximum attempts before lockout
- Audit logging for security events

---

## 📱 Session Types & Pricing

### Session Type Details

| Session Type | Max Capacity | Equipment | Studios |
|--------------|--------------|-----------|---------|
| **Karaoke** | 30 people | Sound system | A, B, C |
| **Live with Musicians** | 12 people | Full setup | A, B, C |
| **Only Drum Practice** | 1 person | Drums only | A |
| **Band** | 6 people | Configurable | A, B, C |
| **Recording** | 4 people | Pro equipment | A |

### Band Equipment Options
- Drum Only (₹350-400/hr)
- Drum + Amps (₹400-500/hr)
- Drum + Amps + Guitars (₹450-600/hr)
- Full Setup (₹600/hr)

### Recording Options
- Audio Recording (₹700/hr)
- Video Recording (₹800/hr)
- Chroma Key (₹1200/hr)
- SD Card Recording (₹100 add-on)

---

## 🎨 Color Palette Reference

See the [Color Palette section](#-color-palette) above for the complete design system including:
- Primary colors (Purple: `#8b5cf6`)
- Accent colors (Amber: `#f59e0b`)
- Background colors (Dark theme)
- Text colors (White to muted grays)
- Gradient definitions

---

## 📞 Support

For technical support or questions about the booking system, please contact:
- **Developer**: Ashutosh Swamy
- **GitHub**: [@ashutoshswamy](https://github.com/ashutoshswamy)

---

*Last updated: December 2025*

*Built with ❤️ for Resonance Studio*
