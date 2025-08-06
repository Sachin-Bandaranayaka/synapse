'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [analytics, setAnalytics] = useState({
    userGrowth: [],
    tenantActivity: [],
    systemPerformance: [],
    revenueMetrics: [],
    usageStats: [],
    errorRates: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      router.push('/login');
      return;
    }

    fetchAnalytics();
  }, [session, status, router]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/superadmin/analytics');
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
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
              <h1 className="text-3xl font-bold text-white">Analytics</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            <span className="ml-3 text-white">Loading analytics...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-4">User Growth</h3>
              <div className="h-32 bg-gray-700 rounded p-4">
                <div className="flex items-end justify-between h-full">
                  <div className="bg-blue-500 w-4 h-8"></div>
                  <div className="bg-blue-500 w-4 h-12"></div>
                  <div className="bg-blue-500 w-4 h-16"></div>
                  <div className="bg-blue-500 w-4 h-20"></div>
                  <div className="bg-blue-500 w-4 h-24"></div>
                  <div className="bg-blue-500 w-4 h-28"></div>
                  <div className="bg-blue-500 w-4 h-32"></div>
                </div>
              </div>
              <p className="text-sm text-gray-400 mt-2">+12% this month</p>
            </div>
            
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-4">Tenant Activity</h3>
              <div className="h-32 bg-gray-700 rounded p-4 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full border-4 border-green-500 border-t-transparent animate-spin"></div>
              </div>
              <p className="text-sm text-gray-400 mt-2">85% active tenants</p>
            </div>
            
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-4">System Performance</h3>
              <div className="h-32 bg-gray-700 rounded p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">CPU Usage</span>
                    <span className="text-white">45%</span>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{width: '45%'}}></div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Memory</span>
                    <span className="text-white">68%</span>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div className="bg-orange-500 h-2 rounded-full" style={{width: '68%'}}></div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Storage</span>
                    <span className="text-white">32%</span>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{width: '32%'}}></div>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-400 mt-2">All systems operational</p>
            </div>
            
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-4">Revenue Metrics</h3>
              <div className="h-32 bg-gray-700 rounded p-4">
                <div className="flex items-end justify-between h-full space-x-1">
                  <div className="bg-green-500 w-3 h-12"></div>
                  <div className="bg-green-500 w-3 h-16"></div>
                  <div className="bg-green-500 w-3 h-10"></div>
                  <div className="bg-green-500 w-3 h-20"></div>
                  <div className="bg-green-500 w-3 h-14"></div>
                  <div className="bg-green-500 w-3 h-24"></div>
                  <div className="bg-green-500 w-3 h-18"></div>
                  <div className="bg-green-500 w-3 h-28"></div>
                  <div className="bg-green-500 w-3 h-22"></div>
                  <div className="bg-green-500 w-3 h-32"></div>
                </div>
              </div>
              <p className="text-sm text-gray-400 mt-2">$24,500 this month</p>
            </div>
            
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-4">Usage Statistics</h3>
              <div className="h-32 bg-gray-700 rounded p-4">
                <div className="grid grid-cols-2 gap-4 h-full">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">1,247</div>
                    <div className="text-xs text-gray-400">API Calls</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">98.5%</div>
                    <div className="text-xs text-gray-400">Uptime</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">156</div>
                    <div className="text-xs text-gray-400">Active Users</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">23</div>
                    <div className="text-xs text-gray-400">Tenants</div>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-400 mt-2">Real-time metrics</p>
            </div>
            
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-4">Error Rates</h3>
              <div className="h-32 bg-gray-700 rounded p-4">
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-400">0.02%</div>
                    <div className="text-sm text-gray-400">Error Rate</div>
                    <div className="mt-2 flex items-center justify-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-xs text-green-400">Excellent</span>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-400 mt-2">Last 24 hours</p>
            </div>
          </div>
        )}
        
        <div className="mt-8 bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-white mb-4">Analytics Dashboard</h2>
          <p className="text-gray-300 mb-4">
            This section will contain detailed analytics and reporting features including:
          </p>
          <ul className="list-disc list-inside text-gray-300 space-y-2">
            <li>User engagement metrics</li>
            <li>Tenant usage patterns</li>
            <li>System performance monitoring</li>
            <li>Revenue and billing analytics</li>
            <li>Custom report generation</li>
            <li>Real-time dashboard widgets</li>
          </ul>
        </div>
      </div>
    </div>
  );
}