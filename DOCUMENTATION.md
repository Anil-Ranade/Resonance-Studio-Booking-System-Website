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
| **JWT (jsonwebtoken)** | Token-based authentication |
| **bcryptjs** | Password/OTP hashing |
| **OTP-based Auth** | Phone number verification |

### Development Tools
| Technology | Purpose |
|------------|---------|
| **ESLint** | Code linting |
| **PostCSS** | CSS processing |

---

## 🔄 Application Workflow

### Customer Booking Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CUSTOMER JOURNEY                               │
└─────────────────────────────────────────────────────────────────────────┘

    ┌──────────┐     ┌──────────────┐     ┌─────────────────┐
    │  Home    │────▶│  Choose      │────▶│  Select Date    │
    │  Page    │     │  Session     │     │  & Time Slot    │
    └──────────┘     │  Type        │     └────────┬────────┘
                     └──────────────┘              │
                                                   ▼
    ┌──────────┐     ┌──────────────┐     ┌─────────────────┐
    │Confirmed!│◀────│  Verify OTP  │◀────│  Enter Phone    │
    │  Page    │     │  (SMS)       │     │  Number         │
    └──────────┘     └──────────────┘     └─────────────────┘
         │
         ▼
    ┌──────────────────────────────────────┐
    │  SMS Confirmation + Calendar Event   │
    └──────────────────────────────────────┘
```

### Step-by-Step Booking Process

1. **Home Page (`/home`)**
   - Browse studio information and services
   - View available session types
   - Access quick booking actions

2. **Session Selection (`/booking`)**
   - Choose session type:
     - 🎤 **Karaoke** - Sing along with friends
     - 🎵 **Live with Musicians** - Live performance session
     - 🥁 **Only Drum Practice** - Drum practice only
     - 🎸 **Band** - Full band rehearsal
     - 📻 **Recording** - Special recording packages

3. **Configure Session Details**
   - Select participant count (varies by session type)
   - Choose equipment needs (for Band sessions)
   - Select recording options (for Recording sessions)

4. **Date & Time Selection**
   - View availability calendar
   - Select available time slots
   - System automatically suggests appropriate studio

5. **Phone Verification**
   - Enter 10-digit phone number
   - Receive OTP via SMS (Twilio)
   - Verify OTP to confirm identity

6. **Booking Confirmation**
   - Booking saved to database
   - Google Calendar event created
   - SMS confirmation sent
   - Redirect to confirmation page

### Admin Workflow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           ADMIN DASHBOARD                                │
└─────────────────────────────────────────────────────────────────────────┘

    ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
    │    Login     │────▶│  Dashboard   │────▶│   Manage     │
    │   (Admin)    │     │  Overview    │     │   Bookings   │
    └──────────────┘     └──────────────┘     └──────────────┘
                               │
           ┌───────────────────┼───────────────────┐
           ▼                   ▼                   ▼
    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
    │ Availability │    │   Booking    │    │   Settings   │
    │  Management  │    │   History    │    │  & Config    │
    └──────────────┘    └──────────────┘    └──────────────┘
```

### Admin Features

- **Dashboard** (`/admin/dashboard`) - Overview stats and recent bookings
- **Bookings** (`/admin/bookings`) - View and manage all bookings
- **Availability** (`/admin/availability`) - Block/unblock time slots
- **Settings** (`/admin/settings`) - Configure booking rules

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
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Root page (redirects to /home)
│   ├── globals.css             # Global styles & CSS variables
│   │
│   ├── home/                   # Landing page
│   ├── booking/                # Booking flow
│   ├── confirmation/           # Booking confirmation
│   ├── my-bookings/            # User booking history
│   ├── login/                  # User login
│   │
│   ├── admin/                  # Admin section
│   │   ├── login/              # Admin login
│   │   └── (dashboard)/        # Protected admin routes
│   │       ├── dashboard/      # Admin dashboard
│   │       ├── bookings/       # Booking management
│   │       ├── availability/   # Slot management
│   │       └── settings/       # System settings
│   │
│   ├── api/                    # API routes
│   │   ├── auth/               # Authentication endpoints
│   │   ├── book/               # Booking creation
│   │   ├── bookings/           # Booking operations
│   │   ├── availability/       # Availability checks
│   │   └── admin/              # Admin-only endpoints
│   │
│   ├── studios/                # Studio information
│   ├── rate-card/              # Pricing information
│   ├── gallery/                # Photo gallery
│   ├── about/                  # About page
│   ├── contact/                # Contact page
│   ├── faq/                    # FAQs
│   └── policies/               # Terms & policies
│
├── lib/                        # Utility libraries
│   ├── supabase.ts             # Supabase client
│   ├── googleCalendar.ts       # Google Calendar integration
│   ├── sms.ts                  # Twilio SMS service
│   └── otpStore.ts             # OTP management
│
├── database/
│   └── schema.sql              # Database schema
│
└── public/                     # Static assets
```

---

## ✨ Features

### Customer Features
- ✅ Interactive booking wizard
- ✅ Real-time availability checking
- ✅ Multiple session types (Karaoke, Band, Recording, etc.)
- ✅ OTP-based phone verification
- ✅ SMS booking confirmations
- ✅ View and cancel bookings
- ✅ Responsive design (mobile-first)

### Admin Features
- ✅ Secure admin authentication
- ✅ Dashboard with booking statistics
- ✅ Booking management (confirm, cancel, view)
- ✅ Availability slot management
- ✅ Bulk availability operations
- ✅ Configurable booking settings

### Technical Features
- ✅ Google Calendar integration
- ✅ Twilio SMS notifications
- ✅ Supabase PostgreSQL database
- ✅ JWT authentication
- ✅ Smooth animations (Framer Motion)
- ✅ Accessibility support (reduced motion)

---

## 🗄 Database Schema

### Core Tables

| Table | Purpose |
|-------|---------|
| `studios` | Studio information (name, type, capacity, rates) |
| `users` | Customer information |
| `admin_users` | Admin user accounts |
| `bookings` | All booking records |
| `availability_slots` | Blocked time slots |
| `booking_settings` | System configuration |
| `login_otps` | OTP verification records |
| `reminders` | Scheduled booking reminders |

---

*Built with ❤️ for Resonance Studio*
