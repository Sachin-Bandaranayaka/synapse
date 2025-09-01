'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState, useTransition } from 'react';
import { Calendar } from 'lucide-react';
import { 
  format, 
  subDays, 
  startOfMonth, 
  endOfMonth, 
  subMonths 
} from 'date-fns';
import { createDateRangeQueryString, validateDateRange } from '@/lib/date-range-utils';

interface DateRangePreset {
  label: string;
  value: string;
  getDateRange: () => { startDate: string; endDate: string };
}

const DATE_PRESETS: DateRangePreset[] = [
  {
    label: 'Today',
    value: 'today',
    getDateRange: () => ({
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd')
    })
  },
  {
    label: 'Yesterday', 
    value: 'yesterday',
    getDateRange: () => ({
      startDate: format(subDays(new Date(), 1), 'yyyy-MM-dd'),
      endDate: format(subDays(new Date(), 1), 'yyyy-MM-dd')
    })
  },
  {
    label: 'Last 7 days',
    value: 'last7days',
    getDateRange: () => ({
      startDate: format(subDays(new Date(), 6), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd')
    })
  },
  {
    label: 'Last 30 days',
    value: 'last30days', 
    getDateRange: () => ({
      startDate: format(subDays(new Date(), 29), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd')
    })
  },
  {
    label: 'This month',
    value: 'thismonth',
    getDateRange: () => ({
      startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
      endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd')
    })
  },
  {
    label: 'Last month',
    value: 'lastmonth',
    getDateRange: () => ({
      startDate: format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd'),
      endDate: format(endOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd')
    })
  }
];

export function DateRangeFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  
  // Get current date range from URL parameters
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';
  const preset = searchParams.get('preset') || '';
  
  // Local state for temporary date inputs
  const [tempStartDate, setTempStartDate] = useState(startDate);
  const [tempEndDate, setTempEndDate] = useState(endDate);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(preset || null);

  const createQueryString = useCallback(
    (params: { startDate?: string; endDate?: string; preset?: string }) => {
      return createDateRangeQueryString(searchParams, params);
    },
    [searchParams]
  );

  const handlePresetSelect = (presetValue: string) => {
    const selectedPresetData = DATE_PRESETS.find(p => p.value === presetValue);
    if (selectedPresetData) {
      const { startDate: presetStartDate, endDate: presetEndDate } = selectedPresetData.getDateRange();
      
      // Update local state
      setTempStartDate(presetStartDate);
      setTempEndDate(presetEndDate);
      setSelectedPreset(presetValue);
      
      // Apply filter immediately with loading state
      const queryString = createQueryString({
        startDate: presetStartDate,
        endDate: presetEndDate,
        preset: presetValue
      });
      
      startTransition(() => {
        router.push(`/orders${queryString ? `?${queryString}` : ''}`);
      });
      setIsOpen(false);
    }
  };

  const handleApplyFilter = () => {
    // Validate date range before applying
    const validation = validateDateRange(tempStartDate || undefined, tempEndDate || undefined);
    if (!validation.isValid) {
      // Could show an error message here in the future
      console.warn('Invalid date range:', validation.error);
      return;
    }

    const queryString = createQueryString({
      startDate: tempStartDate,
      endDate: tempEndDate,
      preset: '' // Clear preset when applying custom dates
    });
    
    startTransition(() => {
      router.push(`/orders${queryString ? `?${queryString}` : ''}`);
    });
    setSelectedPreset(null);
    setIsOpen(false);
  };

  const handleClearFilter = () => {
    setTempStartDate('');
    setTempEndDate('');
    setSelectedPreset(null);
    const queryString = createQueryString({
      startDate: '',
      endDate: '',
      preset: ''
    });
    
    startTransition(() => {
      router.push(`/orders${queryString ? `?${queryString}` : ''}`);
    });
    setIsOpen(false);
  };

  // Check if any date filter is active
  const hasActiveFilter = !!(startDate || endDate || preset);

  // Format display text for the button
  const getDisplayText = () => {
    // If a preset is active, show the preset name
    if (preset) {
      const presetData = DATE_PRESETS.find(p => p.value === preset);
      if (presetData) {
        return presetData.label;
      }
    }
    
    // Otherwise show custom date range
    if (startDate && endDate) {
      if (startDate === endDate) {
        return `${new Date(startDate).toLocaleDateString()}`;
      }
      // Use shorter format for mobile
      const start = new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const end = new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `${start} - ${end}`;
    } else if (startDate) {
      return `From ${new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    } else if (endDate) {
      return `Until ${new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
    return 'All dates';
  };

  // Get tooltip text for current filter status
  const getTooltipText = () => {
    if (preset) {
      const presetData = DATE_PRESETS.find(p => p.value === preset);
      if (presetData) {
        const { startDate: presetStart, endDate: presetEnd } = presetData.getDateRange();
        return `${presetData.label}: ${new Date(presetStart).toLocaleDateString()} - ${new Date(presetEnd).toLocaleDateString()}`;
      }
    }
    
    if (startDate && endDate) {
      return `Custom range: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`;
    } else if (startDate) {
      return `From: ${new Date(startDate).toLocaleDateString()}`;
    } else if (endDate) {
      return `Until: ${new Date(endDate).toLocaleDateString()}`;
    }
    return 'Click to filter orders by date range';
  };

  return (
    <div className="relative flex items-center">
      <button
        onClick={() => setIsOpen(!isOpen)}
        title={getTooltipText()}
        className={`flex items-center space-x-2 px-3 sm:px-4 py-2 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-0 transition-colors ${
          hasActiveFilter
            ? 'text-white bg-indigo-600 border border-indigo-500 hover:bg-indigo-700'
            : 'text-gray-100 bg-gray-700 border border-gray-600 hover:bg-gray-600'
        } ${hasActiveFilter ? 'rounded-r-none border-r-0' : ''}`}
      >
        {isPending ? (
          <svg className="animate-spin h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <Calendar className={`h-4 w-4 flex-shrink-0 ${hasActiveFilter ? 'text-white' : 'text-gray-400'}`} />
        )}
        <span className="truncate">{getDisplayText()}</span>
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
      {hasActiveFilter && (
        <button
          onClick={handleClearFilter}
          className="px-2 py-2 text-sm rounded-r-md border border-l-0 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors text-white bg-indigo-600 border-indigo-500 hover:bg-indigo-700"
          title="Clear date filter"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {isOpen && (
        <div className="absolute right-0 sm:right-0 left-0 sm:left-auto mt-2 w-full sm:w-80 bg-gray-800 border border-gray-700 rounded-md ring-1 ring-white/10 z-10 shadow-lg">
          <div className="p-4">
            {/* Predefined Date Range Shortcuts */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Quick Select
              </label>
              <div className="grid grid-cols-2 gap-2">
                {DATE_PRESETS.map((presetOption) => (
                  <button
                    key={presetOption.value}
                    onClick={() => handlePresetSelect(presetOption.value)}
                    className={`px-3 py-2 text-sm rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      selectedPreset === presetOption.value
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'text-gray-300 bg-gray-700 border-gray-600 hover:bg-gray-600 hover:text-white'
                    }`}
                  >
                    {presetOption.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-700 mb-4"></div>

            {/* Custom Date Range */}
            <div className="space-y-4">
              <div>
                <label htmlFor="start-date" className="block text-sm font-medium text-gray-300 mb-2">
                  Start Date
                </label>
                <input
                  id="start-date"
                  type="date"
                  value={tempStartDate}
                  onChange={(e) => {
                    setTempStartDate(e.target.value);
                    setSelectedPreset(null); // Clear preset when manually changing dates
                  }}
                  className="w-full px-3 py-2 text-sm text-gray-100 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label htmlFor="end-date" className="block text-sm font-medium text-gray-300 mb-2">
                  End Date
                </label>
                <input
                  id="end-date"
                  type="date"
                  value={tempEndDate}
                  onChange={(e) => {
                    setTempEndDate(e.target.value);
                    setSelectedPreset(null); // Clear preset when manually changing dates
                  }}
                  className="w-full px-3 py-2 text-sm text-gray-100 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-700">
              <button
                onClick={handleClearFilter}
                className="px-3 py-2 text-sm text-gray-400 hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-md"
              >
                Clear
              </button>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-2 text-sm text-gray-300 bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplyFilter}
                  className="px-3 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}