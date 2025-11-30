'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function BookingRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/booking/new');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-zinc-900 via-zinc-900 to-black">
      <div className="flex items-center gap-3">
        <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
        <span className="text-zinc-400">Redirecting...</span>
      </div>
    </div>
  );
}
