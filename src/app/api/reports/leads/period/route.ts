import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
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

    // Get date parameters from URL
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return new NextResponse('Start date and end date are required', { status: 400 });
    }

    // Parse and validate dates
    let startDateTime: Date;
    let endDateTime: Date;
    try {
      startDateTime = new Date(startDate);
      endDateTime = new Date(endDate);

      // Set the time to start and end of the day respectively
      startDateTime.setHours(0, 0, 0, 0);
      endDateTime.setHours(23, 59, 59, 999);

      if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        throw new Error('Invalid date format');
      }
    } catch (error) {
      console.error('Date parsing error:', error);
      return new NextResponse('Invalid date format. Use YYYY-MM-DD format.', { status: 400 });
    }

    // Query leads within the date range
    const leads = await prisma.lead.findMany({
      where: {
        createdAt: {
          gte: startDateTime,
          lte: endDateTime
        }
      },
      include: {
        assignedTo: {
          select: {
            name: true
          }
        }
      }
    });

    // Calculate metrics
    const totalLeads = leads.length;
    const statusDistribution = leads.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {} as Record<LeadStatus, number>);

    // Calculate conversion rate
const convertedLeads = leads.filter(lead => lead.status === LeadStatus.CONFIRMED).length;
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

    // Calculate assignment metrics
    const assignedLeads = leads.filter(lead => lead.assignedTo).length;
    const assignmentRate = totalLeads > 0 ? (assignedLeads / totalLeads) * 100 : 0;

    // Format the response
    const response = {
      totalLeads,
      statusDistribution,
      conversionRate,
      assignmentRate,
      startDate: startDateTime.toISOString(),
      endDate: endDateTime.toISOString(),
      metrics: {
        pending: statusDistribution[LeadStatus.PENDING] || 0,
        confirmed: statusDistribution[LeadStatus.CONFIRMED] || 0,
        rejected: statusDistribution[LeadStatus.REJECTED] || 0,
// Removed duplicate 'confirmed' property since it was already defined above
        // Removed 'lost' status as it's not defined in LeadStatus enum
        noAnswer: statusDistribution[LeadStatus.NO_ANSWER] || 0
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in leads period route:', error);
    return new NextResponse(
      'Internal Server Error: ' + (error instanceof Error ? error.message : 'Unknown error'),
      { status: 500 }
    );
  }
}