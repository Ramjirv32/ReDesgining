'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';

const hideOnPaths = ['/chat-support', '/chat-support/session'];

export default function NavbarWrapper() {
  const pathname = usePathname();
  const shouldHide = hideOnPaths.some(path => pathname.startsWith(path));
  if (shouldHide) return null;
  return <Navbar />;
}
