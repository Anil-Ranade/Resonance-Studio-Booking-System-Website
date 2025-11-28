'use client';

export default function BookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Hide the main navigation on the booking page */}
      <style jsx global>{`
        nav {
          display: none !important;
        }
        main {
          padding-top: 0 !important;
        }
        footer {
          display: none !important;
        }
      `}</style>
      {children}
    </>
  );
}
