'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [settings, setSettings] = useState({
    siteName: 'J-nex Holdings',
    allowRegistration: true,
    requireEmailVerification: true,
    maxTenantsPerUser: 5,
    defaultUserRole: 'USER',
    sessionTimeout: 24,
    enableMaintenance: false,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      router.push('/login');
      return;
    }
  }, [session, status, router]);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage('Settings saved successfully!');
    } catch (error) {
      setMessage('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

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
              <Link href="/superadmin" className="text-indigo-400 hover:text-indigo-300 mr-4">
                ← Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-white">System Settings</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message && (
          <div className={`p-4 rounded-md mb-6 ${
            message.includes('successfully') ? 'bg-green-600' : 'bg-red-600'
          } text-white`}>
            {message}
          </div>
        )}

        <div className="space-y-8">
          {/* General Settings */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-6">General Settings</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Site Name
                </label>
                <input
                  type="text"
                  value={settings.siteName}
                  onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Session Timeout (hours)
                </label>
                <input
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* User Management */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-6">User Management</h2>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="allowRegistration"
                  checked={settings.allowRegistration}
                  onChange={(e) => setSettings({ ...settings, allowRegistration: e.target.checked })}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="allowRegistration" className="ml-2 text-sm text-gray-300">
                  Allow new user registration
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="requireEmailVerification"
                  checked={settings.requireEmailVerification}
                  onChange={(e) => setSettings({ ...settings, requireEmailVerification: e.target.checked })}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="requireEmailVerification" className="ml-2 text-sm text-gray-300">
                  Require email verification
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Default User Role
                </label>
                <select
                  value={settings.defaultUserRole}
                  onChange={(e) => setSettings({ ...settings, defaultUserRole: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="USER">User</option>
                  <option value="TENANT_ADMIN">Tenant Admin</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Max Tenants Per User
                </label>
                <input
                  type="number"
                  value={settings.maxTenantsPerUser}
                  onChange={(e) => setSettings({ ...settings, maxTenantsPerUser: parseInt(e.target.value) })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* System Maintenance */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-6">System Maintenance</h2>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enableMaintenance"
                  checked={settings.enableMaintenance}
                  onChange={(e) => setSettings({ ...settings, enableMaintenance: e.target.checked })}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="enableMaintenance" className="ml-2 text-sm text-gray-300">
                  Enable maintenance mode
                </label>
              </div>
              
              {settings.enableMaintenance && (
                <div className="bg-yellow-600 p-4 rounded-md">
                  <p className="text-yellow-100 text-sm">
                    ⚠️ Maintenance mode will prevent all users except super admins from accessing the system.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-6">Security Settings</h2>
            
            <div className="space-y-4">
              <div className="bg-gray-700 p-4 rounded-md">
                <h3 className="text-lg font-medium text-white mb-2">Password Policy</h3>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Minimum 8 characters</li>
                  <li>• At least one uppercase letter</li>
                  <li>• At least one lowercase letter</li>
                  <li>• At least one number</li>
                  <li>• At least one special character</li>
                </ul>
              </div>
              
              <div className="bg-gray-700 p-4 rounded-md">
                <h3 className="text-lg font-medium text-white mb-2">Two-Factor Authentication</h3>
                <p className="text-sm text-gray-300">
                  2FA is recommended for all admin accounts. Users can enable it in their profile settings.
                </p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-6 py-2 rounded-md font-medium transition-colors"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}