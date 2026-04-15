'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';

const hideOnPaths = ['/chat-support', '/chat-support/session', '/bookings', '/profile/bookings'];

export default function NavbarWrapper() {
  const pathname = usePathname();
  const shouldHide = pathname?.startsWith('/organizer') || 
                    pathname?.startsWith('/ticket') || 
                    pathname?.startsWith('/pass') || 
                    hideOnPaths.some(path => pathname?.startsWith(path));
  
  if (shouldHide) return null;
  return <Navbar />;
}
