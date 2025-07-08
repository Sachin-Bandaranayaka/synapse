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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
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
      <aside className={`print:hidden sticky top-0 h-screen flex-shrink-0 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'} bg-gray-800 text-white`}>
        {/* --- FIX: Updated header with toggle button --- */}
        <div className={`flex items-center p-4 border-b border-gray-700 ${isSidebarOpen ? 'justify-between' : 'justify-center'}`}>
            {isSidebarOpen && (
                <div className="flex items-center gap-3">
                    {tenant.logoUrl && (
                        <Image src={tenant.logoUrl} alt="Logo" width={32} height={32} className="rounded-md object-contain"/>
                    )}
                    <h1 className="text-xl font-bold text-white truncate">
                        {tenant.businessName || 'Dashboard'}
                    </h1>
                </div>
            )}
            <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
                className="p-2 rounded-md hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-white"
            >
                <Bars3Icon className="h-6 w-6 text-gray-300" />
            </button>
        </div>
        <nav className="flex-grow space-y-1 px-4 mt-4">
            {(userRole === 'ADMIN' || userPermissions.includes('VIEW_DASHBOARD')) && <NavLink href="/dashboard" icon={<HomeIcon className="h-6 w-6" />} isActive={pathname === '/dashboard'}>{isSidebarOpen && 'Dashboard'}</NavLink>}
            {(userRole === 'ADMIN' || userPermissions.includes('VIEW_PRODUCTS')) && <NavLink href="/products" icon={<ShoppingBagIcon className="h-6 w-6" />} isActive={pathname.startsWith('/products')}>{isSidebarOpen && 'Products'}</NavLink>}
            {(userRole === 'ADMIN' || userPermissions.includes('VIEW_INVENTORY')) && <NavLink href="/inventory" icon={<ArchiveBoxIcon className="h-6 w-6" />} isActive={pathname.startsWith('/inventory')}>{isSidebarOpen && 'Inventory'}</NavLink>}
            {(userRole === 'ADMIN' || userPermissions.includes('VIEW_ORDERS')) && <NavLink href="/orders" icon={<ClipboardDocumentListIcon className="h-6 w-6" />} isActive={pathname.startsWith('/orders')}>{isSidebarOpen && 'Orders'}</NavLink>}
            {(userRole === 'ADMIN' || userPermissions.includes('VIEW_LEADS')) && <NavLink href="/leads" icon={<UsersIcon className="h-6 w-6" />} isActive={pathname.startsWith('/leads')}>{isSidebarOpen && 'Leads'}</NavLink>}
            {(userRole === 'ADMIN' || userPermissions.includes('VIEW_SEARCH')) && <NavLink href="/search" icon={<MagnifyingGlassIcon className="h-6 w-6" />} isActive={pathname.startsWith('/search')}>{isSidebarOpen && 'Search'}</NavLink>}
            {(userRole === 'ADMIN' || userPermissions.includes('VIEW_SHIPPING')) && <NavLink href="/shipping" icon={<TruckIcon className="h-6 w-6" />} isActive={pathname.startsWith('/shipping')}>{isSidebarOpen && 'Shipping'}</NavLink>}
            
            {(userRole === 'ADMIN' || userPermissions.includes('VIEW_REPORTS') || userPermissions.includes('MANAGE_USERS') || userPermissions.includes('MANAGE_SETTINGS')) && (
              <>
                <div className="pt-4 pb-2 px-4 text-xs font-semibold text-gray-500 uppercase">{isSidebarOpen && 'Admin'}</div>
                {(userRole === 'ADMIN' || userPermissions.includes('VIEW_REPORTS')) && <NavLink href="/reports" icon={<ChartBarIcon className="h-6 w-6" />} isActive={pathname.startsWith('/reports')}>{isSidebarOpen && 'Reports'}</NavLink>}
                {(userRole === 'ADMIN' || userPermissions.includes('MANAGE_USERS')) && <NavLink href="/users" icon={<UsersIcon className="h-6 w-6" />} isActive={pathname.startsWith('/users')}>{isSidebarOpen && 'Users'}</NavLink>}
                {(userRole === 'ADMIN' || userPermissions.includes('MANAGE_SETTINGS')) && <NavLink href="/settings" icon={<CogIcon className="h-6 w-6" />} isActive={pathname.startsWith('/settings')}>{isSidebarOpen && 'Settings'}</NavLink>}
              </>
            )}
        </nav>
        <div className="p-4 mt-auto border-t border-gray-700">
            <button onClick={() => signOut({ callbackUrl: '/auth/signin' })} className={`flex w-full items-center space-x-4 rounded-lg px-4 py-2 text-gray-400 transition-colors hover:bg-gray-700/50 hover:text-white ${!isSidebarOpen && 'justify-center'}`}>
              <ArrowRightOnRectangleIcon className="h-6 w-6" />
              {isSidebarOpen && <span className="font-medium">Logout</span>}
            </button>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden">
        <div className="p-6 sm:p-8 lg:p-10">
            {children}
        </div>
      </main>
    </div>
  );
}
