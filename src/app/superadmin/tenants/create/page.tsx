'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function CreateTenantPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    businessName: '',
    businessAddress: '',
    businessPhone: '',
    invoicePrefix: '',
    defaultShippingProvider: 'FARDA_EXPRESS',
    backgroundColor: '#1f2937',
    cardColor: '#374151',
    fontColor: '#ffffff',
    // Admin user credentials
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      router.push('/login');
      return;
    }
  }, [session, status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validate required fields
    if (!formData.name || !formData.adminName || !formData.adminEmail || !formData.adminPassword) {
      alert('Please fill in all required fields');
      setLoading(false);
      return;
    }

    // Validate password confirmation
    if (formData.adminPassword !== formData.confirmPassword) {
      alert('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password strength
    if (formData.adminPassword.length < 6) {
      alert('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/superadmin/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('Tenant and admin user created successfully!');
        router.push('/superadmin/tenants');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to create tenant:', error);
      alert('Failed to create tenant');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
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
            <div className="flex items-center space-x-4">
              <Link 
                href="/superadmin/tenants" 
                className="text-indigo-400 hover:text-indigo-300 flex items-center"
              >
                ← Back to Tenants
              </Link>
              <h1 className="text-2xl font-bold text-white">Create New Tenant</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                  Tenant Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter tenant name"
                />
              </div>

              <div>
                <label htmlFor="businessName" className="block text-sm font-medium text-gray-300 mb-2">
                  Business Name
                </label>
                <input
                  type="text"
                  id="businessName"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter business name"
                />
              </div>

              <div>
                <label htmlFor="businessPhone" className="block text-sm font-medium text-gray-300 mb-2">
                  Business Phone
                </label>
                <input
                  type="tel"
                  id="businessPhone"
                  name="businessPhone"
                  value={formData.businessPhone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter business phone"
                />
              </div>

              <div>
                <label htmlFor="invoicePrefix" className="block text-sm font-medium text-gray-300 mb-2">
                  Invoice Prefix
                </label>
                <input
                  type="text"
                  id="invoicePrefix"
                  name="invoicePrefix"
                  value={formData.invoicePrefix}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., INV"
                />
              </div>

              <div>
                <label htmlFor="defaultShippingProvider" className="block text-sm font-medium text-gray-300 mb-2">
                  Default Shipping Provider
                </label>
                <select
                  id="defaultShippingProvider"
                  name="defaultShippingProvider"
                  value={formData.defaultShippingProvider}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="FARDA_EXPRESS">Farda Express</option>
                  <option value="TRANS_EXPRESS">Trans Express</option>
                  <option value="SL_POST">SL Post</option>
                  <option value="ROYAL_EXPRESS">Royal Express</option>
                </select>
              </div>

              <div>
                <label htmlFor="backgroundColor" className="block text-sm font-medium text-gray-300 mb-2">
                  Background Color
                </label>
                <input
                  type="color"
                  id="backgroundColor"
                  name="backgroundColor"
                  value={formData.backgroundColor}
                  onChange={handleInputChange}
                  className="w-full h-10 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="cardColor" className="block text-sm font-medium text-gray-300 mb-2">
                  Card Color
                </label>
                <input
                  type="color"
                  id="cardColor"
                  name="cardColor"
                  value={formData.cardColor}
                  onChange={handleInputChange}
                  className="w-full h-10 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="fontColor" className="block text-sm font-medium text-gray-300 mb-2">
                  Font Color
                </label>
                <input
                  type="color"
                  id="fontColor"
                  name="fontColor"
                  value={formData.fontColor}
                  onChange={handleInputChange}
                  className="w-full h-10 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="businessAddress" className="block text-sm font-medium text-gray-300 mb-2">
                Business Address
              </label>
              <input
                type="text"
                id="businessAddress"
                name="businessAddress"
                value={formData.businessAddress}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter full business address"
              />
            </div>

            {/* Admin User Credentials Section */}
            <div className="border-t border-gray-600 pt-6">
              <h3 className="text-lg font-medium text-white mb-4">Admin User Credentials</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="adminName" className="block text-sm font-medium text-gray-300 mb-2">
                    Admin Name *
                  </label>
                  <input
                    type="text"
                    id="adminName"
                    name="adminName"
                    value={formData.adminName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter admin full name"
                  />
                </div>

                <div>
                  <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-300 mb-2">
                    Admin Email *
                  </label>
                  <input
                    type="email"
                    id="adminEmail"
                    name="adminEmail"
                    value={formData.adminEmail}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter admin email address"
                  />
                </div>

                <div>
                  <label htmlFor="adminPassword" className="block text-sm font-medium text-gray-300 mb-2">
                    Admin Password *
                  </label>
                  <input
                    type="password"
                    id="adminPassword"
                    name="adminPassword"
                    value={formData.adminPassword}
                    onChange={handleInputChange}
                    required
                    minLength={6}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter admin password (min 6 characters)"
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    minLength={6}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Confirm admin password"
                  />
                </div>
              </div>
              <p className="text-sm text-gray-400 mt-2">
                This will create the initial admin user account for the tenant. The admin will be able to log in and manage their tenant.
              </p>
            </div>

            <div className="flex justify-end space-x-4">
              <Link
                href="/superadmin/tenants"
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Tenant'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}