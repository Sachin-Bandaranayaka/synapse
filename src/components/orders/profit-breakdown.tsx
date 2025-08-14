'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import PieChart from '@/components/charts/pie-chart';
import BarChart from '@/components/charts/bar-chart';
import { TrendingUp, TrendingDown, DollarSign, Percent, AlertTriangle } from 'lucide-react';
import { ProfitMarginTooltip } from '@/components/ui/tooltip';

interface ProfitBreakdown {
  orderId: string;
  revenue: number;
  costs: {
    product: number;
    lead: number;
    packaging: number;
    printing: number;
    return: number;
    total: number;
  };
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
  isReturn: boolean;
}

interface ProfitBreakdownProps {
  orderId: string;
  showDetails?: boolean;
  className?: string;
}

export function ProfitBreakdownCard({ orderId, showDetails = true, className = '' }: ProfitBreakdownProps) {
  const [breakdown, setBreakdown] = useState<ProfitBreakdown | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfitBreakdown();
  }, [orderId]);

  const fetchProfitBreakdown = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/orders/${orderId}/costs`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle specific error types
        if (response.status === 404) {
          throw new Error('Order not found or you may not have access to it');
        }
        
        if (response.status === 403) {
          throw new Error('You do not have permission to view this order\'s profit data');
        }
        
        // Use server-provided error message if available
        const errorMessage = errorData.error || 'Failed to fetch profit breakdown';
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Validate the response data structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid profit data received from server');
      }
      
      if (!data.orderId || !data.costs || typeof data.revenue !== 'number') {
        throw new Error('Incomplete profit data received. Please refresh and try again.');
      }
      
      setBreakdown(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load profit data';
      setError(errorMessage);
      console.error('Profit breakdown fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(1)}%`;
  };

  const getProfitColor = (profit: number) => {
    if (profit > 0) return 'text-green-400';
    if (profit < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  const getProfitIcon = (profit: number) => {
    if (profit > 0) return <TrendingUp className="h-4 w-4 text-green-400" />;
    if (profit < 0) return <TrendingDown className="h-4 w-4 text-red-400" />;
    return <DollarSign className="h-4 w-4 text-gray-400" />;
  };

  const getProfitStatus = (profitMargin: number) => {
    if (profitMargin >= 30) return { label: 'Excellent', color: 'text-green-400', bgColor: 'bg-green-900/20' };
    if (profitMargin >= 20) return { label: 'Good', color: 'text-green-300', bgColor: 'bg-green-900/20' };
    if (profitMargin >= 10) return { label: 'Fair', color: 'text-yellow-400', bgColor: 'bg-yellow-900/20' };
    if (profitMargin >= 0) return { label: 'Low', color: 'text-orange-400', bgColor: 'bg-orange-900/20' };
    return { label: 'Loss', color: 'text-red-400', bgColor: 'bg-red-900/20' };
  };

  const getCostChartData = (costs: ProfitBreakdown['costs']) => {
    const costItems = [
      { label: 'Product Cost', value: costs.product, color: '#ef4444' },
      { label: 'Lead Acquisition', value: costs.lead, color: '#f97316' },
      { label: 'Packaging', value: costs.packaging, color: '#eab308' },
      { label: 'Printing', value: costs.printing, color: '#06b6d4' },
      { label: 'Return Shipping', value: costs.return, color: '#8b5cf6' },
    ].filter(item => item.value > 0);

    return {
      labels: costItems.map(item => item.label),
      datasets: [{
        data: costItems.map(item => item.value),
        backgroundColor: costItems.map(item => item.color),
        borderColor: costItems.map(item => item.color),
        borderWidth: 1,
      }]
    };
  };

  const getRevenueVsCostData = (breakdown: ProfitBreakdown) => {
    return {
      labels: ['Financial Breakdown'],
      datasets: [
        {
          label: 'Revenue',
          data: [breakdown.revenue],
          backgroundColor: '#10b981',
          borderColor: '#10b981',
          borderWidth: 1,
        },
        {
          label: 'Total Costs',
          data: [breakdown.costs.total],
          backgroundColor: '#ef4444',
          borderColor: '#ef4444',
          borderWidth: 1,
        },
        {
          label: 'Net Profit',
          data: [breakdown.netProfit],
          backgroundColor: breakdown.netProfit >= 0 ? '#3b82f6' : '#f59e0b',
          borderColor: breakdown.netProfit >= 0 ? '#3b82f6' : '#f59e0b',
          borderWidth: 1,
        }
      ]
    };
  };

  if (isLoading) {
    return (
      <Card className={`bg-gray-800 border-gray-700 ${className}`}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4" data-testid="profit-breakdown-loading">
            <div className="h-6 bg-gray-700 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-20 bg-gray-700 rounded"></div>
              <div className="h-20 bg-gray-700 rounded"></div>
            </div>
            <div className="h-32 bg-gray-700 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`bg-gray-800 border-gray-700 ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-red-400">
            <AlertTriangle className="h-5 w-5" />
            <span className="text-sm">{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!breakdown) {
    return null;
  }

  const profitStatus = getProfitStatus(breakdown.profitMargin);
  const costChartData = getCostChartData(breakdown.costs);
  const revenueVsCostData = getRevenueVsCostData(breakdown);

  return (
    <Card className={`bg-gray-800 border-gray-700 ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <CardTitle className="text-lg font-medium text-white flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <span>Profit Analysis</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            {breakdown.isReturn && (
              <span className="px-2 py-1 text-xs bg-red-900/20 text-red-400 rounded-full">
                RETURNED
              </span>
            )}
            <span className={`px-2 py-1 text-xs rounded-full ${profitStatus.bgColor} ${profitStatus.color}`}>
              {profitStatus.label}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-900/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Revenue</p>
                <p className="text-lg font-semibold text-white">
                  {formatCurrency(breakdown.revenue)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-gray-900/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Costs</p>
                <p className="text-lg font-semibold text-red-300">
                  {formatCurrency(breakdown.costs.total)}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-400" />
            </div>
          </div>

          <div className="bg-gray-900/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Net Profit</p>
                <p className={`text-lg font-semibold ${getProfitColor(breakdown.netProfit)}`}>
                  {formatCurrency(breakdown.netProfit)}
                </p>
              </div>
              {getProfitIcon(breakdown.netProfit)}
            </div>
          </div>

          <div className="bg-gray-900/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <p className="text-sm text-gray-400">Profit Margin</p>
                  <ProfitMarginTooltip />
                </div>
                <p className={`text-lg font-semibold ${getProfitColor(breakdown.netProfit)}`}>
                  {formatPercentage(breakdown.profitMargin)}
                </p>
              </div>
              <Percent className="h-8 w-8 text-purple-400" />
            </div>
          </div>
        </div>

        {showDetails && (
          <Tabs defaultValue="breakdown" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
              <TabsTrigger value="costs">Cost Analysis</TabsTrigger>
              <TabsTrigger value="comparison">Comparison</TabsTrigger>
            </TabsList>

            <TabsContent value="breakdown" className="space-y-4">
              {/* Detailed Breakdown */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-300">Financial Breakdown</h4>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-2 border-b border-gray-700">
                    <span className="text-gray-300 font-medium">Revenue</span>
                    <span className="text-white font-semibold">{formatCurrency(breakdown.revenue)}</span>
                  </div>

                  {breakdown.costs.product > 0 && (
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-400 text-sm ml-4">- Product Cost</span>
                      <span className="text-red-300">{formatCurrency(breakdown.costs.product)}</span>
                    </div>
                  )}
                  
                  {breakdown.costs.lead > 0 && (
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-400 text-sm ml-4">- Lead Acquisition</span>
                      <span className="text-red-300">{formatCurrency(breakdown.costs.lead)}</span>
                    </div>
                  )}
                  
                  {breakdown.costs.packaging > 0 && (
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-400 text-sm ml-4">- Packaging</span>
                      <span className="text-red-300">{formatCurrency(breakdown.costs.packaging)}</span>
                    </div>
                  )}
                  
                  {breakdown.costs.printing > 0 && (
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-400 text-sm ml-4">- Printing</span>
                      <span className="text-red-300">{formatCurrency(breakdown.costs.printing)}</span>
                    </div>
                  )}
                  
                  {breakdown.costs.return > 0 && (
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-400 text-sm ml-4">- Return Shipping</span>
                      <span className="text-red-300">{formatCurrency(breakdown.costs.return)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center py-2 border-t border-gray-700">
                    <span className="text-gray-300 font-medium">Total Costs</span>
                    <span className="text-red-300 font-semibold">{formatCurrency(breakdown.costs.total)}</span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-t border-gray-700">
                    <span className="text-gray-300 font-medium">Gross Profit</span>
                    <span className={`font-semibold ${getProfitColor(breakdown.grossProfit)}`}>
                      {formatCurrency(breakdown.grossProfit)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-t-2 border-gray-600">
                    <span className="text-white font-bold">Net Profit</span>
                    <span className={`font-bold text-lg ${getProfitColor(breakdown.netProfit)}`}>
                      {formatCurrency(breakdown.netProfit)}
                    </span>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="costs" className="space-y-4">
              {/* Cost Distribution Chart */}
              {costChartData.labels.length > 0 ? (
                <div className="bg-gray-900/30 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-4">Cost Distribution</h4>
                  <div className="h-64">
                    <PieChart
                      data={costChartData}
                      title=""
                      height={250}
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-gray-900/30 rounded-lg p-8 text-center">
                  <p className="text-gray-400">No cost data available for visualization</p>
                </div>
              )}

              {/* Cost Percentages */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-300">Cost as % of Revenue</h4>
                {breakdown.costs.product > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Product Cost</span>
                    <span className="text-red-300">
                      {formatPercentage((breakdown.costs.product / breakdown.revenue) * 100)}
                    </span>
                  </div>
                )}
                {breakdown.costs.lead > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Lead Acquisition</span>
                    <span className="text-red-300">
                      {formatPercentage((breakdown.costs.lead / breakdown.revenue) * 100)}
                    </span>
                  </div>
                )}
                {breakdown.costs.packaging > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Packaging</span>
                    <span className="text-red-300">
                      {formatPercentage((breakdown.costs.packaging / breakdown.revenue) * 100)}
                    </span>
                  </div>
                )}
                {breakdown.costs.printing > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Printing</span>
                    <span className="text-red-300">
                      {formatPercentage((breakdown.costs.printing / breakdown.revenue) * 100)}
                    </span>
                  </div>
                )}
                {breakdown.costs.return > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Return Shipping</span>
                    <span className="text-red-300">
                      {formatPercentage((breakdown.costs.return / breakdown.revenue) * 100)}
                    </span>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="comparison" className="space-y-4">
              {/* Revenue vs Costs Chart */}
              <div className="bg-gray-900/30 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-300 mb-4">Revenue vs Costs vs Profit</h4>
                <div className="h-64">
                  <BarChart
                    data={revenueVsCostData}
                    title=""
                    height={250}
                  />
                </div>
              </div>

              {/* Profit Insights */}
              <div className="bg-gray-900/30 rounded-lg p-4 space-y-3">
                <h4 className="text-sm font-medium text-gray-300">Profit Insights</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Cost Ratio</p>
                    <p className="text-white font-medium">
                      {formatPercentage((breakdown.costs.total / breakdown.revenue) * 100)} of revenue
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-gray-400">Profit per Dollar</p>
                    <p className="text-white font-medium">
                      {formatCurrency(breakdown.netProfit / breakdown.revenue)} per $1 revenue
                    </p>
                  </div>

                  {breakdown.costs.product > 0 && (
                    <div>
                      <p className="text-gray-400">Markup</p>
                      <p className="text-white font-medium">
                        {formatPercentage(((breakdown.revenue - breakdown.costs.product) / breakdown.costs.product) * 100)}
                      </p>
                    </div>
                  )}

                  <div>
                    <p className="text-gray-400">Break-even Revenue</p>
                    <p className="text-white font-medium">
                      {formatCurrency(breakdown.costs.total)}
                    </p>
                  </div>
                </div>

                {breakdown.profitMargin < 10 && (
                  <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-yellow-400 text-sm font-medium">Low Profit Margin</p>
                        <p className="text-yellow-300 text-xs mt-1">
                          Consider reviewing costs or pricing to improve profitability.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}