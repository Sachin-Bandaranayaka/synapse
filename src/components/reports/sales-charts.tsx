'use client';

import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface SalesData {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  dailyRevenue: Array<{
    date: string;
    revenue: number;
  }>;
}

interface SalesChartsProps {
  startDate: string;
  endDate: string;
}

export default function SalesCharts({ startDate, endDate }: SalesChartsProps) {
  const [data, setData] = useState<SalesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/reports/sales?startDate=${startDate}&endDate=${endDate}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch sales data');
        }

        const jsonData = await response.json();
        setData(jsonData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">{error}</h3>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="bg-gray-800 overflow-hidden ring-1 ring-white/10 rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-400 truncate">
              Total Orders
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-white">
              {data.totalOrders}
            </dd>
          </div>
        </div>
        <div className="bg-gray-800 overflow-hidden ring-1 ring-white/10 rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-400 truncate">
              Total Revenue
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-white">
              LKR {(data?.totalRevenue ?? 0).toFixed(2)}
            </dd>
          </div>
        </div>
        <div className="bg-gray-800 overflow-hidden ring-1 ring-white/10 rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-400 truncate">
              Average Order Value
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-white">
              LKR {(data?.averageOrderValue ?? 0).toFixed(2)}
            </dd>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-gray-800 ring-1 ring-white/10 rounded-lg p-6">
        <h3 className="text-lg font-medium text-white">Daily Revenue</h3>
        <div className="mt-4" style={{ height: 400 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data.dailyRevenue}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#4F46E5"
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
