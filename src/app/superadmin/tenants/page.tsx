'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Tenant {
  id: string;
  name: string;
  domain: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: string;
  _count: {
    users: number;
  };
}

export default function TenantsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      router.push('/login');
      return;
    }

    fetchTenants();
  }, [session, status, router]);

  const fetchTenants = async () => {
    try {
      const response = await fetch('/api/superadmin/tenants');
      if (!response.ok) {
        throw new Error('Failed to fetch tenants');
      }
      const data = await response.json();
      setTenants(data);
    } catch (err) {
      setError('Failed to load tenants');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateTenantStatus = async (tenantId: string, status: string) => {
    try {
      const response = await fetch(`/api/superadmin/tenants/${tenantId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update tenant status');
      }

      await fetchTenants(); // Refresh the list
    } catch (err) {
      setError('Failed to update tenant status');
      console.error(err);
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
              <h1 className="text-3xl font-bold text-white">Tenant Management</h1>
            </div>
            <Link
              href="/superadmin/tenants/create"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Create New Tenant
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-600 text-white p-4 rounded-md mb-6">
            {error}
          </div>
        )}

        <div className="bg-gray-800 shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-white">All Tenants</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Domain
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Users
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {tenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">{tenant.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">{tenant.domain}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        tenant.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                        tenant.status === 'INACTIVE' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {tenant.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {tenant._count.users}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {new Date(tenant.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <select
                        value={tenant.status}
                        onChange={(e) => updateTenantStatus(tenant.id, e.target.value)}
                        className="bg-gray-700 text-white border border-gray-600 rounded px-2 py-1 text-xs"
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                        <option value="SUSPENDED">Suspended</option>
                      </select>
                      <Link
                        href={`/superadmin/tenants/${tenant.id}`}
                        className="text-indigo-400 hover:text-indigo-300"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {tenants.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-400">
                No tenants found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}