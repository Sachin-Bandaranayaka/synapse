// src/lib/orders.ts

import { getScopedPrismaClient } from './prisma';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import { LeadStatus, OrderStatus, Prisma } from '@prisma/client';
import { CreateOrderData } from '@/types/orders';
import { getSession } from '@/lib/auth';

const sendOrderConfirmationEmail = typeof window === 'undefined' ? require('./email').sendOrderConfirmationEmail : null;

export async function createOrderFromLead(data: CreateOrderData) {
  const prisma = getScopedPrismaClient(data.tenantId);

  try {
    const lead = await prisma.lead.findUnique({
      where: { id: data.leadId },
      include: { product: true },
    });

    if (!lead) throw new Error('Lead not found');
    if (lead.status === LeadStatus.CONFIRMED) throw new Error('Lead already converted to order');
    
    const csvData = lead.csvData as any;
    if (!csvData.name || !csvData.phone || !csvData.address) {
      throw new Error('Missing required customer information in lead data');
    }

    const result = await prisma.$transaction(async (tx) => {
      // ... (code for generating order ID remains the same)
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const todayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const todayOrders = await tx.order.count({ where: { createdAt: { gte: todayStart } } });
      const sequence = (todayOrders + 1).toString().padStart(4, '0');
      const orderId = `JH${year}${month}${day}${sequence}`;
      const discount = (lead.csvData as any).discount || 0;
      const total = (lead.product.price * data.quantity) - discount;

      const order = await tx.order.create({
        data: {
          id: orderId,
          // --- THE FIX IS HERE ---
          // We are now explicitly connecting the tenant using its ID.
          tenant: {
            connect: {
              id: data.tenantId,
            }
          },
          lead: { connect: { id: data.leadId } },
          product: { connect: { id: lead.product.id } },
          assignedTo: { connect: { id: data.userId } },
          status: OrderStatus.PENDING,
          quantity: data.quantity,
          total: total,
          discount: discount,
          customerName: csvData.name,
          customerPhone: csvData.phone,
          customerSecondPhone: csvData.secondPhone || null,
          customerAddress: csvData.address,
          customerEmail: csvData.email,
          notes: csvData.notes,
        },
      });

      // All subsequent operations are also tenant-aware
      await tx.lead.update({ where: { id: data.leadId }, data: { status: LeadStatus.CONFIRMED } });
      const currentProduct = await tx.product.findUnique({ where: { id: lead.product.id } });
      if (!currentProduct) throw new Error('Product not found when adjusting stock');
      const newStock = Math.max(0, currentProduct.stock - data.quantity);
      await tx.product.update({ where: { id: lead.product.id }, data: { stock: newStock } });
      
      // We also make the stock adjustment connection explicit
      await tx.stockAdjustment.create({
        data: {
          tenant: { connect: { id: data.tenantId } },
          product: { connect: { id: lead.product.id } },
          adjustedBy: { connect: { id: data.userId } },
          quantity: -data.quantity,
          reason: `Order: ${orderId}`,
          previousStock: currentProduct.stock,
          newStock: newStock,
        },
      });
      return order;
    }, { timeout: 30000 });

    if (sendOrderConfirmationEmail) {
        try { await sendOrderConfirmationEmail(result.id); } 
        catch (emailError) { console.error('Error sending order confirmation email:', emailError); }
    }
    return result;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
}

// ... (The rest of the file remains the same)
// SECURED FUNCTION
export async function updateOrderStatus(orderId: string, status: OrderStatus, tenantId: string) {
  const prisma = getScopedPrismaClient(tenantId);
  return await prisma.order.update({
    where: { id: orderId }, // Scoped client ensures this is safe
    data: { status },
  });
}

// SECURED FUNCTION
export async function getConfirmedOrders(tenantId: string) {
  const prisma = getScopedPrismaClient(tenantId);
  return await prisma.order.findMany({
    where: { status: 'CONFIRMED' },
    // ... select and orderBy clauses
  });
}

// SECURED FUNCTION
export async function getOrder(orderId: string, tenantId: string) {
  const prisma = getScopedPrismaClient(tenantId);
  return await prisma.order.findUnique({
    where: { id: orderId }, // Scoped client ensures this is safe
    // ... include clause
  });
}