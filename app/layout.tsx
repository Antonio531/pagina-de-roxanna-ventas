import "./globals.css";
import { ReactNode } from "react";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import ClientLayout from "./components/ClientLayout";
import { Toaster } from 'react-hot-toast';

export const metadata = {
  title: "Tienda & Tandas",
  description: "Compra productos y únete a tandas seguras",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-slate-950 text-white" suppressHydrationWarning>
        <AuthProvider>
          <CartProvider>
            <ClientLayout>{children}</ClientLayout>
            <Toaster 
              position="top-center"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#1e293b',
                  color: '#fff',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                },
                success: {
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}