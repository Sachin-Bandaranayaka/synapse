// src/app/(authenticated)/settings/layout.tsx

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SettingsNavigation } from "@/components/settings/settings-navigation";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session?.user?.tenantId) {
    return redirect('/auth/signin');
  }

  // Only Admins can access the settings pages
  if (session.user.role !== 'ADMIN') {
    return redirect('/unauthorized');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Manage your business profile and integration settings.
        </p>
      </div>
      <SettingsNavigation />
      <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-lg ring-1 ring-gray-200 dark:ring-white/10">
        {children}
      </div>
    </div>
  );
}