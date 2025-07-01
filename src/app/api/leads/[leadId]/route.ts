// src/app/api/leads/[leadId]/route.ts

import { getScopedPrismaClient } from '@/lib/prisma'; // Import our scoped client
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

const leadUpdateSchema = z.object({
  csvData: z.object({
    name: z.string().min(1, 'Name is required'),
    phone: z.string().min(1, 'Phone number is required'),
    secondPhone: z.string().optional(),
    email: z.string().email('Invalid email').optional().nullable(),
    address: z.string().min(1, 'Address is required'),
    city: z.string().optional().default(""),
    source: z.string().optional().default(""),
    notes: z.string().optional(),
    quantity: z.number().int().positive().default(1),
    discount: z.number().min(0).default(0),
  }),
  productCode: z.string().min(1, 'Product code is required'),
});

// SECURED GET HANDLER
export async function GET(
  request: Request,
  { params }: { params: { leadId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Use the scoped client
    const prisma = getScopedPrismaClient(session.user.tenantId);

    // This query is now secure. It will only find the lead if it belongs to the current tenant.
    const lead = await prisma.lead.findUnique({
      where: { id: params.leadId },
      include: {
        product: true,
        assignedTo: { select: { id: true, name: true, email: true } },
        order: { include: { product: true } }
      }
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // This extra check is still good for TEAM_MEMBER roles
    if (session.user.role !== 'ADMIN' && lead.userId !== session.user.id) {
      return NextResponse.json({ error: 'You do not have permission' }, { status: 403 });
    }

    return NextResponse.json(lead);
  } catch (error) {
    console.error('Error fetching lead:', error);
    return NextResponse.json({ error: 'Failed to fetch lead' }, { status: 500 });
  }
}

// SECURED PUT HANDLER
export async function PUT(
  request: Request,
  { params }: { params: { leadId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    
    // Use the scoped client for all operations
    const prisma = getScopedPrismaClient(session.user.tenantId);

    const data = await request.json();
    const validatedData = leadUpdateSchema.parse(data);

    // Securely get the lead to check permissions and status
    const lead = await prisma.lead.findUnique({
      where: { id: params.leadId },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    if (session.user.role !== 'ADMIN' && lead.userId !== session.user.id) {
      return NextResponse.json({ error: 'You do not have permission' }, { status: 403 });
    }
    
    if (lead.status !== 'PENDING') {
      return NextResponse.json({ error: 'Only pending leads can be edited' }, { status: 400 });
    }

    // **THE FIX**: Securely find the product within the tenant's scope
    const product = await prisma.product.findFirst({
      where: { code: validatedData.productCode },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found for this tenant' }, { status: 404 });
    }

    // Securely update the lead
    const updatedLead = await prisma.lead.update({
      where: { id: params.leadId },
      data: {
        csvData: validatedData.csvData as unknown as Prisma.JsonObject,
        productCode: validatedData.productCode,
      },
      include: {
        product: true,
        assignedTo: { select: { id: true, name: true, email: true } },
        order: { include: { product: true } }
      },
    });

    return NextResponse.json(updatedLead);
  } catch (error) {
    console.error('Error updating lead:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 });
  }
}