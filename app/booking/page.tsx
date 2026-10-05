'use client';

import Link from 'next/link';
import { ArrowLeft, CalendarPlus, ChevronRight, Edit, Eye, Music2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const menuOptions = [
  {
    id: 'new',
    title: 'New Booking',
    description: 'Book a new studio session',
    icon: CalendarPlus,
    href: '/booking/new',
  },
  {
    id: 'change',
    title: 'Change Existing Booking',
    description: 'Modify your current booking',
    icon: Edit,
    href: '/edit-booking',
  },
  {
    id: 'cancel',
    title: 'Cancel Existing Booking',
    description: 'Cancel a scheduled booking',
    icon: XCircle,
    href: '/cancel-booking',
  },
  {
    id: 'view',
    title: 'View Upcoming Bookings',
    description: 'See all your scheduled sessions',
    icon: Eye,
    href: '/view-bookings',
  },
];

export default function BookingMenu() {
  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-background">
      <header className="flex-shrink-0 px-4 pt-4 pb-2 text-center">
        <div className="flex items-center justify-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
            <Music2 className="w-5 h-5" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-lg font-bold leading-none">Resonance Studio</span>
            <span className="text-xs text-muted-foreground font-medium tracking-wide">
              Sinhgad Road · Online booking
            </span>
          </div>
        </div>
        <h1 className="text-xl font-bold">What would you like to do?</h1>
        <p className="text-sm text-muted-foreground mt-1">Choose an option below</p>
      </header>

      <main className="flex-1 px-4 py-4 overflow-auto">
        <nav className="flex flex-col gap-3 max-w-md mx-auto">
          {menuOptions.map((option, index) => {
            const Icon = option.icon;
            const primary = index === 0;

            return (
              <Card
                key={option.id}
                className={`p-0 transition-colors ${
                  primary
                    ? 'bg-primary text-primary-foreground ring-primary hover:bg-primary/90'
                    : 'hover:bg-muted'
                }`}
              >
                <Link
                  href={option.href}
                  className="flex items-center gap-4 p-4 rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <span
                    className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                      primary ? 'bg-primary-foreground/10' : 'bg-primary/15 text-primary'
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                  </span>
                  <span className="flex-1">
                    <span className="block text-base font-semibold">{option.title}</span>
                    <span
                      className={`block text-sm ${
                        primary ? 'text-primary-foreground/75' : 'text-muted-foreground'
                      }`}
                    >
                      {option.description}
                    </span>
                  </span>
                  <ChevronRight className="w-5 h-5 opacity-60" />
                </Link>
              </Card>
            );
          })}
        </nav>
      </main>

      <footer className="flex-shrink-0 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-border bg-background/90 backdrop-blur">
        <Button asChild variant="secondary" className="w-full h-11">
          <Link href="/">
            <ArrowLeft /> Back
          </Link>
        </Button>
      </footer>
    </div>
  );
}
