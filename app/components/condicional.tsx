'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';

export default function ConditionalNavbar() {
  const pathname = usePathname();
  
  // Lista de rutas donde NO queremos mostrar el navbar
  const hideNavbarRoutes = ['/login', '/register'];
  
  // También ocultar en todas las rutas que empiecen con /admin
  const isAdminRoute = pathname.startsWith('/admin');
  
  // Si la ruta actual está en la lista O es ruta admin, no mostrar navbar
  if (hideNavbarRoutes.includes(pathname) || isAdminRoute) {
    return null;
  }
  
  return (
    <>
      <Navbar />
      <div className="pt-24" />
    </>
  );
}