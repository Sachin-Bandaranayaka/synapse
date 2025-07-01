// src/app/(superadmin)/superadmin/chart-card.tsx

'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export function ChartCard({ data }: { data: any[] }) {
  return (
    <div className="rounded-lg bg-gray-800/80 p-6 ring-1 ring-white/10">
      <h3 className="text-lg font-medium text-white">Tenant Status</h3>
      <div className="mt-4" style={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
            <YAxis stroke="#9ca3af" fontSize={12} allowDecimals={false} />
            <Tooltip
              cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
              contentStyle={{
                backgroundColor: '#1f2937',
                borderColor: 'rgba(255, 255, 255, 0.2)',
              }}
            />
            <Bar dataKey="value" barSize={60}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}