# Resonance Studio Booking

A modern, full-stack studio booking and management platform built with Next.js 16 and React 19.

![Next.js](https://img.shields.io/badge/Next.js-16.0.4-black?logo=next.js)
![React](https://img.shields.io/badge/React-19.2.0-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?logo=tailwind-css)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)

## 📖 Overview

Resonance Studio Booking is a comprehensive booking system that allows customers to book music studio sessions, manage their bookings, and provides an admin dashboard for complete studio management. The application features phone-based OTP authentication, Google Calendar integration, and SMS notifications.

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
- Smart studio suggestions based on group size
- Configurable booking duration limits (min/max hours)
- Advance booking restrictions (up to 30 days)
- Booking buffer time between sessions

### 📱 OTP Authentication
- SMS-based OTP verification via Twilio
- Secure phone number verification flow
- Trusted device management
- Rate limiting with cooldown protection
- Bcrypt-hashed OTP storage

### 📅 Google Calendar Integration
- Automatic calendar event creation for bookings
- Sync bookings with owner's Google Calendar
- Event details include customer info and booking ID
- Automatic event updates on booking changes

### 📲 SMS Notifications
- Booking confirmation messages via Twilio
- Cancellation notifications
- Support for reminder notifications

### 👤 My Bookings
- View personal booking history
- Cancel bookings with confirmation
- Track booking status (pending, confirmed, cancelled, completed)
- View upcoming bookings

### 🔧 Admin Dashboard
- Secure JWT-based admin authentication
- Dashboard statistics (total bookings, revenue, today's bookings)
- Booking management (view, confirm, cancel)
- Availability slot management (block/unblock)
- Bulk availability operations
- Configurable booking settings
- Audit logging for all admin actions

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
- Contact form with submission tracking
- Comprehensive FAQ section
- Policies page

### 🖼️ Additional Pages
- Photo gallery
- About page
- Rate card display

## 🛠 Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16.0.4 (App Router) |
| **UI Library** | React 19.2.0 |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 4 |
| **Animations** | Framer Motion 12 |
| **Icons** | Lucide React |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | JWT + OTP (bcryptjs) |
| **Calendar** | Google Calendar API |
| **SMS** | Twilio |

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Twilio account (for SMS)
- Google Cloud project (for Calendar API)

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

   # Twilio
   TWILIO_ACCOUNT_SID=your_twilio_sid
   TWILIO_AUTH_TOKEN=your_twilio_token
   TWILIO_PHONE_NUMBER=your_twilio_number

   # Google Calendar
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   GOOGLE_REFRESH_TOKEN=your_refresh_token
   GOOGLE_CALENDAR_ID=your_calendar_id

   # JWT
   JWT_SECRET=your_jwt_secret
   ADMIN_JWT_SECRET=your_admin_jwt_secret
   ```

4. **Set up the database**
   
   Run the SQL schema in your Supabase SQL Editor:
   ```bash
   # database/schema.sql - Main schema
   # database/devices.sql - Trusted devices schema
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open the app**
   
   Visit [http://localhost:3000](http://localhost:3000)

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## 📁 Project Structure

```
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Root page
│   ├── globals.css             # Global styles
│   │
│   ├── home/                   # Landing page
│   ├── booking/                # Booking wizard
│   │   ├── components/         # Step components
│   │   ├── contexts/           # Booking context
│   │   └── utils/              # Helper utilities
│   ├── confirmation/           # Booking confirmation
│   ├── my-bookings/            # User booking history
│   │
│   ├── admin/                  # Admin section
│   │   ├── login/              # Admin login
│   │   └── (dashboard)/        # Protected routes
│   │       ├── dashboard/      # Overview stats
│   │       ├── bookings/       # Booking management
│   │       ├── availability/   # Slot management
│   │       └── settings/       # Configuration
│   │
│   ├── api/                    # API routes
│   │   ├── auth/               # OTP auth endpoints
│   │   ├── book/               # Booking creation
│   │   ├── bookings/           # Booking operations
│   │   ├── availability/       # Availability checks
│   │   ├── admin/              # Admin endpoints
│   │   └── ...                 # Other endpoints
│   │
│   ├── studios/                # Studio information
│   ├── rate-card/              # Pricing
│   ├── gallery/                # Photo gallery
│   ├── about/                  # About page
│   ├── contact/                # Contact form
│   ├── faq/                    # FAQs
│   └── policies/               # Terms & policies
│
├── lib/                        # Utility libraries
│   ├── supabase.ts             # Supabase client
│   ├── googleCalendar.ts       # Calendar integration
│   ├── sms.ts                  # Twilio SMS service
│   ├── otpStore.ts             # OTP management
│   └── deviceFingerprint.ts    # Device tracking
│
├── database/
│   ├── schema.sql              # Main database schema
│   └── devices.sql             # Trusted devices schema
│
└── public/                     # Static assets
```

## 📚 Documentation

For detailed documentation including:
- Application workflow diagrams
- Color palette reference
- Database schema details
- API endpoint documentation

See [DOCUMENTATION.md](./DOCUMENTATION.md)

## 🔒 Security Features

- JWT-based authentication for admin
- OTP verification with bcrypt hashing
- Row Level Security (RLS) policies in Supabase
- Trusted device management
- Rate limiting for OTP requests
- Audit logging for admin actions

## 📄 License

This project is proprietary software developed for Resonance Studio.

## 👨‍💻 Author

**Ashutosh Swamy**
- GitHub: [@ashutoshswamy](https://github.com/ashutoshswamy)

---

*Built with ❤️ for Resonance Studio*
