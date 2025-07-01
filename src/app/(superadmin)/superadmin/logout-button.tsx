// src/app/(superadmin)/superadmin/logout-button.tsx
'use client';

import { signOut } from 'next-auth/react';
import { ArrowLeftOnRectangleIcon } from '@heroicons/react/24/outline';

export function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/auth/signin' })}
      className="flex w-full items-center space-x-3 rounded-lg px-3 py-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
    >
      <ArrowLeftOnRectangleIcon className="h-6 w-6" />
      <span className="font-medium">Logout</span>
    </button>
  );
}