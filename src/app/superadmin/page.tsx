'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { motion } from 'framer-motion';

export default function SuperAdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      router.push('/auth/signin');
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-indigo-400">J-nex Holdings</h1>
              <span className="ml-4 px-3 py-1 bg-red-600 text-white text-sm rounded-full">
                Super Admin
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-300">Welcome, {session.user.name || session.user.email}</span>
              <button
                onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-gray-800 overflow-hidden shadow rounded-lg"
          >
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-white mb-4">Super Admin Dashboard</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gray-700 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-white mb-2">System Overview</h3>
                  <p className="text-gray-300">Monitor system-wide statistics and health.</p>
                  <button 
                    onClick={() => router.push('/superadmin/overview')}
                    className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    View Details
                  </button>
                </div>
                
                <div className="bg-gray-700 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-white mb-2">Tenant Management</h3>
                  <p className="text-gray-300">Manage all tenants and their configurations.</p>
                  <button 
                    onClick={() => router.push('/superadmin/tenants')}
                    className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Manage Tenants
                  </button>
                </div>
                
                <div className="bg-gray-700 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-white mb-2">User Administration</h3>
                  <p className="text-gray-300">Manage system users and permissions.</p>
                  <button 
                    onClick={() => router.push('/superadmin/users')}
                    className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Manage Users
                  </button>
                </div>
                
                <div className="bg-gray-700 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-white mb-2">System Settings</h3>
                  <p className="text-gray-300">Configure global system settings.</p>
                  <button 
                    onClick={() => router.push('/superadmin/settings')}
                    className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Settings
                  </button>
                </div>
                
                <div className="bg-gray-700 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-white mb-2">Analytics</h3>
                  <p className="text-gray-300">View system-wide analytics and reports.</p>
                  <button 
                    onClick={() => router.push('/superadmin/analytics')}
                    className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    View Analytics
                  </button>
                </div>
                
                <div className="bg-gray-700 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-white mb-2">Maintenance</h3>
                  <p className="text-gray-300">System maintenance and backup tools.</p>
                  <button 
                    onClick={() => router.push('/superadmin/maintenance')}
                    className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Maintenance
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}