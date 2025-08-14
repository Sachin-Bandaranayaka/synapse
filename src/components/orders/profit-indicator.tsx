'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, DollarSign } from 'lucide-react';

interface ProfitIndicatorProps {
  orderId: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

interface ProfitData {
  netProfit: number;
  profitMargin: number;
  isReturn: boolean;
}

export function ProfitIndicator({ orderId, className = '', size = 'sm', showTooltip = true }: ProfitIndicatorProps) {
  const [profitData, setProfitData] = useState<ProfitData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfitData();
  }, [orderId]);

  const fetchProfitData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/orders/${orderId}/costs`);
      if (!response.ok) {
        throw new Error('Failed to fetch profit data');
      }

      const data = await response.json();
      setProfitData({
        netProfit: data.netProfit,
        profitMargin: data.profitMargin,
        isReturn: data.isReturn
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profit data');
    } finally {
      setIsLoading(false);
    }
  };

  const getProfitStatus = (profitMargin: number, isReturn: boolean) => {
    if (isReturn) {
      return {
        label: 'Loss',
        color: 'text-red-400',
        bgColor: 'bg-red-900/20',
        icon: TrendingDown,
        priority: 'high'
      };
    }

    if (profitMargin >= 30) {
      return {
        label: 'Excellent',
        color: 'text-green-400',
        bgColor: 'bg-green-900/20',
        icon: TrendingUp,
        priority: 'low'
      };
    }
    if (profitMargin >= 20) {
      return {
        label: 'Good',
        color: 'text-green-300',
        bgColor: 'bg-green-900/20',
        icon: TrendingUp,
        priority: 'low'
      };
    }
    if (profitMargin >= 10) {
      return {
        label: 'Fair',
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-900/20',
        icon: DollarSign,
        priority: 'medium'
      };
    }
    if (profitMargin >= 0) {
      return {
        label: 'Low',
        color: 'text-orange-400',
        bgColor: 'bg-orange-900/20',
        icon: AlertTriangle,
        priority: 'high'
      };
    }
    return {
      label: 'Loss',
      color: 'text-red-400',
      bgColor: 'bg-red-900/20',
      icon: TrendingDown,
      priority: 'high'
    };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(1)}%`;
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'px-2 py-1 text-xs',
          icon: 'h-3 w-3',
          text: 'text-xs'
        };
      case 'md':
        return {
          container: 'px-3 py-1.5 text-sm',
          icon: 'h-4 w-4',
          text: 'text-sm'
        };
      case 'lg':
        return {
          container: 'px-4 py-2 text-base',
          icon: 'h-5 w-5',
          text: 'text-base'
        };
      default:
        return {
          container: 'px-2 py-1 text-xs',
          icon: 'h-3 w-3',
          text: 'text-xs'
        };
    }
  };

  if (isLoading) {
    return (
      <div className={`inline-flex items-center space-x-1 rounded-full bg-gray-700 animate-pulse ${getSizeClasses().container} ${className}`}>
        <div className={`rounded-full bg-gray-600 ${getSizeClasses().icon}`}></div>
        <div className="w-8 h-3 bg-gray-600 rounded"></div>
      </div>
    );
  }

  if (error || !profitData) {
    return (
      <div className={`inline-flex items-center space-x-1 rounded-full bg-gray-700 text-gray-400 ${getSizeClasses().container} ${className}`}>
        <AlertTriangle className={getSizeClasses().icon} />
        <span className={getSizeClasses().text}>N/A</span>
      </div>
    );
  }

  const status = getProfitStatus(profitData.profitMargin, profitData.isReturn);
  const Icon = status.icon;
  const sizeClasses = getSizeClasses();

  const indicator = (
    <div className={`inline-flex items-center space-x-1 rounded-full ${status.bgColor} ${status.color} ${sizeClasses.container} ${className}`}>
      <Icon className={sizeClasses.icon} />
      <span className={`font-medium ${sizeClasses.text}`}>
        {formatPercentage(profitData.profitMargin)}
      </span>
    </div>
  );

  if (!showTooltip) {
    return indicator;
  }

  return (
    <div className="relative group">
      {indicator}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap">
        <div className="space-y-1">
          <div className="flex justify-between space-x-4">
            <span className="text-gray-400">Net Profit:</span>
            <span className={status.color}>{formatCurrency(profitData.netProfit)}</span>
          </div>
          <div className="flex justify-between space-x-4">
            <span className="text-gray-400">Margin:</span>
            <span className={status.color}>{formatPercentage(profitData.profitMargin)}</span>
          </div>
          <div className="flex justify-between space-x-4">
            <span className="text-gray-400">Status:</span>
            <span className={status.color}>{status.label}</span>
          </div>
        </div>
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  );
}

export function ProfitAlert({ orderId, className = '' }: { orderId: string; className?: string }) {
  const [profitData, setProfitData] = useState<ProfitData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProfitData();
  }, [orderId]);

  const fetchProfitData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/orders/${orderId}/costs`);
      if (!response.ok) return;

      const data = await response.json();
      setProfitData({
        netProfit: data.netProfit,
        profitMargin: data.profitMargin,
        isReturn: data.isReturn
      });
    } catch (err) {
      // Silently fail for alerts
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !profitData) {
    return null;
  }

  // Only show alerts for low-margin or loss-making orders
  const shouldShowAlert = profitData.profitMargin < 10 || profitData.netProfit < 0;

  if (!shouldShowAlert) {
    return null;
  }

  const isLoss = profitData.netProfit < 0;
  const alertType = isLoss ? 'loss' : 'low-margin';

  return (
    <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
      isLoss 
        ? 'bg-red-900/20 border border-red-700/50 text-red-400' 
        : 'bg-yellow-900/20 border border-yellow-700/50 text-yellow-400'
    } ${className}`}>
      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">
          {isLoss ? 'Loss-Making Order' : 'Low Profit Margin'}
        </p>
        <p className="text-xs opacity-90">
          {isLoss 
            ? `Loss: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Math.abs(profitData.netProfit))}`
            : `Margin: ${profitData.profitMargin.toFixed(1)}% (Below 10%)`
          }
        </p>
      </div>
    </div>
  );
}