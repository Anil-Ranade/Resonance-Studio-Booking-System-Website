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

| Technology        | Version   | Purpose                         |
| ----------------- | --------- | ------------------------------- |
| **Next.js**       | 16.0.10   | React framework with App Router |
| **React**         | 19.2.0    | UI library                      |
| **TypeScript**    | ^5        | Type-safe JavaScript            |
| **Tailwind CSS**  | ^4        | Utility-first CSS framework     |
| **Framer Motion** | ^12.23.24 | Animation library               |
| **Lucide React**  | ^0.554.0  | Icon library                    |

### Backend

| Technology              | Purpose                                |
| ----------------------- | -------------------------------------- |
| **Next.js API Routes**  | RESTful API endpoints                  |
| **Supabase**            | PostgreSQL database & authentication   |
| **Google Calendar API** | Calendar integration for bookings      |
| **Google Sheets API**   | Booking logs & reporting               |
| **Resend**              | Email notifications & OTP verification |

### Authentication & Security

| Technology                | Purpose                         |
| ------------------------- | ------------------------------- |
| **Supabase Auth**         | Admin & Staff authentication    |
| **bcryptjs**              | Password/OTP hashing            |
| **OTP-based Auth**        | Email verification (via Resend) |
| **Device Fingerprinting** | Trusted device management       |
| **Cookie Sessions**       | Secure HttpOnly auth tokens     |
| **Auto-login**            | Seamless trusted device access  |

### Development Tools

| Technology     | Purpose        |
| -------------- | -------------- |
| **ESLint**     | Code linting   |
| **PostCSS**    | CSS processing |
| **TypeScript** | Type checking  |

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
    │  & Email     │     │  (Email)     │     │  Confirm        │
    └──────────────┘     └──────────────┘     └────────┬────────┘
                                                       │
                                                       ▼
    ┌──────────────────────────────────────────────────────────────────┐
    │  ✅ Booking Confirmed + Email Sent + Calendar Event Created      │
    │     + Logged to Google Sheets                                    │
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

6. **Phone & Email Verification**

   - Enter phone number and email address
   - Receive 6-digit OTP via Email (Resend)
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
   - Email confirmation sent
   - Booking logged to Google Sheets
   - Redirect to confirmation page with details

### Admin Workflow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           ADMIN DASHBOARD                                │
└─────────────────────────────────────────────────────────────────────────┘

    ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
    │    Login     │────▶│  Dashboard   │────▶│   Manage     │
    │ (Supabase)  │     │  Overview    │     │   Bookings   │
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
  - Cancel bookings
  - Mark bookings as completed or no_show
  - View booking details
  - **Send WhatsApp messages** to customers with pre-filled booking details

- **Create Booking** (`/admin/booking`)

  - Create bookings on behalf of customers
  - Walk-in customer support
  - Duplicate booking prevention
  - Email notifications marked as "created by team"

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

### Edit Booking Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           EDIT BOOKING FLOW                            │
└─────────────────────────────────────────────────────────────────────────┘

    ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
    │ Enter Email  │────▶│ View Bookings│────▶│ Select to    │
    │              │     │              │     │ Edit         │
    └──────────────┘     └──────────────┘     └──────────────┘
                                                     │
                                                     ▼
    ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
    │  Edit Done   │◀────│  Redirect to │◀────│  Verify OTP  │
    │              │     │  Booking     │     │              │
    └──────────────┘     └──────────────┘     └──────────────┘
```

**Edit Restrictions:**

- Confirmed bookings: Can edit up to 48 hours before
- Cancelled/completed/no_show: Cannot edit

### Cancel Booking Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CANCEL BOOKING FLOW                            │
└─────────────────────────────────────────────────────────────────────────┘

    ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
    │ Enter Email  │────▶│ View Bookings│────▶│ Select to    │
    │              │     │              │     │ Cancel       │
    └──────────────┘     └──────────────┘     └──────────────┘
                                                     │
                                                     ▼
    ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
    │  Cancelled   │◀────│  Confirm     │◀────│  Verify OTP  │
    │  + Email     │     │  Cancellation│     │              │
    └──────────────┘     └──────────────┘     └──────────────┘
```

**Cancel Restrictions:**

- Same time restrictions as edit booking
- Email confirmation sent upon cancellation

### Staff Portal Workflow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           STAFF PORTAL                                 │
└─────────────────────────────────────────────────────────────────────────┘

    ┌──────────────┐     ┌──────────────┐
    │    Login     │────▶│  Dashboard   │
    │ (Supabase)   │     │  Overview    │
    └──────────────┘     └──────────────┘
                               │
              ┌───────────────┴───────────────┐
              ▼                               ▼
        ┌──────────────┐               ┌──────────────┐
        │   Manage     │               │   Create     │
        │   Bookings   │               │   Booking    │
        └──────────────┘               └──────────────┘
              │
              ▼
         ┌──────────────┐
         │   WhatsApp   │
         │   Customer   │
         └──────────────┘
```

### Staff Features

- **Dashboard** (`/staff/dashboard`)

  - Booking statistics
  - Today's bookings overview
  - Quick actions

- **Bookings** (`/staff/bookings`)
  - View all bookings
  - Filter and search bookings
  - Create new bookings for walk-in customers
  - Send WhatsApp messages to customers

### Admin Staff Management

- **Staff Management** (`/admin/staff`)
  - Create new staff members
  - View and manage existing staff
  - Deactivate staff accounts
  - Reset staff passwords

---

## 🎨 Color Palette

### Primary Colors

| Color Name        | Hex Code  | Usage                              |
| ----------------- | --------- | ---------------------------------- |
| **Primary**       | `#8b5cf6` | Main brand color, buttons, accents |
| **Primary Light** | `#a78bfa` | Hover states, highlights           |
| **Primary Dark**  | `#7c3aed` | Active states, emphasis            |

### Accent Colors

| Color Name       | Hex Code  | Usage                      |
| ---------------- | --------- | -------------------------- |
| **Accent**       | `#f59e0b` | Call-to-action, highlights |
| **Accent Light** | `#fbbf24` | Hover states               |
| **Accent Dark**  | `#d97706` | Active states              |

### Background Colors

| Color Name            | Hex Code / Value            | Usage                |
| --------------------- | --------------------------- | -------------------- |
| **Background Dark**   | `#0f0f1a`                   | Main background      |
| **Background Darker** | `#080810`                   | Secondary background |
| **Card Background**   | `rgba(255, 255, 255, 0.03)` | Card surfaces        |
| **Card Hover**        | `rgba(255, 255, 255, 0.06)` | Card hover states    |

### Text Colors

| Color Name         | Hex Code  | Usage               |
| ------------------ | --------- | ------------------- |
| **Text Primary**   | `#ffffff` | Main text           |
| **Text Secondary** | `#a1a1aa` | Secondary text      |
| **Text Muted**     | `#71717a` | Muted/disabled text |

### Border Colors

| Color Name        | Value                       | Usage           |
| ----------------- | --------------------------- | --------------- |
| **Border Light**  | `rgba(255, 255, 255, 0.1)`  | Subtle borders  |
| **Border Medium** | `rgba(255, 255, 255, 0.15)` | Visible borders |

### Gradients

| Gradient Name           | Value                                                            | Usage               |
| ----------------------- | ---------------------------------------------------------------- | ------------------- |
| **Primary Gradient**    | `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`              | Buttons, highlights |
| **Accent Gradient**     | `linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)`              | CTAs, emphasis      |
| **Background Gradient** | `linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)` | Page background     |

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
│   ├── sitemap.ts              # Dynamic sitemap generator
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
│   │   │   ├── PhoneStep.tsx         # Phone/email input
│   │   │   ├── OTPStep.tsx           # OTP verification
│   │   │   ├── ReviewStep.tsx        # Review booking
│   │   │   ├── ConfirmStep.tsx       # Confirmation
│   │   │   ├── StepLayout.tsx        # Step wrapper
│   │   │   └── index.ts              # Component exports
│   │   ├── new/                      # New booking flow
│   │   ├── contexts/
│   │   │   └── BookingContext.tsx    # Booking state management
│   │   └── utils/
│   │       └── studioSuggestion.ts   # Studio recommendation logic
│   │
│   ├── confirmation/           # Booking confirmation page
│   ├── view-bookings/          # View bookings (secure auth required)
│   ├── my-bookings/            # User booking history
│   ├── edit-booking/           # Edit existing bookings with OTP
│   ├── cancel-booking/         # Cancel bookings with verification
│   │
│   ├── admin/                  # Admin section
│   │   ├── layout.tsx          # Admin layout
│   │   ├── page.tsx            # Admin root (redirects)
│   │   ├── login/              # Admin login
│   │   │   └── page.tsx
│   │   └── (dashboard)/        # Protected admin routes
│   │       ├── layout.tsx      # Dashboard layout with nav
│   │       ├── dashboard/      # Overview stats
│   │       ├── bookings/       # Booking management + WhatsApp
│   │       ├── availability/   # Slot management
│   │       ├── staff/          # Staff management
│   │       └── settings/       # System settings
│   │
│   ├── staff/                  # Staff portal section
│   │   ├── layout.tsx          # Staff layout
│   │   ├── page.tsx            # Staff root (redirects)
│   │   ├── login/              # Staff login
│   │   │   └── page.tsx
│   │   └── (dashboard)/        # Protected staff routes
│   │       ├── layout.tsx      # Staff dashboard layout
│   │       ├── dashboard/      # Staff overview stats
│   │       └── bookings/       # Staff booking management
│   │
│   ├── api/                    # API routes
│   │   ├── auth/               # Authentication
│   │   │   ├── send-otp/       # Send OTP email
│   │   │   ├── verify-otp/     # Verify OTP code
│   │   │   ├── verify-device/  # Device verification
│   │   │   ├── status/         # Check auth status
│   │   │   ├── auto-login/     # Auto-login for trusted devices
│   │   │   ├── refresh/        # Refresh auth session
│   │   │   └── logout/         # Logout and clear session
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
│   │   ├── admin/              # Admin-only endpoints
│   │   │   ├── login/          # Admin authentication
│   │   │   ├── stats/          # Dashboard statistics
│   │   │   ├── bookings/       # Booking management
│   │   │   ├── availability/   # Availability management
│   │   │   ├── staff/          # Staff CRUD operations
│   │   │   ├── settings/       # Settings management
│   │   │   └── book/           # Admin booking creation
│   │   └── staff/              # Staff-only endpoints
│   │       ├── login/          # Staff authentication
│   │       ├── stats/          # Staff dashboard statistics
│   │       ├── bookings/       # Staff booking operations
│   │       └── book/           # Staff booking creation
│   │
│   ├── components/             # Shared components
│   │   ├── Navigation.tsx      # Main navigation
│   │   ├── Footer.tsx          # Site footer
│   │   ├── MainContent.tsx     # Main content wrapper
│   │   ├── OTPLogin.tsx        # OTP login component
│   │   ├── OTPVerification.tsx # OTP verification component
│   │   └── ClearCache.tsx      # Cache clearing utility
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
│   ├── full_schema.sql         # Complete database schema with RLS
│   └── migrations/             # Database migrations
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

---

## ✨ Features

### Customer Features

- ✅ Interactive multi-step booking wizard
- ✅ Real-time availability checking
- ✅ Multiple session types (Karaoke, Band, Recording, etc.)
- ✅ Smart studio suggestions based on group size
- ✅ OTP-based email verification
- ✅ Email booking confirmations
- ✅ Trusted device management for faster logins
- ✅ View and cancel bookings
- ✅ Edit bookings with OTP verification
- ✅ Cancel bookings with OTP verification
- ✅ Duplicate booking prevention
- ✅ Responsive design (mobile-first)
- ✅ Smooth animations with reduced motion support

### Admin Features

- ✅ Secure Supabase Auth admin authentication
- ✅ Dashboard with booking statistics & revenue
- ✅ Booking management (confirm, cancel, no_show, view details)
- ✅ Admin booking creation for walk-in customers
- ✅ WhatsApp reminder messages (24-hour time window before booking)
- ✅ Invoice printing for bookings
- ✅ Booking restore (uncancel/un-no-show) and delete
- ✅ Staff management (create, update, deactivate)
- ✅ Availability slot management (block/unblock)
- ✅ Bulk availability operations
- ✅ Configurable booking settings
- ✅ Audit logging for all actions

### Staff Features

- ✅ Separate staff authentication (Supabase Auth)
- ✅ Staff dashboard with booking statistics
- ✅ Staff booking management
- ✅ Staff booking creation for walk-in customers
- ✅ Invoice printing for bookings
- ✅ Booking deletion (cancelled/no-show bookings)

### Technical Features

- ✅ Google Calendar integration (auto-create events)
- ✅ Google Sheets integration (booking logs & reporting)
- ✅ Email notifications via Resend
- ✅ Supabase PostgreSQL database with RLS
- ✅ JWT authentication for admins
- ✅ Device fingerprinting for trusted devices
- ✅ Smooth animations (Framer Motion)
- ✅ Accessibility support (reduced motion)
- ✅ Performance-optimized motion components
- ✅ SEO optimization (structured data, sitemap, meta tags)

### Email Notification Types

| Email Type                     | Purpose                                   |
| ------------------------------ | ----------------------------------------- |
| **OTP Verification**           | 6-digit code for login verification       |
| **Booking Confirmation**       | Confirmation of new booking with details  |
| **Admin Booking Confirmation** | Confirmation for bookings created by team |
| **Booking Update**             | Notification when booking is modified     |
| **Booking Cancellation**       | Confirmation of cancelled booking         |

---

## 🗄 Database Schema

### Core Tables

| Table                | Purpose                                                            |
| -------------------- | ------------------------------------------------------------------ |
| `studios`            | Studio information (name, type, capacity, hourly rates, amenities) |
| `users`              | Customer information (phone, name, email, verification status)     |
| `admin_users`        | Admin user accounts (roles: admin, super_admin, staff)             |
| `bookings`           | All booking records with status tracking                           |
| `availability_slots` | Blocked time slots per studio                                      |
| `booking_settings`   | System configuration (min/max hours, buffer, etc.)                 |
| `login_otps`         | OTP verification records (bcrypt hashed)                           |
| `rate_cards`         | Pricing per studio, session type, and sub-option                   |
| `audit_logs`         | Admin action tracking for accountability                           |
| `trusted_devices`    | Verified device fingerprints                                       |

### Database Features

- UUID primary keys throughout
- Row Level Security (RLS) policies
- Automatic timestamps (created_at, updated_at)
- Indexed columns for performance
- Constraint validation (time ranges, statuses)

---

## 🔌 API Endpoints

### Authentication

| Method | Endpoint                  | Description                    |
| ------ | ------------------------- | ------------------------------ |
| `POST` | `/api/auth/send-otp`      | Send OTP to email address      |
| `POST` | `/api/auth/verify-otp`    | Verify OTP code                |
| `POST` | `/api/auth/verify-device` | Verify trusted device          |
| `GET`  | `/api/auth/status`        | Check authentication status    |
| `POST` | `/api/auth/auto-login`    | Auto-login for trusted devices |
| `POST` | `/api/auth/refresh`       | Refresh auth session token     |
| `POST` | `/api/auth/logout`        | Logout and clear session       |

### Bookings

| Method | Endpoint                      | Description                      |
| ------ | ----------------------------- | -------------------------------- |
| `GET`  | `/api/bookings`               | Get user's bookings              |
| `POST` | `/api/book`                   | Create new booking               |
| `POST` | `/api/bookings/cancel`        | Cancel booking with notification |
| `POST` | `/api/bookings/cancel-silent` | Cancel booking silently          |
| `GET`  | `/api/bookings/upcoming`      | Get upcoming bookings            |

### Availability

| Method | Endpoint            | Description               |
| ------ | ------------------- | ------------------------- |
| `GET`  | `/api/availability` | Check studio availability |
| `GET`  | `/api/studios`      | Get studio information    |
| `GET`  | `/api/rates`        | Get rate card data        |

### Public

| Method | Endpoint              | Description                    |
| ------ | --------------------- | ------------------------------ |
| `GET`  | `/api/settings`       | Get public booking settings    |
| `POST` | `/api/contact`        | Submit contact form            |
| `POST` | `/api/check-user`     | Check if user exists           |
| `GET`  | `/api/display/bookings` | Get bookings for display page |

### Admin

| Method   | Endpoint                  | Description           |
| -------- | ------------------------- | --------------------- |
| `POST`   | `/api/admin/login`        | Admin authentication  |
| `GET`    | `/api/admin/stats`        | Dashboard statistics  |
| `GET`    | `/api/admin/bookings`     | Get all bookings      |
| `PUT`    | `/api/admin/bookings`     | Update booking status |
| `GET`    | `/api/admin/availability` | Get blocked slots     |
| `POST`   | `/api/admin/availability` | Block time slots      |
| `DELETE` | `/api/admin/availability` | Unblock time slots    |
| `GET`    | `/api/admin/settings`     | Get all settings      |
| `PUT`    | `/api/admin/settings`     | Update settings       |
| `POST`   | `/api/admin/book`         | Admin creates booking |
| `POST`   | `/api/admin/whatsapp-reminder` | Mark reminder sent |

### Staff

| Method | Endpoint              | Description                |
| ------ | --------------------- | -------------------------- |
| `POST` | `/api/staff/login`    | Staff authentication       |
| `GET`  | `/api/staff/stats`    | Staff dashboard statistics |
| `GET`  | `/api/staff/bookings` | Get bookings for staff     |
| `POST` | `/api/staff/book`     | Staff creates booking      |

### Admin Staff Management

| Method   | Endpoint           | Description             |
| -------- | ------------------ | ----------------------- |
| `GET`    | `/api/admin/staff` | Get all staff members   |
| `POST`   | `/api/admin/staff` | Create new staff member |
| `PUT`    | `/api/admin/staff` | Update staff member     |
| `DELETE` | `/api/admin/staff` | Deactivate staff member |

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
# EMAIL (RESEND)
# ===================
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=noreply@yourdomain.com

# ===================
# GOOGLE CALENDAR
# ===================
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REFRESH_TOKEN=your_refresh_token
GOOGLE_CALENDAR_ID=your_calendar_id

GOOGLE_SHEET_ID=your_google_sheet_id

# ===================
# JWT SECRETS
# ===================
# Use strong, random strings - minimum 32 characters
# Generate with: openssl rand -base64 32
JWT_SECRET=your_jwt_secret_min_32_chars_random
REFRESH_TOKEN_SECRET=your_refresh_token_secret_min_32_chars_random

# ===================
# APP CONFIG
# ===================
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Environment Variable Security Notes

| Variable                    | Exposure    | Notes                               |
| --------------------------- | ----------- | ----------------------------------- |
| `NEXT_PUBLIC_*`             | Client-side | Safe to expose, limited permissions |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only | **Never expose** - bypasses RLS     |
| `RESEND_API_KEY`            | Server-only | Email sending access if leaked      |
| `GOOGLE_*`                  | Server-only | Calendar & Sheets access if leaked  |
| `JWT_SECRET`                | Server-only | Token forgery if leaked             |

---

## 🔒 Security

### Authentication

- **Customer Auth**: Email-based OTP verification
  - 6-digit OTP sent via Resend Email
  - OTP expires in 5 minutes
  - Maximum 5 verification attempts per OTP
  - Bcrypt-hashed OTP storage (10 salt rounds)
  - Old OTPs deleted before generating new ones
- **Admin Auth**: Supabase Auth + JWT
  - Supabase handles email/password authentication
  - Access token verification for all admin API routes
  - Admin status verified against `admin_users` table
  - Protected API routes with `verifyAdminToken()` middleware

### Secure Booking Page Access

- **Authentication required** to view/edit/cancel bookings
- Cookie-based session management with HttpOnly secure cookies
- Auto-login for trusted devices
- Session refreshing for seamless user experience
- Logout clears all session cookies

### HTTP Security Headers

The application enforces the following security headers via `next.config.ts`:

- **Strict-Transport-Security (HSTS)** - Forces HTTPS connections
- **X-Frame-Options: SAMEORIGIN** - Prevents clickjacking attacks
- **X-Content-Type-Options: nosniff** - Prevents MIME-type sniffing
- **Referrer-Policy: strict-origin-when-cross-origin** - Controls referrer information
- **Permissions-Policy** - Restricts browser feature access
- **X-DNS-Prefetch-Control** - Controls DNS prefetching

### Input Validation & Sanitization

- All user inputs are validated server-side
- Phone numbers validated (10 digits only)
- OTP format validated (6 digits)
- Contact form inputs sanitized against XSS (`<` and `>` removed)
- Input length limits enforced (1000 chars default, 5000 for messages)
- Email format validation with length limits (254 chars max)

### Database Security

- Row Level Security (RLS) policies on all tables
- Users can only view/edit their own data
- Admins have elevated access via policy checks
- Service role key for server-side operations only
- UUID primary keys (non-sequential, non-guessable)
- Enum types for constrained values (status fields)

### Device Trust

- Device fingerprinting for trusted devices
- Skip OTP for verified devices
- Device trust can be revoked
- Fingerprints stored with phone association

### Rate Limiting & Protection

- OTP request cooldown prevents email bombing
- Maximum 5 attempts before OTP invalidation
- Audit logging for security events
- All admin actions logged with user ID and timestamp

### Environment Security

- All secrets stored in `.env.local` (not committed)
- `.env*` patterns in `.gitignore`
- Service role key used only server-side
- Anon key used for client-side (limited permissions)

### Secure Coding Practices

- No SQL injection possible (Supabase client handles parameterization)
- JWT secrets minimum 32 characters recommended
- Passwords never stored (OTP-based auth for customers)
- Admin passwords hashed by Supabase Auth

### Invoice Generation Security

- Invoices generated client-side in browser
- No sensitive data exposure (phone numbers partially masked in print)
- Print functionality uses browser's native print capability

---

## 🔍 SEO & Structured Data

### Sitemap Generation

- Dynamic sitemap at `/sitemap.xml`
- All public pages indexed with priorities
- Automatic `lastModified` timestamps

### Structured Data (JSON-LD)

| Schema Type       | Purpose                              |
| ----------------- | ------------------------------------ |
| **LocalBusiness** | Business info, location, services    |
| **FAQPage**       | FAQ rich snippets in search results  |

### Meta Tags

- Open Graph tags for social sharing
- Geo-location tags for local SEO
- Comprehensive keywords for music studio searches
- Proper canonical URLs

### Display Page

- Public page at `/display` for studio monitors
- Real-time booking grid view by studio
- Date navigation with current time indicator

---

## 📱 Session Types & Pricing

### Session Type Details

| Session Type            | Max Capacity | Equipment     | Studios |
| ----------------------- | ------------ | ------------- | ------- |
| **Karaoke**             | 30 people    | Sound system  | A, B, C |
| **Live with Musicians** | 12 people    | Full setup    | A, B, C |
| **Only Drum Practice**  | 1 person     | Drums only    | A       |
| **Band**                | 6 people     | Configurable  | A, B, C |
| **Recording**           | 4 people     | Pro equipment | A       |

### Band Equipment Options

- Drum Only (₹350-400/hr)
- Drum + Amps (₹400-500/hr)
- Drum + Amps + Guitars (₹450-600/hr)
- Full Setup (₹600/hr)

### Recording Options

- Audio Recording (₹700/hr)
- Video Recording (₹800/hr)
- Chroma Key (₹1200/hr)

---

## 🎨 Color Palette Reference

See the [Color Palette section](#-color-palette) above for the complete design system including:

- Primary colors (Purple: `#8b5cf6`)
- Accent colors (Amber: `#f59e0b`)
- Background colors (Dark theme)
- Text colors (White to muted grays)
- Gradient definitions

---

## 🚀 Production Deployment Checklist

### Security Checklist

- [ ] All environment variables set in production
- [ ] `NODE_ENV` set to `production`
- [ ] Strong JWT_SECRET generated (32+ characters)
- [ ] SUPABASE_SERVICE_ROLE_KEY not exposed to client
- [ ] Resend API key secured
- [ ] Google API credentials secured (Calendar & Sheets)
- [ ] RLS policies verified in Supabase dashboard
- [ ] Admin users created in `admin_users` table

### Performance Checklist

- [ ] Next.js build optimized (`npm run build`)
- [ ] Images optimized (AVIF/WebP)
- [ ] Caching headers verified
- [ ] Database indexes created (see schema)

### Monitoring Recommendations

- [ ] Set up error monitoring (Sentry, LogRocket)
- [ ] Enable Supabase logging
- [ ] Monitor email delivery rates (Resend dashboard)
- [ ] Set up uptime monitoring

---

## 📞 Support

For technical support or questions about the booking system, please contact:

- **Developer**: Ashutosh Swamy
- **GitHub**: [@ashutoshswamy](https://github.com/ashutoshswamy)

---

_Last updated: December 2025_

_Built for Resonance Studio_
