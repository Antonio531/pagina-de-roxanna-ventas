'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import { ReactNode } from 'react';

export default function ClientLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  
  // Rutas sin navbar
  const authRoutes = ['/login', '/register'];
  const isAdminRoute = pathname.startsWith('/admin');
  
  const showNavbar = !authRoutes.includes(pathname) && !isAdminRoute;
  
  return (
    <>
      {showNavbar && <Navbar />}
      <div className={showNavbar ? 'pt-24' : ''}>
        {children}
      </div>
    </>
  );
}