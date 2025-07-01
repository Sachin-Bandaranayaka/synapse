'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface SalesChartProps {
  data: {
    date: string;
    revenue: number;
    orders: number;
  }[];
}

export function SalesChart({ data }: SalesChartProps) {
  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={(value) => new Date(value).toLocaleDateString()}
          />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip
            labelFormatter={(value) => new Date(value).toLocaleDateString()}
            formatter={(value: number, name: string) => [
              name === 'revenue' ? `LKR ${value.toFixed(2)}` : value,
              name === 'revenue' ? 'Revenue' : 'Orders',
            ]}
          />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="revenue"
            stroke="#8884d8"
            name="Revenue"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="orders"
            stroke="#82ca9d"
            name="Orders"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
