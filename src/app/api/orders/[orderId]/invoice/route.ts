import { prisma } from '@/lib/prisma';
import { generateInvoicePDF } from '@/lib/generate-invoice';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const order = await prisma.order.findUnique({
      where: { id: params.orderId },
      include: {
        product: true,
        lead: true,
        assignedTo: true,
      },
    });

    if (!order) {
      return new NextResponse('Order not found', { status: 404 });
    }

    const pdfBytes = await generateInvoicePDF({
      customerName: order.customerName,
      customerAddress: order.customerAddress,
      customerPhone: order.customerPhone,
      amount: order.product.price,
      referenceNumber: order.id,
      productName: order.product.name,
      productCode: order.product.code
    });

    // Set response headers for PDF download
    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set(
      'Content-Disposition',
      `attachment; filename="invoice-${order.id}.pdf"`
    );

    return new NextResponse(pdfBytes, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Invoice generation error:', error);
    return new NextResponse('Failed to generate invoice', { status: 500 });
  }
}
