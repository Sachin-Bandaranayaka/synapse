// src/app/(authenticated)/leads/page.tsx

import { getScopedPrismaClient } from '@/lib/prisma'; // Import the scoped client
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { SearchLeads } from '@/components/leads/search-leads';
import { Prisma } from '@prisma/client';

// Keep the STATUS_CONFIG the same
const STATUS_CONFIG = {
  PENDING: { label: 'Pending', color: 'bg-yellow-900/30 hover:bg-yellow-900/40', border: 'ring-1 ring-yellow-500/50', text: 'text-yellow-300', icon: '🕒' },
  NO_ANSWER: { label: 'No Answer', color: 'bg-orange-900/30 hover:bg-orange-900/40', border: 'ring-1 ring-orange-500/50', text: 'text-orange-300', icon: '📞' },
  REJECTED: { label: 'Rejected', color: 'bg-red-900/30 hover:bg-red-900/40', border: 'ring-1 ring-red-500/50', text: 'text-red-300', icon: '❌' },
  CONFIRMED: { label: 'Converted', color: 'bg-green-900/30 hover:bg-green-900/40', border: 'ring-1 ring-green-500/50', text: 'text-green-300', icon: '✅' },
};

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const session = await getServerSession(authOptions);
  const timeFilter = (searchParams.timeFilter as string) || 'daily';
  const searchQuery = (searchParams.query as string) || '';

  // 1. SECURE THE PAGE: Check for session and tenantId
  if (!session?.user?.tenantId) {
    return redirect('/auth/signin');
  }

  // 2. USE THE SCOPED CLIENT: All DB operations are now tenant-aware
  const prisma = getScopedPrismaClient(session.user.tenantId);

  // 3. BUILD A SECURE WHERE CLAUSE
  const where: Prisma.LeadWhereInput = {};
  
  // If the user is a TEAM_MEMBER, they only see leads assigned to them within their tenant.
  // An ADMIN will see all leads within their tenant (the scoped client handles this).
  if (session.user.role === 'TEAM_MEMBER') {
    where.userId = session.user.id;
  }

  // 4. FETCH SECURE DATA: This query is now fully isolated by tenant.
  const leads = await prisma.lead.findMany({
    where,
    include: {
      product: true,
      assignedTo: true,
      order: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // The rest of the filtering logic can remain, as it operates on the already-secured data.
  const now = new Date();
  const startDate = new Date();
  switch (timeFilter) {
    case 'weekly': startDate.setDate(now.getDate() - 7); break;
    case 'monthly': startDate.setMonth(now.getMonth() - 1); break;
    default: startDate.setHours(0, 0, 0, 0); break;
  }

  const filteredLeads = leads.filter(lead => {
    const leadDate = new Date(lead.createdAt);
    const matchesTimeFilter = lead.status === 'PENDING' || (leadDate >= startDate && leadDate <= now);

    if (searchQuery) {
      const csvData = lead.csvData as any;
      const name = csvData.name || csvData.customer_name || '';
      const phone = csvData.phone || '';
      const email = csvData.email || '';
      const address = csvData.address || '';
      const product = lead.product.name || '';
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        name.toLowerCase().includes(searchLower) ||
        phone.toLowerCase().includes(searchLower) ||
        email.toLowerCase().includes(searchLower) ||
        address.toLowerCase().includes(searchLower) ||
        product.toLowerCase().includes(searchLower);
      return matchesTimeFilter && matchesSearch;
    }
    return matchesTimeFilter;
  });

  const leadsByStatus = filteredLeads.reduce((acc, lead) => {
    const status = lead.status;
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(lead);
    return acc;
  }, {} as Record<string, typeof leads>);

  // The rendering part remains the same
  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8 bg-gray-900">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-white">Leads</h1>
          <div className="mt-4 flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 sm:items-center">
            <div className="flex space-x-4">
              <Link href={`/leads?timeFilter=daily${searchQuery ? `&query=${searchQuery}` : ''}`} className={`px-3 py-2 rounded-md text-sm font-medium ${timeFilter === 'daily' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>Daily</Link>
              <Link href={`/leads?timeFilter=weekly${searchQuery ? `&query=${searchQuery}` : ''}`} className={`px-3 py-2 rounded-md text-sm font-medium ${timeFilter === 'weekly' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>Weekly</Link>
              <Link href={`/leads?timeFilter=monthly${searchQuery ? `&query=${searchQuery}` : ''}`} className={`px-3 py-2 rounded-md text-sm font-medium ${timeFilter === 'monthly' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>Monthly</Link>
            </div>
            <div className="mt-2 sm:mt-0"><SearchLeads /></div>
          </div>
          <p className="mt-2 text-sm text-gray-400">Manage your leads and track their status {searchQuery && `• Searching: "${searchQuery}"`}</p>
        </div>
        <div className="flex gap-4">
          <Link href="/leads/import" className="inline-flex items-center px-4 py-2 border border-gray-600 rounded-md ring-1 ring-white/10 text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700">Import CSV</Link>
          <Link href="/leads/new" className="inline-flex items-center px-4 py-2 border border-transparent rounded-md ring-1 ring-white/10 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">Add Lead</Link>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {Object.entries(STATUS_CONFIG).map(([status, config]) => (
          <div key={status} className={`rounded-lg ring-1 ring-white/10 overflow-hidden bg-gray-800 ${config.border}`}>
            <div className={`px-6 py-4 border-b border-gray-700`}>
              <h2 className={`text-lg font-medium flex items-center space-x-2 ${config.text}`}>
                <span>{config.icon}</span>
                <span>{config.label} ({leadsByStatus[status]?.length || 0})</span>
              </h2>
            </div>
            <ul className="divide-y divide-gray-700">
              {(leadsByStatus[status] || []).map((lead) => (
                <li key={lead.id} className="hover:bg-gray-700/50">
                  <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <Link href={`/leads/${lead.id}`} className={`text-sm font-medium text-indigo-400 hover:text-indigo-300`}>
                          {(lead.csvData as any).name || (lead.csvData as any).customer_name || 'Unnamed Lead'}
                        </Link>
                        <p className="mt-1 text-sm text-gray-400">{lead.product.name} • {lead.product.code}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-400">{format(new Date(lead.createdAt), 'MMM d, yyyy')}</p>
                        {lead.assignedTo && (<p className="mt-1 text-sm text-gray-400">Assigned to: {lead.assignedTo.name}</p>)}
                      </div>
                    </div>
                    {((lead.csvData as any).phone) && (<p className="mt-2 text-sm text-gray-400">📞 {(lead.csvData as any).phone}</p>)}
                    {status === 'CONFIRMED' && lead.order && (<p className="mt-2 text-sm text-green-400">🛍️ Order #{lead.order.id}</p>)}
                  </div>
                </li>
              ))}
              {(!leadsByStatus[status] || leadsByStatus[status].length === 0) && (
                <li><div className="px-6 py-8 text-center text-gray-400">No {config.label.toLowerCase()} leads {searchQuery && `matching "${searchQuery}"`}</div></li>
              )}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
