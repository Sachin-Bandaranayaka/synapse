import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(
    request: Request,
    { params }: { params: { productId: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const stockAdjustments = await prisma.stockAdjustment.findMany({
            where: {
                productId: params.productId,
            },
            include: {
                adjustedBy: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json(stockAdjustments);
    } catch (error) {
        console.error('Error fetching stock history:', error);
        return NextResponse.json(
            { error: 'Failed to fetch stock history' },
            { status: 500 }
        );
    }
} 