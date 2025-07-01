// src/app/api/products/[productId]/route.ts

import { getScopedPrismaClient } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { transformProduct } from '@/lib/products';

export const dynamic = 'force-dynamic';

const productUpdateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters'),
  description: z.string().optional(),
  price: z.number().min(0, 'Price must be >= 0').max(1000000, 'Price must be < 1,000,000'),
  stock: z.number().min(0, 'Stock must be >= 0').max(100000, 'Stock must be < 100,000'),
  lowStockAlert: z.number().min(0, 'Low stock alert must be >= 0').max(100000, 'Low stock alert must be < 100,000'),
});

// COMPLETE AND SECURED GET HANDLER
export async function GET(
  request: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    const prisma = getScopedPrismaClient(session.user.tenantId);

    const product = await prisma.product.findUnique({
      where: { id: params.productId },
      include: {
        _count: { select: { orders: true, leads: true } },
        stockAdjustments: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const formattedProduct = transformProduct(product);
    return NextResponse.json(formattedProduct);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

// COMPLETE AND SECURED PUT HANDLER
export async function PUT(
  request: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    const prisma = getScopedPrismaClient(session.user.tenantId);

    const data = await request.json();
    const validatedData = productUpdateSchema.parse(data);

    const currentProduct = await prisma.product.findUnique({
      where: { id: params.productId },
    });

    if (!currentProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const product = await prisma.$transaction(async (tx) => {
      const updatedProduct = await tx.product.update({
        where: { id: params.productId },
        data: validatedData,
      });

      if (currentProduct.stock !== validatedData.stock) {
        await tx.stockAdjustment.create({
          data: {
            tenant: { connect: { id: session.user.tenantId } },
            product: { connect: { id: updatedProduct.id } },
            adjustedBy: { connect: { id: session.user.id } },
            quantity: validatedData.stock - currentProduct.stock,
            reason: 'Manual stock update',
            previousStock: currentProduct.stock,
            newStock: validatedData.stock,
          },
        });
      }
      return updatedProduct;
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

// COMPLETE AND SECURED DELETE HANDLER
export async function DELETE(
  request: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    const prisma = getScopedPrismaClient(session.user.tenantId);

    const product = await prisma.product.findUnique({
      where: { id: params.productId },
      include: { _count: { select: { orders: true, leads: true } } },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (product._count.orders > 0 || product._count.leads > 0) {
      return NextResponse.json({ error: 'Cannot delete product with existing orders or leads' }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.stockAdjustment.deleteMany({ where: { productId: params.productId } }),
      prisma.product.delete({ where: { id: params.productId } }),
    ]);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}