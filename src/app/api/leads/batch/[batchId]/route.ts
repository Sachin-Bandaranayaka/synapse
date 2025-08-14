import { getScopedPrismaClient } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ batchId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const prisma = getScopedPrismaClient(tenantId);
    const { batchId } = await params;

    const batch = await prisma.leadBatch.findFirst({
      where: {
        id: batchId,
        tenantId,
      },
      include: {
        importedBy: {
          select: { name: true, email: true },
        },
        leads: {
          include: {
            product: {
              select: { name: true, code: true },
            },
            order: {
              select: { id: true, status: true, total: true },
            },
          },
        },
      },
    });

    if (!batch) {
      return NextResponse.json({ error: 'Lead batch not found' }, { status: 404 });
    }

    // Calculate conversion statistics
    const totalLeads = batch.leads.length;
    const convertedLeads = batch.leads.filter(lead => lead.order).length;
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
    const totalRevenue = batch.leads.reduce((sum, lead) => {
      return sum + (lead.order?.total || 0);
    }, 0);

    const batchWithStats = {
      ...batch,
      stats: {
        totalLeads,
        convertedLeads,
        conversionRate: Math.round(conversionRate * 100) / 100,
        totalRevenue,
        roi: batch.totalCost > 0 ? ((totalRevenue - batch.totalCost) / batch.totalCost) * 100 : 0,
      },
    };

    return NextResponse.json(batchWithStats);
  } catch (error) {
    console.error('Lead batch detail fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch lead batch details' }, { status: 500 });
  }
}