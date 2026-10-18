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
| **Next.js**       | 16.1.1    | React framework with App Router |
| **React**         | 19.2.3    | UI library                      |
| **TypeScript**    | ^5        | Type-safe JavaScript            |
| **Tailwind CSS**  | ^4        | Utility-first CSS framework     |
| **Lucide React**  | ^0.562.0  | Icon library                    |

### Backend

| Technology              | Purpose                                |
| ----------------------- | -------------------------------------- |
| **Next.js API Routes**  | RESTful API endpoints                  |
| **Supabase**            | PostgreSQL database & authentication   |
| **Google Calendar API** | Calendar integration for bookings      |
| **Google Sheets API**   | Booking logs & reporting               |
| **Resend**              | Optional operational email notifications |

### Authentication & Security

| Technology                | Purpose                         |
| ------------------------- | ------------------------------- |
| **Supabase Auth**         | Admin & Staff authentication    |
| **bcryptjs**              | Customer password hashing       |
| **Mobile/name/password flow** | Customer identification and booking access |
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
    │ Enter Mobile │────▶│  Enter Name  │────▶│  Review &       │
    │  Number      │     │  (Required)  │     │  Confirm        │
    └──────────────┘     └──────────────┘     └────────┬────────┘
                                                       │
                                                       ▼
    ┌──────────────────────────────────────────────────────────────────┐
    │  ✅ Booking Confirmed + WhatsApp Message + Calendar Event Created│
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
     - 📋 **Meetings / Classes** - Without Sound Operator

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

6. **Mobile Number & Name**

   - Enter a numbers-only 10-digit mobile number
   - Enter the customer name; both fields are mandatory for first-time setup
   - Existing numbers automatically load the saved name
   - First-time customers create and confirm a password
   - Existing customers enter their password
   - Trusted devices can authenticate automatically
   - Use Forgot password to submit a reset request for admin handling
   - Use Edit and Continue to update saved details
   - Details are used for WhatsApp confirmations and one-day advance reminders

7. **Review & Confirmation**

   - Review all booking details
   - View calculated pricing
   - Confirm booking

8. **Booking Confirmation**
   - Booking saved to database
   - Google Calendar event created
   - WhatsApp confirmation message is prepared
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
            ▼                   ▼                   ▼                   ▼
    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
    │ Availability │    │   Booking    │    │   Settings   │    │   Payments   │
    │  Management  │    │   History    │    │  & Config    │    │ Verification │
    └──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
           │                   │                   │                   │
           ▼                   ▼                   ▼                   ▼
    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
    │ Block/Unblock│    │ View/Cancel/ │    │ Min/Max Hours│    │ Verify       │
    │ Time Slots   │    │ Confirm      │    │ Buffer Time  │    │ Payments     │
    │ Bulk Ops     │    │ Bookings     │    │ Advance Days │    │              │
    └──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
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
- **Payments** (`/admin/payments`)
  - View bookings with "Pay Now" discount
  - Verify payment status (Pending -> Verified)

- **Reminders** (`/admin/reminders`)
  - View bookings requiring reminders
  - Send WhatsApp reminders manually

- **Operate → Password Requests** (`/admin/password-requests`)
  - View pending customer password-reset requests
  - Set a replacement password and mark the request resolved
  - Share the changed-password message through WhatsApp

- **System → Settings** (`/admin/settings`)
  - Configure booking limits, buffers, advance days, and operating hours

### Edit Booking Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           EDIT BOOKING FLOW                            │
└─────────────────────────────────────────────────────────────────────────┘

    ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
    │ Enter Mobile │────▶│ View Bookings│────▶│ Select to    │
    │              │     │              │     │ Edit         │
    └──────────────┘     └──────────────┘     └──────────────┘
                                                     │
                                                     ▼
    ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
    │  Edit Done   │◀────│  Redirect to │◀────│  Enter Name  │
    │              │     │  Booking     │     │              │
    └──────────────┘     └──────────────┘     └──────────────┘
```

**Edit Restrictions:**

- Confirmed bookings: Public online changes are allowed more than 24 hours before
- Within 24 hours: contact the studio directly; staff/admin can change at any time
- Cancelled/completed/no_show: Cannot edit

### Cancel Booking Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CANCEL BOOKING FLOW                            │
└─────────────────────────────────────────────────────────────────────────┘

    ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
    │ Enter Mobile │────▶│ View Bookings│────▶│ Select to    │
    │              │     │              │     │ Cancel       │
    └──────────────┘     └──────────────┘     └──────────────┘
                                                     │
                                                     ▼
    ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
    │  Cancelled   │◀────│  Confirm     │◀────│  Enter Name  │
    │  + WhatsApp  │     │  Cancellation│     │              │
    └──────────────┘     └──────────────┘     └──────────────┘
```

**Cancel Restrictions:**

- Free online cancellation is allowed more than 24 hours before
- Within 24 hours, a 50% charge applies; no-shows are charged 100%
- Admin/staff can cancel at any time

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
│   │   │   ├── PhoneStep.tsx         # Mobile/name and device recognition
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
│   ├── edit-booking/           # Edit existing bookings with mobile/name checks
│   ├── cancel-booking/         # Cancel bookings with verification
│   │
│   ├── admin/                  # Admin section
│   │   ├── layout.tsx          # Admin layout
│   │   ├── page.tsx            # Admin root (redirects)
│   │   ├── login/              # Admin login
│   │   │   └── page.tsx
│   │   ├── reminders/          # Standalone reminders (WhatsApp)
│   │   │   └── page.tsx
│   │   └── (dashboard)/        # Protected admin routes
│   │       ├── layout.tsx      # Dashboard layout with nav
│   │       ├── dashboard/      # Overview stats
│   │       ├── bookings/       # Booking management + WhatsApp
│   │       ├── payments/       # Payment verification
│   │       ├── investors/      # Investor management
│   │       ├── loyalty/        # Loyalty program management
│   │       ├── availability/   # Slot management
│   │       ├── staff/          # Staff management
│   │       ├── password-requests/ # Customer password reset requests
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
│   │       │   └── InvestorDashboard.tsx # Investor view component
│   │       └── bookings/       # Staff booking management
│   │
│   ├── api/                    # API routes
│   │   ├── auth/               # Authentication
│   │   │   ├── send-otp/       # Legacy OTP compatibility endpoint
│   │   │   ├── verify-otp/     # Legacy OTP compatibility endpoint
│   │   │   ├── verify-device/  # Device verification
│   │   │   ├── status/         # Check auth status
│   │   │   ├── auto-login/     # Auto-login for trusted devices
│   │   │   ├── password/       # Customer password login/setup/status
│   │   │   ├── password-reset-request/ # Forgot-password requests
│   │   │   ├── admin-logout/   # Admin/staff cookie logout
│   │   │   ├── refresh/        # Refresh auth session
│   │   │   └── logout/         # Logout and clear session
│   │   ├── book/               # Create booking
│   │   ├── bookings/           # Booking operations
│   │   │   ├── route.ts        # Get bookings
│   │   │   ├── cancel/         # Cancel booking
│   │   │   └── upcoming/       # Upcoming bookings
│   │   ├── availability/       # Check availability
│   │   ├── check-user/         # User verification
│   │   ├── contact/            # Contact form
│   │   ├── rates/              # Rate card data
│   │   ├── settings/           # Public settings
│   │   ├── studios/            # Studio information
│   │   ├── display/            # Display endpoints
│   │   │   └── bookings/
│   │   ├── loyalty/            # Loyalty program endpoints
│   │   ├── admin/              # Admin-only endpoints
│   │   │   ├── login/          # Admin authentication
│   │   │   ├── password-requests/ # Customer reset-request management
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
│   │       ├── bookings/       # Staff booking operations
│   │       └── book/           # Staff booking creation
│   │
│   ├── cashback/           # Cashback/Loyalty endpoints
│   ├── whatsapp-reminder/  # Reminder management
│   ├── components/             # Shared components
│   │   ├── Navigation.tsx      # Main navigation
│   │   ├── Footer.tsx          # Site footer
│   │   ├── MainContent.tsx     # Main content wrapper
│   │   ├── OTPLogin.tsx        # OTP login component
│   │   ├── OTPVerification.tsx # Legacy OTP compatibility component
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

---

## ✨ Features

### Customer Features

- ✅ Interactive multi-step booking wizard
- ✅ Real-time availability checking
- ✅ Multiple session types (Karaoke, Band, Recording, etc.)
- ✅ **Prompt Payment Discount** ("Pay Now & Save")
- ✅ **Loyalty Program** - Earn points for bookings and redeem them
- ✅ Smart studio suggestions based on group size
- ✅ Mobile-first customer flow with 10-digit validation
- ✅ WhatsApp booking confirmations and reminders
- ✅ Trusted device management for faster logins
- ✅ View and cancel bookings
- ✅ Edit and cancel bookings with mobile/name and session checks
- ✅ Duplicate booking prevention
- ✅ Responsive design (mobile-first)
- ✅ Smooth animations with reduced motion support

### Admin Features

- ✅ Secure Supabase Auth admin authentication
- ✅ Dashboard with booking statistics & revenue
- ✅ Booking management (confirm, cancel, no_show, view details)
- ✅ Admin booking creation for walk-in customers
- ✅ **Payment Verification** - Verify prompt payment bookings
- ✅ **Admin Reminders** - Standalone page for managing WhatsApp reminders
- ✅ **Investor Management** - Manage investor accounts
- ✅ **Loyalty Management** - Manage loyalty program settings
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
- ✅ **Investor Portal** - Special view for investors to manage their bookings

### Investor Features

- ✅ Dashboard with revenue tracking
- ✅ Manage bookings assigned to them (View/Edit/Cancel)
- ✅ Dedicated view within Staff Portal

### Technical Features

- ✅ Google Calendar integration (auto-create events)
- ✅ Google Sheets integration (booking logs & reporting)
- ✅ Email notifications via Resend
- ✅ Supabase PostgreSQL database with RLS
- ✅ JWT authentication for admins
- ✅ Device fingerprinting for trusted devices
- ✅ Smooth animations (GSAP)
- ✅ Accessibility support (reduced motion)
- ✅ Performance-optimized motion components
- ✅ SEO optimization (structured data, sitemap, meta tags)

### Operational Email Notification Types

| Email Type                     | Purpose                                   |
| ------------------------------ | ----------------------------------------- |
| **Booking Confirmation**       | Optional operational confirmation         |
| **Admin Booking Confirmation** | Optional confirmation for team bookings   |
| **Booking Update**             | Optional notification when modified      |
| **Booking Cancellation**       | Optional cancellation notification       |

---

## 🗄 Database Schema

### Core Tables

| Table                | Purpose                                                            |
| -------------------- | ------------------------------------------------------------------ |
| `studios`            | Studio information (name, type, capacity, hourly rates, amenities) |
| `users`              | Customer information, including bcrypt password hashes              |
| `admin_users`        | Admin user accounts (roles: admin, super_admin, staff, investor)   |
| `bookings`           | All booking records (status, payment_status, is_prompt_payment)    |
| `availability_slots` | Blocked time slots per studio                                      |
| `booking_settings`   | System configuration (min/max hours, buffer, etc.)                 |
| `login_otps`         | Legacy OTP compatibility records (bcrypt hashed)                   |
| `rate_cards`         | Pricing per studio, session type, and sub-option                   |
| `audit_logs`         | Admin action tracking for accountability                           |
| `trusted_devices`    | Verified device fingerprints                                       |
| `refresh_tokens`     | Hashed customer refresh tokens and revocation state                |
| `password_reset_requests` | Customer forgot-password requests and resolution state        |

### Database Features

- UUID primary keys throughout
- Row Level Security (RLS) policies
- Automatic timestamps (created_at, updated_at)
- Indexed columns for performance
- Indexed columns for performance
- Constraint validation (time ranges, statuses)

### Key Database Functions

- **`create_booking_atomic`**: Handles booking creation with row-level locking to prevent race conditions.
- **`update_booking_atomic`**: Handles booking updates securely.
- **`get_dashboard_stats`**: Calculates advanced dashboard statistics efficiently on the server side.
- **`loyalty.sql`**: Manages loyalty points calculation and tier updates.
- **`check_rate_limit`**: Infrastructure for database-level rate limiting.

---

## 🔌 API Endpoints

### Authentication

| Method | Endpoint                  | Description                    |
| ------ | ------------------------- | ------------------------------ |
| `POST` | `/api/auth/send-otp`      | Legacy OTP compatibility endpoint |
| `POST` | `/api/auth/verify-otp`    | Legacy OTP compatibility endpoint |
| `POST` | `/api/auth/verify-device` | Verify trusted device          |
| `GET`  | `/api/auth/status`        | Check authentication status    |
| `POST` | `/api/auth/auto-login`    | Auto-login for trusted devices |
| `POST` | `/api/auth/password`      | Customer password setup/login  |
| `GET`  | `/api/auth/password`      | Customer password-flow status |
| `POST` | `/api/auth/password-reset-request` | Submit forgot-password request |
| `POST` | `/api/auth/admin-logout`  | Clear admin/staff session cookies |
| `POST` | `/api/auth/refresh`       | Refresh auth session token     |
| `POST` | `/api/auth/logout`        | Logout and clear session       |

### Bookings

| Method | Endpoint                      | Description                      |
| ------ | ----------------------------- | -------------------------------- |
| `GET`  | `/api/bookings`               | Get user's bookings              |
| `POST` | `/api/book`                   | Create new booking               |
| `POST` | `/api/bookings/cancel`        | Cancel booking with notification |
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
| `GET`  | `/api/loyalty/status` | Get loyalty points/tier        |
| `POST` | `/api/loyalty/claim`  | Claim loyalty reward           |

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
| `GET`    | `/api/loyalty/all`        | Get loyalty/cashback data |
| `GET`    | `/api/admin/investors`    | Get investor data         |
| `GET`    | `/api/admin/password-requests` | List password reset requests |
| `PATCH`  | `/api/admin/password-requests` | Set password and resolve request |

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
| `PUT`    | `/api/admin/staff/[id]` | Update staff member     |
| `DELETE` | `/api/admin/staff/[id]` | Delete staff member     |

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

- **Customer Auth**: 10-digit WhatsApp number, name, and password
  - Returning devices can use trusted-device auto-login
  - Private booking fields require an authenticated customer session
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
- **Content-Security-Policy** - Restricts scripts, frames, images, and connections
- **X-DNS-Prefetch-Control** - Controls DNS prefetching

### Input Validation & Sanitization

- All user inputs are validated server-side
- Phone numbers validated (10 digits only)
- Mobile numbers validated (10 digits, numbers only)
- Contact form inputs sanitized against XSS (`<` and `>` removed)
- Input length limits enforced (1000 chars default, 5000 for messages)
- Email format validation with length limits (254 chars max)

### Database Security

- Row Level Security (RLS) policies on protected tables after migrations are applied
- Private user and booking data is accessed through authenticated server APIs
- Browser sessions do not receive broad direct table access
- Service role key for server-side operations only
- UUID primary keys (non-sequential, non-guessable)
- Enum types for constrained values (status fields)

### Device Trust

- Device fingerprinting for trusted devices
- Trusted devices can skip repeated customer verification
- Device trust can be revoked
- Fingerprints stored with phone association

### Rate Limiting & Protection

- Database-backed endpoint and client-key rate limiting
- Rate-limit failures fail closed
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
- Customer access uses mobile/name flow with trusted-device sessions
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

| Session Type            | Max Capacity | Equipment         | Studios |
| ----------------------- | ------------ | ----------------- | ------- |
| **Karaoke**             | 30 people    | Sound system      | A, B, C |
| **Live with Musicians** | 12 people    | Full setup        | A, B, C |
| **Only Drum Practice**  | 1 person     | Drums only; sticks ₹50/hour extra | A only |
| **Band**                | 6 people     | Configurable      | A, B, C |
| **Recording**           | 4 people     | Pro equipment     | A       |
| **Meetings / Classes**  | Flexible     | No Sound Operator | A, B, C |

Karaoke group brackets are 1–8, 9–12, 13–20, and 21–30 people. Standard operating hours are 8:00 AM–9:30 PM. Tea, snacks, lunch, and dinner can be arranged on request at extra cost.

### Band Equipment Options

- College Students Band: fixed ₹500/hour in Studio A
- Includes drums, keyboard, 2 electric guitars, 2 guitar amps, and 1 bass amp
- Drum sticks are optional at ₹50/hour extra

Drum Practice is available in Studio A only.

### Loyalty Cashback

Book for 50 hours within any three months and earn ₹2,000 as Cashback.

### Recording Options

- Audio Recording (₹700/hr)
- Video Recording (₹800/hr)
- Chroma Key (₹1200/hr)

### Meetings / Classes (without Sound Operator)

- Studio C (₹200/hr)
- Studio B (₹250/hr)
- Studio A (₹350/hr)

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
- [ ] Monitor WhatsApp operations and optional email delivery rates (Resend dashboard)
- [ ] Set up uptime monitoring

---

## 📞 Support

For technical support or questions about the booking system, please contact:

- **Developer**: Ashutosh Swamy
- **GitHub**: [@ashutoshswamy](https://github.com/ashutoshswamy)

---

_Last updated: October 2026_

_Built for Resonance Studio_
