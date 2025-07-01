// src/lib/inventory.ts

import { getScopedPrismaClient } from './prisma'; // Import our scoped client

// Update the interface to include tenantId
export interface StockAdjustmentData {
  productId: string;
  quantity: number;
  reason: string;
  userId: string;
  tenantId: string; // <-- ADDED tenantId
}

// SECURED FUNCTION
export async function adjustStock(adjustment: StockAdjustmentData) {
  // Use the scoped client for the current tenant
  const prisma = getScopedPrismaClient(adjustment.tenantId);

  return await prisma.$transaction(async (tx) => {
    // This lookup is now secure
    const product = await tx.product.findUnique({
      where: { id: adjustment.productId },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    const newStock = product.stock + adjustment.quantity;
    if (newStock < 0) {
      throw new Error('Insufficient stock');
    }

    const updatedProduct = await tx.product.update({
      where: { id: adjustment.productId },
      data: { stock: newStock },
    });

    // Explicitly connect all relations for safety in transactions
    await tx.stockAdjustment.create({
      data: {
        tenant: { connect: { id: adjustment.tenantId } },
        product: { connect: { id: adjustment.productId } },
        adjustedBy: { connect: { id: adjustment.userId } },
        quantity: adjustment.quantity,
        reason: adjustment.reason,
        previousStock: product.stock,
        newStock,
      },
    });

    return updatedProduct;
  });
}

// SECURED FUNCTION
export async function checkLowStock(tenantId: string, threshold: number = 10) {
  const prisma = getScopedPrismaClient(tenantId);
  return await prisma.product.findMany({
    where: {
      stock: { lte: threshold },
    },
    orderBy: { stock: 'asc' },
  });
}

// SECURED FUNCTION
export async function getStockHistory(productId: string, tenantId: string) {
  const prisma = getScopedPrismaClient(tenantId);
  // The where clause is automatically secured by the scoped client
  return await prisma.stockAdjustment.findMany({
    where: { productId },
    include: {
      adjustedBy: {
        select: { name: true, email: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

// SECURED FUNCTION
export async function processOrderStock(orderId: string, tenantId: string) {
  const prisma = getScopedPrismaClient(tenantId);
  return await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { product: true, assignedTo: true },
    });

    if (!order) throw new Error('Order not found');

    const adjustment: StockAdjustmentData = {
      productId: order.productId,
      quantity: -order.quantity,
      reason: `Order: ${orderId}`,
      userId: order.userId,
      tenantId: tenantId, // Pass tenantId down
    };

    // Call the already secured adjustStock function
    return await adjustStock(adjustment);
  });
}

// SECURED FUNCTION
export async function processReturnStock(orderId: string, tenantId: string) {
    const prisma = getScopedPrismaClient(tenantId);
    return await prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({
            where: { id: orderId },
            include: { product: true, assignedTo: true },
        });

        if (!order) throw new Error('Order not found');

        const adjustment: StockAdjustmentData = {
            productId: order.productId,
            quantity: order.quantity,
            reason: `Return: ${orderId}`,
            userId: order.userId,
            tenantId: tenantId, // Pass tenantId down
        };

        return await adjustStock(adjustment);
    });
}