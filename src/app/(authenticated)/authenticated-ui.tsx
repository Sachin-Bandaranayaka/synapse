// src/app/(authenticated)/authenticated-ui.tsx
'use client';

import { useSession, signOut } from 'next-auth/react';
import { usePathname, redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useSessionStatus } from '@/hooks/use-session-status';
import { Tenant } from '@prisma/client';
import {
  HomeIcon,
  ShoppingBagIcon,
  ArchiveBoxIcon,
  ClipboardDocumentListIcon,
  UsersIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
  TruckIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';

// NavLink component styled for the dark theme
function NavLink({ href, icon, children, isActive }: { href: string; icon: React.ReactNode; children: React.ReactNode; isActive: boolean; }) {
  const showText = typeof children === 'string' && children.length > 0;
  return (
    <Link href={href}>
      <div
        className={`flex items-center space-x-4 rounded-lg px-4 py-2 transition-colors ${
          isActive
            ? 'bg-indigo-600/20 text-indigo-300' // Active link style
            : 'text-gray-400 hover:bg-gray-700/50 hover:text-white' // Inactive link style
        }`}
      >
        {icon}
        {showText && <span className="font-medium">{children}</span>}
      </div>
    </Link>
  );
}

export default function AuthenticatedUI({ children, tenant }: { children: React.ReactNode; tenant: Tenant; }) {
  useSessionStatus();
  const { data: session, status } = useSession();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const pathname = usePathname();

  if (status === 'loading' || !session) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900">
        <div className="h-16 w-16 animate-spin rounded-full border-t-4 border-b-4 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar with Super Admin dark theme */}
      <aside className={`sticky top-0 h-screen flex-shrink-0 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'} bg-gray-800 text-white`}>
        <div className={`flex items-center gap-4 p-6 border-b border-gray-700 ${!isSidebarOpen && 'justify-center'}`}>
            {tenant.logoUrl && (
                <Image src={tenant.logoUrl} alt="Logo" width={isSidebarOpen ? 40 : 32} height={isSidebarOpen ? 40 : 32} className="rounded-md object-contain"/>
            )}
            {isSidebarOpen && (
              <h1 className="text-xl font-bold text-white truncate">
                  {tenant.businessName || 'Dashboard'}
              </h1>
            )}
        </div>
        <nav className="flex-grow space-y-1 px-4 mt-4">
            <NavLink href="/dashboard" icon={<HomeIcon className="h-6 w-6" />} isActive={pathname === '/dashboard'}>{isSidebarOpen && 'Dashboard'}</NavLink>
            <NavLink href="/products" icon={<ShoppingBagIcon className="h-6 w-6" />} isActive={pathname.startsWith('/products')}>{isSidebarOpen && 'Products'}</NavLink>
            <NavLink href="/inventory" icon={<ArchiveBoxIcon className="h-6 w-6" />} isActive={pathname.startsWith('/inventory')}>{isSidebarOpen && 'Inventory'}</NavLink>
            <NavLink href="/orders" icon={<ClipboardDocumentListIcon className="h-6 w-6" />} isActive={pathname.startsWith('/orders')}>{isSidebarOpen && 'Orders'}</NavLink>
            <NavLink href="/leads" icon={<UsersIcon className="h-6 w-6" />} isActive={pathname.startsWith('/leads')}>{isSidebarOpen && 'Leads'}</NavLink>
            <NavLink href="/search" icon={<MagnifyingGlassIcon className="h-6 w-6" />} isActive={pathname.startsWith('/search')}>{isSidebarOpen && 'Search'}</NavLink>
            <NavLink href="/shipping" icon={<TruckIcon className="h-6 w-6" />} isActive={pathname.startsWith('/shipping')}>{isSidebarOpen && 'Shipping'}</NavLink>
            
            {session.user.role === 'ADMIN' && (
              <>
                <div className="pt-4 pb-2 px-4 text-xs font-semibold text-gray-500 uppercase">{isSidebarOpen && 'Admin'}</div>
                <NavLink href="/reports" icon={<ChartBarIcon className="h-6 w-6" />} isActive={pathname.startsWith('/reports')}>{isSidebarOpen && 'Reports'}</NavLink>
                <NavLink href="/users" icon={<UsersIcon className="h-6 w-6" />} isActive={pathname.startsWith('/users')}>{isSidebarOpen && 'Users'}</NavLink>
                <NavLink href="/settings" icon={<CogIcon className="h-6 w-6" />} isActive={pathname.startsWith('/settings')}>{isSidebarOpen && 'Settings'}</NavLink>
              </>
            )}
        </nav>
        <div className="p-4 mt-auto border-t border-gray-700">
            <button onClick={() => signOut({ callbackUrl: '/auth/signin' })} className="flex w-full items-center space-x-4 rounded-lg px-4 py-2 text-gray-400 transition-colors hover:bg-gray-700/50 hover:text-white">
              <ArrowRightOnRectangleIcon className="h-6 w-6" />
              {isSidebarOpen && <span className="font-medium">Logout</span>}
            </button>
        </div>
      </aside>

      {/* Main content with Super Admin dark theme */}
      <main className="flex-1 overflow-x-hidden bg-gray-900 p-6 sm:p-8 lg:p-10">
        <div className="container mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}