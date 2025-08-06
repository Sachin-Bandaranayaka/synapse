'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function MaintenancePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [systemInfo, setSystemInfo] = useState({
    uptime: '5 days, 12 hours',
    version: '1.0.0',
    database: 'Connected',
    storage: '85% used',
    memory: '2.1GB / 4GB',
    cpu: '45%',
  });

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      router.push('/login');
      return;
    }
  }, [session, status, router]);

  const handleAction = async (action: string) => {
    setLoading(true);
    setMessage('');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      setMessage(`${action} completed successfully!`);
    } catch (error) {
      setMessage(`Failed to ${action.toLowerCase()}.`);
    } finally {
      setLoading(false);
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
              <h1 className="text-3xl font-bold text-white">System Maintenance</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message && (
          <div className={`p-4 rounded-md mb-6 ${
            message.includes('successfully') ? 'bg-green-600' : 'bg-red-600'
          } text-white`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* System Information */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-6">System Information</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-300">System Uptime:</span>
                <span className="text-white">{systemInfo.uptime}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-300">Version:</span>
                <span className="text-white">{systemInfo.version}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-300">Database Status:</span>
                <span className="text-green-400">{systemInfo.database}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-300">Storage Usage:</span>
                <span className="text-yellow-400">{systemInfo.storage}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-300">Memory Usage:</span>
                <span className="text-white">{systemInfo.memory}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-300">CPU Usage:</span>
                <span className="text-white">{systemInfo.cpu}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-6">Quick Actions</h2>
            
            <div className="space-y-4">
              <button
                onClick={() => handleAction('Cache Clear')}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                Clear System Cache
              </button>
              
              <button
                onClick={() => handleAction('Database Optimization')}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                Optimize Database
              </button>
              
              <button
                onClick={() => handleAction('Log Cleanup')}
                disabled={loading}
                className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                Clean Old Logs
              </button>
              
              <button
                onClick={() => handleAction('System Health Check')}
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                Run Health Check
              </button>
            </div>
          </div>
        </div>

        {/* Backup & Restore */}
        <div className="mt-8 bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-white mb-6">Backup & Restore</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-white mb-4">Database Backup</h3>
              <p className="text-gray-300 mb-4">
                Create a full backup of the database including all tenant data.
              </p>
              <button
                onClick={() => handleAction('Database Backup')}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                Create Backup
              </button>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-white mb-4">System Restore</h3>
              <p className="text-gray-300 mb-4">
                Restore system from a previous backup. Use with caution.
              </p>
              <button
                onClick={() => handleAction('System Restore')}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                Restore System
              </button>
            </div>
          </div>
        </div>

        {/* System Logs */}
        <div className="mt-8 bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-white mb-6">Recent System Logs</h2>
          
          <div className="bg-gray-900 p-4 rounded-md font-mono text-sm">
            <div className="text-green-400">[2024-01-15 10:30:15] INFO: System startup completed</div>
            <div className="text-blue-400">[2024-01-15 10:31:22] INFO: Database connection established</div>
            <div className="text-yellow-400">[2024-01-15 10:32:45] WARN: High memory usage detected (85%)</div>
            <div className="text-green-400">[2024-01-15 10:33:12] INFO: Cache cleared successfully</div>
            <div className="text-blue-400">[2024-01-15 10:34:01] INFO: New tenant registered: example.com</div>
            <div className="text-green-400">[2024-01-15 10:35:33] INFO: Backup completed successfully</div>
          </div>
          
          <div className="mt-4 flex space-x-4">
            <button
              onClick={() => handleAction('Log Download')}
              disabled={loading}
              className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Download Full Logs
            </button>
            
            <button
              onClick={() => handleAction('Log Refresh')}
              disabled={loading}
              className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Refresh Logs
            </button>
          </div>
        </div>

        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
                <span className="text-white">Processing...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}