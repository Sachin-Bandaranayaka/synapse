'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertTriangle, DollarSign, Target } from 'lucide-react';
import Link from 'next/link';

interface ProfitSummaryData {
  totalProfit: number;
  profitMargin: number;
  profitableOrders: number;
  lowMarginOrders: number;
  lossOrders: number;
  totalOrders: number;
  avgProfitPerOrder: number;
  profitTrend: 'up' | 'down' | 'stable';
  profitTrendPercentage: number;
}

interface ProfitSummaryProps {
  timeFilter: 'daily' | 'weekly' | 'monthly';
  className?: string;
}

export function ProfitSummary({ timeFilter, className = '' }: ProfitSummaryProps) {
  const [data, setData] = useState<ProfitSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfitSummary();
  }, [timeFilter]);

  const fetchProfitSummary = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/reports/profit?period=${timeFilter}&summary=true`);
      if (!response.ok) {
        throw new Error('Failed to fetch profit summary');
      }

      const result = await response.json();
      setData(result.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profit data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    // Handle NaN and invalid numbers
    if (!isFinite(amount) || isNaN(amount)) {
      return 'LKR 0';
    }
    return `LKR ${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const formatPercentage = (percentage: number) => {
    // Handle NaN and invalid numbers
    if (!isFinite(percentage) || isNaN(percentage)) {
      return '0.0%';
    }
    return `${percentage.toFixed(1)}%`;
  };

  const getProfitTrendIcon = (trend: string, percentage: number) => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-400" />;
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-400" />;
    return <DollarSign className="h-4 w-4 text-gray-400" />;
  };

  const getProfitStatusColor = (profitMargin: number) => {
    if (profitMargin >= 20) return 'text-green-400';
    if (profitMargin >= 10) return 'text-yellow-400';
    if (profitMargin >= 0) return 'text-orange-400';
    return 'text-red-400';
  };

  if (isLoading) {
    return (
      <div className={`bg-gray-800 rounded-lg ring-1 ring-white/10 p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={`bg-gray-800 rounded-lg ring-1 ring-white/10 p-6 ${className}`}>
        <div className="flex items-center space-x-2 text-red-400">
          <AlertTriangle className="h-5 w-5" />
          <span className="text-sm">{error || 'Failed to load profit data'}</span>
        </div>
      </div>
    );
  }

  const profitHealthScore = data.totalOrders > 0
    ? ((data.profitableOrders / data.totalOrders) * 100)
    : 0;

  // Ensure all data values are valid numbers
  const safeData = {
    ...data,
    totalProfit: isFinite(data.totalProfit) ? data.totalProfit : 0,
    profitMargin: isFinite(data.profitMargin) ? data.profitMargin : 0,
    avgProfitPerOrder: isFinite(data.avgProfitPerOrder) ? data.avgProfitPerOrder : 0,
    profitTrendPercentage: isFinite(data.profitTrendPercentage) ? data.profitTrendPercentage : 0,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className={`bg-gray-800 rounded-lg ring-1 ring-white/10 p-6 ${className}`}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-medium text-white flex items-center space-x-2">
          <Target className="h-5 w-5 text-indigo-400" />
          <span>Profit Overview</span>
        </h2>
        <Link
          href="/reports?tab=profit"
          className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          View Details →
        </Link>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-900/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Profit</p>
              <p className={`text-lg font-semibold ${getProfitStatusColor(safeData.profitMargin)}`}>
                {formatCurrency(safeData.totalProfit)}
              </p>
            </div>
            <div className="flex items-center space-x-1">
              {getProfitTrendIcon(data.profitTrend, safeData.profitTrendPercentage)}
              <span className={`text-xs ${data.profitTrend === 'up' ? 'text-green-400' :
                data.profitTrend === 'down' ? 'text-red-400' : 'text-gray-400'
                }`}>
                {safeData.profitTrendPercentage > 0 && data.profitTrend !== 'stable' &&
                  `${safeData.profitTrendPercentage.toFixed(1)}%`
                }
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Profit Margin</p>
              <p className={`text-lg font-semibold ${getProfitStatusColor(safeData.profitMargin)}`}>
                {formatPercentage(safeData.profitMargin)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-purple-400" />
          </div>
        </div>

        <div className="bg-gray-900/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Avg Profit/Order</p>
              <p className={`text-lg font-semibold ${getProfitStatusColor(safeData.profitMargin)}`}>
                {formatCurrency(safeData.avgProfitPerOrder)}
              </p>
            </div>
            <Target className="h-8 w-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-gray-900/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Profit Health</p>
              <p className={`text-lg font-semibold ${profitHealthScore >= 80 ? 'text-green-400' :
                profitHealthScore >= 60 ? 'text-yellow-400' :
                  profitHealthScore >= 40 ? 'text-orange-400' : 'text-red-400'
                }`}>
                {formatPercentage(profitHealthScore)}
              </p>
            </div>
            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${profitHealthScore >= 80 ? 'bg-green-900/20' :
              profitHealthScore >= 60 ? 'bg-yellow-900/20' :
                profitHealthScore >= 40 ? 'bg-orange-900/20' : 'bg-red-900/20'
              }`}>
              {profitHealthScore >= 80 ?
                <TrendingUp className="h-4 w-4 text-green-400" /> :
                profitHealthScore >= 40 ?
                  <AlertTriangle className="h-4 w-4 text-yellow-400" /> :
                  <TrendingDown className="h-4 w-4 text-red-400" />
              }
            </div>
          </div>
        </div>
      </div>

      {/* Order Breakdown */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-300">Order Profitability Breakdown</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/orders?profitFilter=profitable"
            className="bg-gray-900/30 rounded-lg p-4 hover:bg-gray-900/50 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Profitable Orders</p>
                <p className="text-xl font-semibold text-green-400">{data.profitableOrders}</p>
                <p className="text-xs text-gray-500">
                  {data.totalOrders > 0 ? formatPercentage((data.profitableOrders / data.totalOrders) * 100) : '0%'} of total
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-400 group-hover:scale-110 transition-transform" />
            </div>
          </Link>

          <Link
            href="/orders?profitFilter=low-margin"
            className="bg-gray-900/30 rounded-lg p-4 hover:bg-gray-900/50 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Low Margin Orders</p>
                <p className="text-xl font-semibold text-yellow-400">{data.lowMarginOrders}</p>
                <p className="text-xs text-gray-500">
                  {data.totalOrders > 0 ? formatPercentage((data.lowMarginOrders / data.totalOrders) * 100) : '0%'} of total
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-400 group-hover:scale-110 transition-transform" />
            </div>
          </Link>

          <Link
            href="/orders?profitFilter=loss"
            className="bg-gray-900/30 rounded-lg p-4 hover:bg-gray-900/50 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Loss Orders</p>
                <p className="text-xl font-semibold text-red-400">{data.lossOrders}</p>
                <p className="text-xs text-gray-500">
                  {data.totalOrders > 0 ? formatPercentage((data.lossOrders / data.totalOrders) * 100) : '0%'} of total
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-400 group-hover:scale-110 transition-transform" />
            </div>
          </Link>
        </div>

        {/* Alerts */}
        {(data.lossOrders > 0 || data.lowMarginOrders > data.profitableOrders) && (
          <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-yellow-400 text-sm font-medium">Profit Alert</p>
                <div className="text-yellow-300 text-xs mt-1 space-y-1">
                  {data.lossOrders > 0 && (
                    <p>• {data.lossOrders} orders are making losses</p>
                  )}
                  {data.lowMarginOrders > data.profitableOrders && (
                    <p>• More orders have low margins than high profits</p>
                  )}
                  <p>• Consider reviewing pricing or cost optimization</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}