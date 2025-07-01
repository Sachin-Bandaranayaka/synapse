import { AuthProvider } from '@/components/auth/auth-provider';
import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  themeColor: '#111827',
  width: 'device-width',
  initialScale: 1
};

export const metadata: Metadata = {
  title: {
    template: '%s | J-nex Holdings',
    default: 'J-nex Holdings Sales Management'
  },
  description: 'Sales management system for J-nex Holdings',
  applicationName: 'J-nex Holdings',
  authors: [{ name: 'J-nex Holdings Team' }],
  keywords: ['sales', 'management', 'inventory', 'leads', 'orders'],
  robots: {
    index: false,
    follow: false
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
