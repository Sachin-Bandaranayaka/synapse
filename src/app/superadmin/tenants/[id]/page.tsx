'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Tenant {
  id: string;
  name: string;
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
  invoicePrefix?: string;
  defaultShippingProvider?: string;
  backgroundColor?: string;
  cardColor?: string;
  fontColor?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    users: number;
    products: number;
    orders: number;
    leads: number;
  };
}

export default function TenantDetailPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      router.push('/login');
      return;
    }

    fetchTenant();
  }, [session, status, router, params.id]);

  const fetchTenant = async () => {
    try {
      const response = await fetch(`/api/superadmin/tenants/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setTenant(data);
      } else if (response.status === 404) {
        setError('Tenant not found');
      } else {
        setError('Failed to fetch tenant details');
      }
    } catch (error) {
      console.error('Failed to fetch tenant:', error);
      setError('Failed to fetch tenant details');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!tenant) return;

    try {
      const response = await fetch(`/api/superadmin/tenants/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !tenant.isActive
        }),
      });

      if (response.ok) {
        const updatedTenant = await response.json();
        setTenant(updatedTenant);
      } else {
        alert('Failed to update tenant status');
      }
    } catch (error) {
      console.error('Failed to update tenant:', error);
      alert('Failed to update tenant status');
    }
  };

  const handleDelete = async () => {
    if (!tenant) return;

    if (!confirm(`Are you sure you want to delete tenant "${tenant.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/superadmin/tenants/${params.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/superadmin/tenants');
      } else {
        alert('Failed to delete tenant');
      }
    } catch (error) {
      console.error('Failed to delete tenant:', error);
      alert('Failed to delete tenant');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">{error}</h1>
          <Link 
            href="/superadmin/tenants" 
            className="text-indigo-400 hover:text-indigo-300"
          >
            ← Back to Tenants
          </Link>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link 
                href="/superadmin/tenants" 
                className="text-indigo-400 hover:text-indigo-300 flex items-center"
              >
                ← Back to Tenants
              </Link>
              <h1 className="text-2xl font-bold text-white">{tenant.name}</h1>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                tenant.isActive 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {tenant.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleToggleStatus}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  tenant.isActive
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {tenant.isActive ? 'Deactivate' : 'Activate'}
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tenant Information */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Tenant Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Tenant Name
                  </label>
                  <p className="text-white">{tenant.name}</p>
                </div>
                
                {tenant.businessName && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Business Name
                    </label>
                    <p className="text-white">{tenant.businessName}</p>
                  </div>
                )}
                
                {tenant.businessPhone && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Business Phone
                    </label>
                    <p className="text-white">{tenant.businessPhone}</p>
                  </div>
                )}
                
                {tenant.invoicePrefix && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Invoice Prefix
                    </label>
                    <p className="text-white">{tenant.invoicePrefix}</p>
                  </div>
                )}
                
                {tenant.defaultShippingProvider && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Default Shipping Provider
                    </label>
                    <p className="text-white">{tenant.defaultShippingProvider.replace('_', ' ')}</p>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Created At
                  </label>
                  <p className="text-white">{new Date(tenant.createdAt).toLocaleDateString()}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Last Updated
                  </label>
                  <p className="text-white">{new Date(tenant.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>
              
              {tenant.businessAddress && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Business Address
                  </label>
                  <p className="text-white">{tenant.businessAddress}</p>
                </div>
              )}
            </div>

            {/* Theme Colors */}
            <div className="bg-gray-800 rounded-lg shadow-lg p-6 mt-6">
              <h2 className="text-xl font-semibold text-white mb-6">Theme Colors</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Background Color
                  </label>
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-8 h-8 rounded border border-gray-600"
                      style={{ backgroundColor: tenant.backgroundColor || '#1f2937' }}
                    ></div>
                    <span className="text-white">{tenant.backgroundColor || '#1f2937'}</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Card Color
                  </label>
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-8 h-8 rounded border border-gray-600"
                      style={{ backgroundColor: tenant.cardColor || '#374151' }}
                    ></div>
                    <span className="text-white">{tenant.cardColor || '#374151'}</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Font Color
                  </label>
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-8 h-8 rounded border border-gray-600"
                      style={{ backgroundColor: tenant.fontColor || '#ffffff' }}
                    ></div>
                    <span className="text-white">{tenant.fontColor || '#ffffff'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div>
            <div className="bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Statistics</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Users</span>
                  <span className="text-white font-semibold">{tenant._count.users}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Products</span>
                  <span className="text-white font-semibold">{tenant._count.products}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Orders</span>
                  <span className="text-white font-semibold">{tenant._count.orders}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Leads</span>
                  <span className="text-white font-semibold">{tenant._count.leads}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-800 rounded-lg shadow-lg p-6 mt-6">
              <h2 className="text-xl font-semibold text-white mb-6">Quick Actions</h2>
              <div className="space-y-3">
                <Link
                  href={`/superadmin/users?tenant=${tenant.id}`}
                  className="block w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-center"
                >
                  View Users
                </Link>
                <Link
                  href={`/superadmin/tenants/${tenant.id}/edit`}
                  className="block w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-center"
                >
                  Edit Tenant
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}