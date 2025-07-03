// src/app/(superadmin)/superadmin/referral-chart.tsx

'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface ReferralData {
    name: string;
    referrals: number;
}

export function ReferralChart({ data }: { data: ReferralData[] }) {
    return (
        <div className="rounded-lg bg-gray-800/80 p-6 ring-1 ring-white/10">
            <h3 className="text-lg font-medium text-white">Top Tenant Referrers</h3>
            <div className="mt-4" style={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                    {/* Removed layout="vertical" to make it a standard vertical chart */}
                    <BarChart 
                        data={data}
                        margin={{ top: 5, right: 20, left: -10, bottom: 60 }} // Increased bottom margin for angled labels
                    >
                        <CartesianGrid stroke="#374151" strokeDasharray="3 3" />
                        {/* X-axis now shows the seller names */}
                        <XAxis 
                            type="category" 
                            dataKey="name" 
                            stroke="#9ca3af" 
                            fontSize={12}
                            angle={-45} // Angle the labels to prevent overlap
                            textAnchor="end"
                            interval={0}
                        />
                        {/* Y-axis now shows the numbers */}
                        <YAxis 
                            type="number" 
                            stroke="#9ca3af" 
                            fontSize={12}
                            allowDecimals={false}
                        />
                        <Tooltip
                            cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
                            contentStyle={{
                                backgroundColor: '#1f2937',
                                borderColor: 'rgba(255, 255, 255, 0.2)',
                            }}
                        />
                        <Bar dataKey="referrals" name="Referred Sellers" fill="#4f46e5" barSize={30} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}