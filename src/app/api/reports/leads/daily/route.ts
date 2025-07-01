import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { LeadStatus } from '@prisma/client';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get date from query parameter
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return new NextResponse('Date parameter is required', { status: 400 });
    }

    // Get start and end of the day
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    // Get daily leads and calculate metrics
    const leads = await prisma.lead.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Calculate daily metrics
    const dailyLeads = leads.length;
    const dailyConvertedLeads = leads.filter(lead => lead.status === LeadStatus.CONFIRMED).length;
    const dailyConversionRate = dailyLeads > 0 ? (dailyConvertedLeads / dailyLeads) * 100 : 0;

    // Get leads by status
    const statusCounts = leads.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {} as Record<LeadStatus, number>);

    const leadsByStatus = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
    }));

    return NextResponse.json({
      dailyLeads,
      dailyConvertedLeads,
      dailyConversionRate,
      leadsByStatus,
    });
  } catch (error) {
    console.error('Error in daily leads report:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}