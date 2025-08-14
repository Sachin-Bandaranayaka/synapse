'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import LineChart from '@/components/charts/line-chart';
import BarChart from '@/components/charts/bar-chart';
import PieChart from '@/components/charts/pie-chart';
import { OrderStatus } from '@prisma/client';
import { useExport } from '@/hooks/use-export';

interface ProfitReportProps {
  user: {
    tenantId: string;
    role: string;
  };
}

interface PeriodProfitReport {
  period: {
    start: Date;
    end: Date;
  };
  summary: {
    totalRevenue: number;
    totalCosts: number;
    netProfit: number;
    profitMargin: number;
    orderCount: number;
    returnCount: number;
  };
  breakdown: {
    productCosts: number;
    leadCosts: number;
    packagingCosts: number;
    printingCosts: number;
    returnCosts: number;
  };
  trends: Array<{
    date: string;
    revenue: number;
    costs: number;
    profit: number;
    orderCount: number;
  }>;
}

export function ProfitReport({ user }: ProfitReportProps) {
  const [reportData, setReportData] = useState<PeriodProfitReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Export functionality
  const exportHook = useExport();

  // Filter states
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [productId, setProductId] = useState('');
  const [userId, setUserId] = useState('');
  const [status, setStatus] = useState<OrderStatus | ''>('');

  // Products and users for filters
  const [products, setProducts] = useState<Array<{ id: string; name: string }>>([]);
  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    loadFilterOptions();
    loadReport();
  }, []);

  const loadFilterOptions = async () => {
    try {
      // Load products
      const productsResponse = await fetch('/api/products');
      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        setProducts(productsData.products || []);
      }

      // Load users
      const usersResponse = await fetch('/api/users');
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData.users || []);
      }
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  };

  const loadReport = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        period,
        ...(period === 'custom' && startDate && { startDate }),
        ...(period === 'custom' && endDate && { endDate }),
        ...(productId && { productId }),
        ...(userId && { userId }),
        ...(status && { status }),
      });

      const response = await fetch(`/api/reports/profit?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to load profit report');
      }

      const data = await response.json();
      setReportData(data);
    } catch (error) {
      console.error('Error loading profit report:', error);
      setError(error instanceof Error ? error.message : 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'excel') => {
    const params = {
      period,
      ...(period === 'custom' && startDate && { startDate }),
      ...(period === 'custom' && endDate && { endDate }),
      ...(productId && { productId }),
      ...(userId && { userId }),
      ...(status && { status }),
    };

    await exportHook.exportData(format, params, {
      endpoint: '/api/reports/profit/export',
      filename: `profit-report-${new Date().toISOString().split('T')[0]}`,
      onSuccess: (filename) => {
        console.log(`Export completed: ${filename}`);
      },
      onError: (error) => {
        setError(error);
      },
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading profit report...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-800">Error: {error}</div>
        <Button onClick={loadReport} className="mt-2">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">Report Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <Label htmlFor="period">Period</Label>
            <Select
              value={period}
              onValueChange={(value: any) => setPeriod(value)}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="custom">Custom</option>
            </Select>
          </div>

          {period === 'custom' && (
            <>
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </>
          )}

          <div>
            <Label htmlFor="product">Product</Label>
            <Select
              value={productId}
              onValueChange={setProductId}
            >
              <option value="">All Products</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="user">Assigned To</Label>
            <Select
              value={userId}
              onValueChange={setUserId}
            >
              <option value="">All Users</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              value={status}
              onValueChange={(value: any) => setStatus(value)}
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="SHIPPED">Shipped</option>
              <option value="DELIVERED">Delivered</option>
              <option value="RETURNED">Returned</option>
              <option value="CANCELLED">Cancelled</option>
            </Select>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button onClick={loadReport} disabled={loading}>
            {loading ? 'Loading...' : 'Apply Filters'}
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('csv')}
            disabled={exportHook.isExporting || !reportData}
          >
            {exportHook.isExporting ? 'Exporting...' : 'Export CSV'}
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('excel')}
            disabled={exportHook.isExporting || !reportData}
          >
            {exportHook.isExporting ? 'Exporting...' : 'Export Excel'}
          </Button>
        </div>

        {/* Export Progress Indicator */}
        {(exportHook.isExporting || exportHook.progress) && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center">
              {exportHook.isExporting && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              )}
              <span className="text-blue-800 text-sm">
                {exportHook.progress || 'Processing export...'}
              </span>
            </div>
          </div>
        )}

        {/* Export Error */}
        {exportHook.error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center justify-between">
              <span className="text-red-800 text-sm">{exportHook.error}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={exportHook.clearError}
              >
                Dismiss
              </Button>
            </div>
          </div>
        )}
      </Card>

      {reportData && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6">
              <div className="text-sm font-medium text-gray-500">Total Revenue</div>
              <div className="mt-2 text-3xl font-semibold text-green-600">
                {formatCurrency(reportData.summary.totalRevenue)}
              </div>
            </Card>
            <Card className="p-6">
              <div className="text-sm font-medium text-gray-500">Total Costs</div>
              <div className="mt-2 text-3xl font-semibold text-red-600">
                {formatCurrency(reportData.summary.totalCosts)}
              </div>
            </Card>
            <Card className="p-6">
              <div className="text-sm font-medium text-gray-500">Net Profit</div>
              <div className={`mt-2 text-3xl font-semibold ${
                reportData.summary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(reportData.summary.netProfit)}
              </div>
            </Card>
            <Card className="p-6">
              <div className="text-sm font-medium text-gray-500">Profit Margin</div>
              <div className={`mt-2 text-3xl font-semibold ${
                reportData.summary.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatPercentage(reportData.summary.profitMargin)}
              </div>
            </Card>
          </div>

          {/* Order Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6">
              <div className="text-sm font-medium text-gray-500">Total Orders</div>
              <div className="mt-2 text-2xl font-semibold text-blue-600">
                {reportData.summary.orderCount}
              </div>
            </Card>
            <Card className="p-6">
              <div className="text-sm font-medium text-gray-500">Returns</div>
              <div className="mt-2 text-2xl font-semibold text-orange-600">
                {reportData.summary.returnCount}
              </div>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Profit Trend Chart */}
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Profit Trends</h3>
              <LineChart
                data={{
                  labels: reportData.trends.map(trend => trend.date),
                  datasets: [
                    {
                      label: 'Profit',
                      data: reportData.trends.map(trend => trend.profit),
                      borderColor: '#10b981',
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    },
                  ],
                }}
                title="Profit Over Time"
              />
            </Card>

            {/* Cost Breakdown Pie Chart */}
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Cost Breakdown</h3>
              <PieChart
                data={{
                  labels: ['Product Costs', 'Lead Costs', 'Packaging Costs', 'Printing Costs', 'Return Costs']
                    .filter((_, index) => {
                      const values = [
                        reportData.breakdown.productCosts,
                        reportData.breakdown.leadCosts,
                        reportData.breakdown.packagingCosts,
                        reportData.breakdown.printingCosts,
                        reportData.breakdown.returnCosts,
                      ];
                      return values[index] > 0;
                    }),
                  datasets: [
                    {
                      data: [
                        reportData.breakdown.productCosts,
                        reportData.breakdown.leadCosts,
                        reportData.breakdown.packagingCosts,
                        reportData.breakdown.printingCosts,
                        reportData.breakdown.returnCosts,
                      ].filter(value => value > 0),
                      backgroundColor: [
                        '#ef4444',
                        '#f97316',
                        '#eab308',
                        '#22c55e',
                        '#3b82f6',
                      ],
                    },
                  ],
                }}
                title="Cost Distribution"
              />
            </Card>
          </div>

          {/* Revenue vs Costs Chart */}
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4">Revenue vs Costs Over Time</h3>
            <BarChart
              data={{
                labels: reportData.trends.map(trend => trend.date),
                datasets: [
                  {
                    label: 'Revenue',
                    data: reportData.trends.map(trend => trend.revenue),
                    backgroundColor: '#10b981',
                  },
                  {
                    label: 'Costs',
                    data: reportData.trends.map(trend => trend.costs),
                    backgroundColor: '#ef4444',
                  },
                ],
              }}
              title="Revenue vs Costs"
            />
          </Card>
        </>
      )}
    </div>
  );
}