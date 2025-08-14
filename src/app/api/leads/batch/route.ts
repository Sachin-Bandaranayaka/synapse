import { getScopedPrismaClient } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const QuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
});

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const prisma = getScopedPrismaClient(tenantId);
    
    const url = new URL(request.url);
    const { page, limit } = QuerySchema.parse({
      page: url.searchParams.get('page'),
      limit: url.searchParams.get('limit'),
    });

    const skip = (page - 1) * limit;

    const [batches, total] = await Promise.all([
      prisma.leadBatch.findMany({
        skip,
        take: limit,
        orderBy: { importedAt: 'desc' },
        include: {
          importedBy: {
            select: { name: true, email: true },
          },
          _count: {
            select: { leads: true },
          },
        },
      }),
      prisma.leadBatch.count(),
    ]);

    return NextResponse.json({
      batches,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Lead batch fetch error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid query parameters', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to fetch lead batches' }, { status: 500 });
  }
}