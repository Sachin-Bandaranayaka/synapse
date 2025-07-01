import nodemailer from 'nodemailer';
import { render } from '@react-email/render';
import { prisma } from './prisma';
import OrderConfirmation from '@/emails/order-confirmation';
import LeadAssignment from '@/emails/lead-assignment';
import StockAlert from '@/emails/stock-alert';
import UserInvitation from '@/emails/user-invitation';
import ShipmentUpdate from '@/emails/shipment-update';
import { OrderStatus } from '@prisma/client';

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail({ to, subject, html }: EmailOptions) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'Jnex Sales <sales@jnex.lk>',
      to,
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return response.json();
}

// Order Notifications
export async function sendOrderConfirmationEmail(orderId: string) {
  try {
    // Get order details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        product: true,
        assignedTo: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Format order items for email
    const items = [{
      name: order.product.name,
      quantity: order.quantity,
      price: order.total,
    }];

    // Render email template
    const emailHtml = render(
      OrderConfirmation({
        orderNumber: order.id,
        customerName: order.customerName,
        items,
        total: order.total,
        salesPerson: order.assignedTo?.name || 'Sales Team',
      })
    );

    // Send email
    await sendEmail({
      to: order.customerEmail || 'sales@jnex.lk',
      subject: `Order Confirmation - ${order.id}`,
      html: emailHtml,
    });

    // Update order status
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.CONFIRMED,
      },
    });
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    throw error;
  }
}

// Lead Notifications
export async function sendLeadAssignment(leadId: string) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      product: true,
      assignedTo: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  if (!lead || !lead.assignedTo) {
    throw new Error('Lead not found or not assigned');
  }

  const emailHtml = render(
    LeadAssignment({
      leadId: lead.id,
      customerName: (lead.csvData as any).name,
      productName: lead.product.name,
      assignedTo: lead.assignedTo.name,
    })
  );

  await sendEmail({
    to: lead.assignedTo.email,
    subject: `New Lead Assignment: ${(lead.csvData as any).name}`,
    html: emailHtml,
  });
}

// Stock Notifications
export async function sendStockAlert(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new Error('Product not found');
  }

  // Get all admin users
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
  });

  const emailHtml = render(
    StockAlert({
      productName: product.name,
      productCode: product.code,
      currentStock: product.stock,
      lowStockThreshold: product.lowStockAlert,
    })
  );

  // Send to all admins
  await Promise.all(
    admins.map(admin =>
      sendEmail({
        to: admin.email,
        subject: `Low Stock Alert: ${product.name}`,
        html: emailHtml,
      })
    )
  );
}

// User Notifications
export async function sendUserInvitation(userId: string, temporaryPassword: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const emailHtml = render(
    UserInvitation({
      name: user.name || user.email,
      email: user.email,
      temporaryPassword,
      role: user.role,
    })
  );

  await sendEmail({
    to: user.email,
    subject: 'Welcome to J-nex Holdings Sales Management System',
    html: emailHtml,
  });
}

// Shipment Notifications
export async function sendShipmentUpdate(orderId: string, trackingNumber: string, status: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      assignedTo: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  const emailHtml = render(
    ShipmentUpdate({
      trackingNumber,
      status,
      provider: order.shippingProvider,
      estimatedDelivery: null,
      orderNumber: order.id,
      customerName: order.customerName,
    })
  );

  // Send to both customer and sales person
  const emailPromises = [];

  if (order.customerEmail) {
    emailPromises.push(
      sendEmail({
        to: order.customerEmail,
        subject: `Shipment Update: ${trackingNumber}`,
        html: emailHtml,
      })
    );
  }

  if (order.assignedTo?.email) {
    emailPromises.push(
      sendEmail({
        to: order.assignedTo.email,
        subject: `Shipment Update: ${trackingNumber}`,
        html: emailHtml,
      })
    );
  }

  await Promise.all(emailPromises);
}
