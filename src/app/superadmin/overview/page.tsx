'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface SystemStats {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  activeUsers: number;
  recentTenants: Array<{
    id: string;
    name: string;
    domain: string;
    createdAt: string;
  }>;
  recentUsers: Array<{
    id: string;
    email: string;
    name: string | null;
    createdAt: string;
    tenant: {
      name: string;
    } | null;
  }>;
}

export default function OverviewPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      router.push('/login');
      return;
    }

    fetchStats();
  }, [session, status, router]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/superadmin/overview');
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError('Failed to load system statistics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
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
              <Link href="/superadmin" className="text-indigo-400 hover:text-indigo-300 mr-4">
                ← Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-white">System Overview</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-600 text-white p-4 rounded-md mb-6">
            {error}
          </div>
        )}

        {stats && (
          <>
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-2">Total Tenants</h3>
                <p className="text-3xl font-bold text-indigo-400">{stats.totalTenants}</p>
                <p className="text-sm text-gray-400 mt-1">
                  {stats.activeTenants} active
                </p>
              </div>
              
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-2">Total Users</h3>
                <p className="text-3xl font-bold text-green-400">{stats.totalUsers}</p>
                <p className="text-sm text-gray-400 mt-1">
                  {stats.activeUsers} active
                </p>
              </div>
              
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-2">Tenant Utilization</h3>
                <p className="text-3xl font-bold text-yellow-400">
                  {stats.totalTenants > 0 ? Math.round((stats.activeTenants / stats.totalTenants) * 100) : 0}%
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Active tenants
                </p>
              </div>
              
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-2">User Engagement</h3>
                <p className="text-3xl font-bold text-purple-400">
                  {stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}%
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Active users
                </p>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Tenants */}
              <div className="bg-gray-800 rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-700">
                  <h2 className="text-lg font-semibold text-white">Recent Tenants</h2>
                </div>
                <div className="p-6">
                  {stats.recentTenants.length > 0 ? (
                    <div className="space-y-4">
                      {stats.recentTenants.map((tenant) => (
                        <div key={tenant.id} className="flex justify-between items-center">
                          <div>
                            <div className="text-sm font-medium text-white">{tenant.name}</div>
                            <div className="text-sm text-gray-400">{tenant.domain}</div>
                          </div>
                          <div className="text-sm text-gray-400">
                            {new Date(tenant.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400">No recent tenants</p>
                  )}
                  <div className="mt-4">
                    <Link
                      href="/superadmin/tenants"
                      className="text-indigo-400 hover:text-indigo-300 text-sm"
                    >
                      View all tenants →
                    </Link>
                  </div>
                </div>
              </div>

              {/* Recent Users */}
              <div className="bg-gray-800 rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-700">
                  <h2 className="text-lg font-semibold text-white">Recent Users</h2>
                </div>
                <div className="p-6">
                  {stats.recentUsers.length > 0 ? (
                    <div className="space-y-4">
                      {stats.recentUsers.map((user) => (
                        <div key={user.id} className="flex justify-between items-center">
                          <div>
                            <div className="text-sm font-medium text-white">
                              {user.name || user.email}
                            </div>
                            <div className="text-sm text-gray-400">
                              {user.tenant?.name || 'No tenant'}
                            </div>
                          </div>
                          <div className="text-sm text-gray-400">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400">No recent users</p>
                  )}
                  <div className="mt-4">
                    <Link
                      href="/superadmin/users"
                      className="text-indigo-400 hover:text-indigo-300 text-sm"
                    >
                      View all users →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}