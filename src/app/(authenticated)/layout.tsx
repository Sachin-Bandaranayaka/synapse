// src/app/(authenticated)/layout.tsx

'use client';

import { useSession, signOut } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSessionStatus } from '@/hooks/use-session-status'; // <-- Import the new hook

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useSessionStatus(); // <-- ADD THIS LINE to activate the check
  const { data: session, status } = useSession();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (status === 'loading' || !mounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900">
        <div className="h-32 w-32 animate-spin rounded-full border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!session) {
    redirect('/auth/signin');
  }

  return (
    <div className="flex min-h-screen bg-gray-900">
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        <motion.aside
          initial={{ width: isSidebarOpen ? 256 : 80 }}
          animate={{ width: isSidebarOpen ? 256 : 80 }}
          transition={{ duration: 0.3 }}
          className="sticky top-0 h-screen bg-gray-800/95 backdrop-blur-sm print:hidden"
        >
          <div className="p-6">
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`${isSidebarOpen ? 'text-2xl' : 'text-lg'} font-bold text-indigo-400`}
            >
              {isSidebarOpen ? 'J-nex Holdings' : 'JH'}
            </motion.h1>
          </div>
          <nav className="mt-8 space-y-2 px-4">
            <NavLink href="/dashboard" icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            }>
              Dashboard
            </NavLink>

            <NavLink href="/products" icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            }>
              Products
            </NavLink>

            <NavLink href="/inventory" icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }>
              Inventory
            </NavLink>

            <NavLink href="/orders" icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            }>
              Orders
            </NavLink>

            <NavLink href="/leads" icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }>
              Leads
            </NavLink>

            {/* Search with highlight */}
            <NavLink
              href="/search"
              icon={
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
              className="bg-indigo-900/30 hover:bg-indigo-800/40 text-indigo-300 hover:text-indigo-200"
            >
              Search
            </NavLink>

            <NavLink href="/shipping" icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
              </svg>
            }>
              Shipping
            </NavLink>

            {session.user.role === 'ADMIN' && (
              <>
                <NavLink href="/reports" icon={
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                }>
                  Reports
                </NavLink>

                <NavLink href="/users" icon={
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                }>
                  Users
                </NavLink>
              </>
            )}
          </nav>

          {/* Logout button */}
          <div className="absolute bottom-0 w-full p-4">
            <button
              onClick={() => signOut()}
              className="flex w-full items-center space-x-2 rounded-lg px-4 py-2 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {isSidebarOpen && <span>Logout</span>}
            </button>
          </div>
        </motion.aside>
      </AnimatePresence>

      {/* Main content */}
      <main className="flex-1 overflow-x-hidden bg-gray-900 px-6 py-8 print:bg-white print:p-0">
        <div className="container mx-auto">
          {/* Toggle sidebar button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="mb-4 rounded-lg bg-gray-800 p-2 text-gray-400 shadow-lg transition-colors hover:bg-gray-700 hover:text-white print:hidden"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </motion.button>
          {children}
        </div>
      </main>
    </div>
  );
}

function NavLink({ href, icon, children, className = '' }: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ scale: 1.02, x: 6 }}
        whileTap={{ scale: 0.98 }}
        className={`flex items-center space-x-2 rounded-lg px-4 py-2 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white ${className}`}
      >
        {icon}
        <span>{children}</span>
      </motion.div>
    </Link>
  );
}
