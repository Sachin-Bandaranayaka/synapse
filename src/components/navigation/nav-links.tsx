'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

export function NavLinks() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const links = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/products', label: 'Products' },
    { href: '/leads', label: 'Leads' },
    { href: '/orders', label: 'Orders' },
    { href: '/returns', label: 'Returns' },
    { href: '/inventory', label: 'Inventory' },
    { href: '/reports', label: 'Reports' },
    ...(session?.user?.role === 'ADMIN' ? [
      { href: '/users', label: 'Users' },
    ] : []),
  ];

  return (
    <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
      {links.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
              isActive
                ? 'border-b-2 border-indigo-500 text-gray-900'
                : 'border-b-2 border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}
