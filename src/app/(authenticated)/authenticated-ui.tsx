'use client';

import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useSessionStatus } from '@/hooks/use-session-status';
import { Tenant } from '@prisma/client';
import {
  HomeIcon, ShoppingBagIcon, ArchiveBoxIcon, ClipboardDocumentListIcon,
  UsersIcon, ChartBarIcon, MagnifyingGlassIcon, TruckIcon, CogIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon, // --- FIX: Import the hamburger menu icon
} from '@heroicons/react/24/outline';

function NavLink({ href, icon, children, isActive }: { href: string; icon: React.ReactNode; children: React.ReactNode; isActive: boolean; }) {
  const showText = typeof children === 'string' && children.length > 0;
  return (
    <Link href={href}>
      <div
        className={`flex items-center space-x-4 rounded-lg px-4 py-2 transition-colors ${
          isActive
            ? 'bg-indigo-600/20 text-indigo-300'
            : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const pathname = usePathname();

  if (status === 'loading' || !session) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900">
        <div className="h-16 w-16 animate-spin rounded-full border-t-4 border-b-4 border-indigo-500"></div>
      </div>
    );
  }

  const userRole = session.user.role;
  const userPermissions = session.user.permissions || [];

  return (
    <div className="flex min-h-screen bg-gray-900">
      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-900/80 lg:hidden" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`print:hidden fixed lg:sticky top-0 h-screen flex-shrink-0 flex flex-col transition-all duration-300 z-50 lg:z-auto ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 w-64 bg-gray-800 text-white`}>
        {/* Header with logo */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-700">
            {tenant.logoUrl && (
                <Image src={tenant.logoUrl} alt="Logo" width={32} height={32} className="rounded-md object-contain"/>
            )}
            <h1 className="text-xl font-bold text-white truncate">
                {tenant.businessName || 'Dashboard'}
            </h1>
        </div>
        <nav className="flex-grow space-y-1 px-4 mt-4">
            {(userRole === 'ADMIN' || userPermissions.includes('VIEW_DASHBOARD')) && <NavLink href="/dashboard" icon={<HomeIcon className="h-6 w-6" />} isActive={pathname === '/dashboard'}>Dashboard</NavLink>}
            {(userRole === 'ADMIN' || userPermissions.includes('VIEW_PRODUCTS')) && <NavLink href="/products" icon={<ShoppingBagIcon className="h-6 w-6" />} isActive={pathname.startsWith('/products')}>Products</NavLink>}
            {(userRole === 'ADMIN' || userPermissions.includes('VIEW_INVENTORY')) && <NavLink href="/inventory" icon={<ArchiveBoxIcon className="h-6 w-6" />} isActive={pathname.startsWith('/inventory')}>Inventory</NavLink>}
            {(userRole === 'ADMIN' || userPermissions.includes('VIEW_ORDERS')) && <NavLink href="/orders" icon={<ClipboardDocumentListIcon className="h-6 w-6" />} isActive={pathname.startsWith('/orders')}>Orders</NavLink>}
            {(userRole === 'ADMIN' || userPermissions.includes('VIEW_LEADS')) && <NavLink href="/leads" icon={<UsersIcon className="h-6 w-6" />} isActive={pathname.startsWith('/leads')}>Leads</NavLink>}
            {(userRole === 'ADMIN' || userPermissions.includes('VIEW_SEARCH')) && <NavLink href="/search" icon={<MagnifyingGlassIcon className="h-6 w-6" />} isActive={pathname.startsWith('/search')}>Search</NavLink>}
            {(userRole === 'ADMIN' || userPermissions.includes('VIEW_SHIPPING')) && <NavLink href="/shipping" icon={<TruckIcon className="h-6 w-6" />} isActive={pathname.startsWith('/shipping')}>Shipping</NavLink>}
            
            {(userRole === 'ADMIN' || userPermissions.includes('VIEW_REPORTS') || userPermissions.includes('MANAGE_USERS') || userPermissions.includes('MANAGE_SETTINGS')) && (
              <>
                <div className="pt-4 pb-2 text-xs font-semibold text-gray-500 uppercase">Admin</div>
                {(userRole === 'ADMIN' || userPermissions.includes('VIEW_REPORTS')) && <NavLink href="/reports" icon={<ChartBarIcon className="h-6 w-6" />} isActive={pathname.startsWith('/reports')}>Reports</NavLink>}
                {(userRole === 'ADMIN' || userPermissions.includes('MANAGE_USERS')) && <NavLink href="/users" icon={<UsersIcon className="h-6 w-6" />} isActive={pathname.startsWith('/users')}>Users</NavLink>}
                {(userRole === 'ADMIN' || userPermissions.includes('MANAGE_SETTINGS')) && <NavLink href="/settings" icon={<CogIcon className="h-6 w-6" />} isActive={pathname.startsWith('/settings')}>Settings</NavLink>}
              </>
            )}
        </nav>
        <div className="p-4 mt-auto border-t border-gray-700">
            <button onClick={() => signOut({ callbackUrl: '/auth/signin' })} className="flex w-full items-center space-x-4 rounded-lg px-4 py-2 text-gray-400 transition-colors hover:bg-gray-700/50 hover:text-white">
              <ArrowRightOnRectangleIcon className="h-6 w-6" />
              <span className="font-medium">Logout</span>
            </button>
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-1 overflow-x-hidden lg:ml-0">
        {/* Mobile header */}
        <div className="lg:hidden bg-gray-800 border-b border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {tenant.logoUrl && (
                <Image src={tenant.logoUrl} alt="Logo" width={32} height={32} className="rounded-md object-contain"/>
              )}
              <h1 className="text-xl font-bold text-white">
                {tenant.businessName || 'Dashboard'}
              </h1>
            </div>
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 rounded-md hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-white"
            >
              <Bars3Icon className="h-6 w-6 text-gray-300" />
            </button>
          </div>
        </div>
        
        <div className="p-4 sm:p-6 lg:p-8">
            {children}
        </div>
      </main>
    </div>
  );
}
