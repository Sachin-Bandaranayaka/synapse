import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateInvoicePDF } from '@/lib/invoice';
import { z } from 'zod';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

const InvoiceSchema = z.object({
    customerName: z.string(),
    customerAddress: z.string(),
    customerPhone: z.string(),
    amount: z.number(),
    productName: z.string(),
    productCode: z.string(),
});

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const json = await request.json();
        const data = InvoiceSchema.parse(json);
        const referenceNumber = `INV-${Date.now()}`;

        const pdfBuffer = await generateInvoicePDF({
            customerName: data.customerName,
            customerAddress: data.customerAddress,
            customerPhone: data.customerPhone,
            amount: data.amount,
            productName: data.productName,
            productCode: data.productCode,
            referenceNumber,
        });

        // Set appropriate headers for PDF download
        return new NextResponse(pdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="invoice-${referenceNumber}.pdf"`,
            },
        });
    } catch (error) {
        console.error('Error generating invoice:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid request data', details: error.errors },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: 'Failed to generate invoice' },
            { status: 500 }
        );
    }
} 