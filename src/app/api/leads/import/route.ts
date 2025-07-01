// src/app/api/leads/import/route.ts

import { getScopedPrismaClient } from '@/lib/prisma'; // Import our scoped client
import { LeadSchema } from '@/lib/csv-parser';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

const ImportLeadsSchema = z.array(LeadSchema);

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    // 1. SECURE THE ROUTE: Check for session and tenantId
    if (!session?.user?.tenantId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // 2. USE THE SCOPED CLIENT: All DB operations are now tenant-aware
    const prisma = getScopedPrismaClient(session.user.tenantId);

    const json = await request.json();
    const leads = ImportLeadsSchema.parse(json);

    // 3. SECURE VALIDATION: Verify all product codes exist WITHIN THE CURRENT TENANT
    const productCodes = [...new Set(leads.map(lead => lead.product_code))];
    const products = await prisma.product.findMany({
      where: {
        code: { in: productCodes }
      },
      select: { code: true }
    });

    const validProductCodes = new Set(products.map(p => p.code));
    const invalidProductCodes = productCodes.filter(code => !validProductCodes.has(code));

    if (invalidProductCodes.length > 0) {
      return NextResponse.json({
        error: `The following product codes do not exist for your tenant: ${invalidProductCodes.join(', ')}`
      }, { status: 400 });
    }

    // 4. SECURE THE TRANSACTION: Use the scoped client to create leads
    const createdLeads = await prisma.$transaction(
      leads.map(lead => {
        const csvData = { ...lead, name: lead.customer_name };

        // The scoped client automatically adds the tenantId, correctly forming the relation
        // to the product via the (productCode, tenantId) key.
        return prisma.lead.create({
          data: {
            csvData: csvData as unknown as Prisma.JsonObject,
            status: 'PENDING',
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
                  code: lead.product_code,
                  tenantId: session.user.tenantId,
                },
              },
            },
          }
        });
      })
    );

    return NextResponse.json({
      message: `Successfully imported ${createdLeads.length} leads`,
      count: createdLeads.length
    });
  } catch (error) {
    console.error('Lead import error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid lead data format',
        details: error.errors
      }, { status: 400 });
    }
    return NextResponse.json({
      error: 'Failed to import leads'
    }, { status: 500 });
  }
}