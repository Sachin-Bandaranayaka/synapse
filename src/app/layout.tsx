// src/app/layout.tsx

import { AuthProvider } from '@/components/auth/auth-provider';
import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  themeColor: '#111827', // Dark theme color
  width: 'device-width',
  initialScale: 1
};

export const metadata: Metadata = {
  title: {
    template: '%s | J-nex Holdings',
    default: 'J-nex Holdings Sales Management'
  },
  description: 'Sales management system for J-nex Holdings',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Add the "dark" class here to enable dark mode by default
    <html lang="en" className="h-full dark">
      <body className={`${inter.className} h-full`}>
        {/* The ThemeProvider is no longer needed */}
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}