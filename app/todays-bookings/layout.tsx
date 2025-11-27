export default function TodaysBookingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 bg-[#0a0a0f] z-50 overflow-auto">
      {children}
    </div>
  );
}
