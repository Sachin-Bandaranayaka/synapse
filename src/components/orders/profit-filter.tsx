'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, DollarSign, Filter } from 'lucide-react';

type ProfitFilter = 'all' | 'profitable' | 'low-margin' | 'loss' | 'excellent' | 'good';

interface ProfitFilterOption {
  value: ProfitFilter;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export function ProfitFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  
  const currentFilter = (searchParams.get('profitFilter') as ProfitFilter) || 'all';

  const filterOptions: ProfitFilterOption[] = [
    {
      value: 'all',
      label: 'All Orders',
      description: 'Show all orders regardless of profitability',
      icon: Filter,
      color: 'text-gray-400'
    },
    {
      value: 'excellent',
      label: 'Excellent Profit',
      description: 'Orders with 30%+ profit margin',
      icon: TrendingUp,
      color: 'text-green-400'
    },
    {
      value: 'good',
      label: 'Good Profit',
      description: 'Orders with 20-30% profit margin',
      icon: TrendingUp,
      color: 'text-green-300'
    },
    {
      value: 'profitable',
      label: 'Profitable',
      description: 'Orders with positive profit margin',
      icon: DollarSign,
      color: 'text-blue-400'
    },
    {
      value: 'low-margin',
      label: 'Low Margin',
      description: 'Orders with 0-10% profit margin',
      icon: AlertTriangle,
      color: 'text-yellow-400'
    },
    {
      value: 'loss',
      label: 'Loss Making',
      description: 'Orders with negative profit',
      icon: TrendingDown,
      color: 'text-red-400'
    }
  ];

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(Array.from(searchParams.entries()));
      if (value && value !== 'all') {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      return params.toString();
    },
    [searchParams]
  );

  const handleFilterChange = (filter: ProfitFilter) => {
    const queryString = createQueryString('profitFilter', filter);
    router.push(`/orders${queryString ? `?${queryString}` : ''}`);
    setIsOpen(false);
  };

  const currentOption = filterOptions.find(option => option.value === currentFilter) || filterOptions[0];
  const CurrentIcon = currentOption.icon;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-100 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:bg-gray-600"
      >
        <CurrentIcon className={`h-4 w-4 ${currentOption.color}`} />
        <span>Profit: {currentOption.label}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-gray-800 border border-gray-700 rounded-md ring-1 ring-white/10 z-10 shadow-lg">
          <div className="py-1">
            {filterOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  onClick={() => handleFilterChange(option.value)}
                  className={`block w-full text-left px-4 py-3 text-sm hover:bg-gray-700 transition-colors ${
                    option.value === currentFilter
                      ? 'bg-indigo-500/20 text-indigo-300'
                      : 'text-gray-300'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${option.color}`} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{option.description}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function ProfitSortOptions() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  
  const currentSort = searchParams.get('sort') || 'createdAt:desc';

  const profitSortOptions = [
    { label: 'Profit Margin (High to Low)', value: 'profitMargin', direction: 'desc' as const },
    { label: 'Profit Margin (Low to High)', value: 'profitMargin', direction: 'asc' as const },
    { label: 'Net Profit (High to Low)', value: 'netProfit', direction: 'desc' as const },
    { label: 'Net Profit (Low to High)', value: 'netProfit', direction: 'asc' as const },
    { label: 'Date (Newest)', value: 'createdAt', direction: 'desc' as const },
    { label: 'Date (Oldest)', value: 'createdAt', direction: 'asc' as const },
    { label: 'Total (High to Low)', value: 'total', direction: 'desc' as const },
    { label: 'Total (Low to High)', value: 'total', direction: 'asc' as const },
  ];

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(Array.from(searchParams.entries()));
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      return params.toString();
    },
    [searchParams]
  );

  const handleSort = (option: { value: string; direction: 'asc' | 'desc' }) => {
    const sortValue = `${option.value}:${option.direction}`;
    const queryString = createQueryString('sort', sortValue);
    router.push(`/orders${queryString ? `?${queryString}` : ''}`);
    setIsOpen(false);
  };

  const currentSortOption = profitSortOptions.find(
    option => `${option.value}:${option.direction}` === currentSort
  ) || profitSortOptions[4]; // Default to Date (Newest)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-100 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:bg-gray-600"
      >
        <span>Sort: {currentSortOption.label}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-md ring-1 ring-white/10 z-10 shadow-lg">
          <div className="py-1">
            {profitSortOptions.map((option) => (
              <button
                key={`${option.value}:${option.direction}`}
                onClick={() => handleSort(option)}
                className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-700 transition-colors ${
                  `${option.value}:${option.direction}` === currentSort
                    ? 'bg-indigo-500/20 text-indigo-300'
                    : 'text-gray-300'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}