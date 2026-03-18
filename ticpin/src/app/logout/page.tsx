'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { clearUserSession } from '@/lib/auth/user';
import { clearOrganizerSession } from '@/lib/auth/organizer';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    // 1. Clear both sessions
    clearUserSession();
    clearOrganizerSession();
    
    // 2. Small delay to ensure cookies are cleared before redirect
    const timer = setTimeout(() => {
      // 3. Redirect to home page
      router.replace('/');
      // 4. Force a hard refresh to clear any cached states
      window.location.href = '/';
    }, 500);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center font-sans" style={{ fontFamily: 'var(--font-anek-latin), sans-serif' }}>
      <div className="relative">
        <div className="w-16 h-16 border-4 border-zinc-100 border-t-zinc-900 rounded-full animate-spin mb-6" />
        <div className="absolute inset-x-0 bottom-0 h-4 bg-white/80 blur-lg rounded-full" />
      </div>
      <h2 className="text-[20px] font-bold text-zinc-900 mb-2">Signing out...</h2>
      <p className="text-zinc-500 text-[14px]">Please wait a moment.</p>
    </div>
  );
}
