'use client';

export default function BookingClientWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Hide the main navigation on the booking page */}
      <style jsx global>{`
        nav.main-nav {
          display: none !important;
        }
        main {
          padding-top: 0 !important;
        }
        footer.main-footer {
          display: none !important;
        }
      `}</style>
      {children}
    </>
  );
}
