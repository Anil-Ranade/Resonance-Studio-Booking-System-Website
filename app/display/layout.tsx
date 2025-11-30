'use client';

export default function DisplayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Hide the main navigation and footer on the display page */}
      <style jsx global>{`
        nav {
          display: none !important;
        }
        main {
          padding-top: 0 !important;
          margin: 0 !important;
        }
        footer {
          display: none !important;
        }
        body {
          overflow: hidden !important;
        }
      `}</style>
      {children}
    </>
  );
}
