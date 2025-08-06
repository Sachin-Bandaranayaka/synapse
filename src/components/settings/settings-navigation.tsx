// src/components/settings/settings-navigation.tsx
'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SettingsNavigation() {
  const pathname = usePathname();
  
  const tabs = [
    { name: 'General', href: '/settings', current: pathname === '/settings' },
    { name: 'Integrations', href: '/settings/integrations', current: pathname === '/settings/integrations' },
  ];

  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        {tabs.map((tab) => (
          <Link
            key={tab.name}
            href={tab.href}
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
              tab.current
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            aria-current={tab.current ? 'page' : undefined}
          >
            {tab.name}
          </Link>
        ))}
      </nav>
    </div>
  );
}