// src/app/api/leads/route.ts

import { getScopedPrismaClient } from '@/lib/prisma'; // Import our new scoped client
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { Prisma, LeadStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

const leadSchema = z.object({
  csvData: z.object({
    name: z.string().min(1, 'Name is required'),
    phone: z.string().min(1, 'Phone number is required'),
    email: z.string().email('Invalid email').optional().nullable(),
    address: z.string().min(1, 'Address is required'),
    city: z.string().optional().default(""),
    source: z.string().optional().default(""),
    notes: z.string().optional(),
  }),
  productCode: z.string().min(1, 'Product code is required'),
});

// SECURED GET HANDLER
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Use the scoped client for the current tenant
    const prisma = getScopedPrismaClient(session.user.tenantId);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as LeadStatus | null;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: Prisma.LeadWhereInput = {
      // If user is not an ADMIN, only show leads assigned to them.
      // Tenant filtering is handled automatically by the scoped client.
      ...(session.user.role !== 'ADMIN' && { userId: session.user.id }),
      ...(status && { status: status as LeadStatus }),
      ...(startDate && endDate && {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      }),
    };

    // This query is now automatically secured by the scoped client
    const leads = await prisma.lead.findMany({
      where,
      include: {
        product: true,
        assignedTo: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(leads);
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
  }
}

// SECURED POST HANDLER
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Use the scoped client for the current tenant
    const prisma = getScopedPrismaClient(session.user.tenantId);

    const data = await request.json();
    const validatedData = leadSchema.parse(data);

    // **THE FIX**: This now securely finds the product within the tenant's scope.
    const product = await prisma.product.findFirst({
      where: { code: validatedData.productCode },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found for this tenant' }, { status: 404 });
    }

    // This now securely creates the lead and assigns it to the correct tenant automatically.
    const lead = await prisma.lead.create({
      data: {
        csvData: validatedData.csvData as unknown as Prisma.JsonObject,
        status: 'PENDING' as LeadStatus,
        assignedTo: {
          connect: {
            id: session.user.id,
          },
        },
        tenant: {
          connect: {
            id: session.user.tenantId,
          },
        },
        product: {
          connect: {
            code_tenantId: {
              code: validatedData.productCode,
              tenantId: session.user.tenantId,
            },
          },
        },
      },
      include: {
        product: true,
        assignedTo: true,
      },
    });

    return NextResponse.json(lead);
  } catch (error) {
    console.error('Error creating lead:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 });
  }
}