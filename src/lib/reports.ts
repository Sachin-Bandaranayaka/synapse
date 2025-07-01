// src/lib/reports.ts

import { getScopedPrismaClient } from './prisma'; // Import our scoped client
import ExcelJS from 'exceljs';
import { jsPDF } from 'jspdf';
import { parse } from 'json2csv';
import { ShippingProvider } from '@prisma/client';

// The options now require a tenantId
interface ReportOptions {
    startDate: Date;
    endDate: Date;
    tenantId: string;
}

// SECURED Sales Report
export async function generateSalesReport({ startDate, endDate, tenantId }: ReportOptions) {
    const prisma = getScopedPrismaClient(tenantId);
    const orders = await prisma.order.findMany({
        where: {
            createdAt: { gte: startDate, lte: endDate },
        },
        include: {
            product: true,
            assignedTo: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
    });

    const summary = {
        totalOrders: orders.length,
        totalRevenue: orders.reduce((sum, order) => sum + order.total, 0),
        averageOrderValue: orders.length > 0 ? orders.reduce((sum, order) => sum + order.total, 0) / orders.length : 0,
        orders: orders.map((order) => ({
            id: order.id, date: order.createdAt, customer: order.customerName,
            total: order.total, product: order.product.name, quantity: order.quantity,
            status: order.status, salesPerson: order.assignedTo.name,
        })),
    };
    return summary;
}

// SECURED Product Report
export async function generateProductReport({ startDate, endDate, tenantId }: ReportOptions) {
    const prisma = getScopedPrismaClient(tenantId);
    const products = await prisma.product.findMany({
        include: {
            orders: { where: { createdAt: { gte: startDate, lte: endDate } } },
            leads: { where: { createdAt: { gte: startDate, lte: endDate } } },
            stockAdjustments: { where: { createdAt: { gte: startDate, lte: endDate } }, orderBy: { createdAt: 'desc' } },
        },
    });

    const summary = products.map((product) => ({
        code: product.code, name: product.name, currentStock: product.stock,
        totalSold: product.orders.length, revenue: product.price * product.orders.length,
        leads: product.leads.length, stockMovements: product.stockAdjustments.length,
    }));
    return summary;
}

// SECURED Lead Report
export async function generateLeadReport({ startDate, endDate, tenantId }: ReportOptions) {
    const prisma = getScopedPrismaClient(tenantId);
    const leads = await prisma.lead.findMany({
        where: { createdAt: { gte: startDate, lte: endDate } },
        include: {
            product: true,
            assignedTo: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
    });

    const summary = {
        totalLeads: leads.length,
        conversionRate: leads.length > 0 ? (leads.filter((lead) => lead.status === 'CONFIRMED').length / leads.length) * 100 : 0,
        leads: leads.map((lead) => ({
            id: lead.id, date: lead.createdAt, csvData: lead.csvData,
            product: lead.product.name, status: lead.status,
            assignedTo: lead.assignedTo?.name || 'Unassigned',
        })),
    };
    return summary;
}

// SECURED Shipping Report
interface ShippingReportOptions extends ReportOptions {
    provider?: ShippingProvider | null;
}

export async function generateShippingReport({ startDate, endDate, provider, tenantId }: ShippingReportOptions) {
    const prisma = getScopedPrismaClient(tenantId);

    const allOrdersInPeriod = await prisma.order.findMany({
        where: {
            createdAt: { gte: startDate, lte: endDate },
            ...(provider && { shippingProvider: provider }),
        },
        include: { product: true, assignedTo: { select: { name: true } }, trackingUpdates: { orderBy: { timestamp: 'desc' }, take: 1 } },
        orderBy: { createdAt: 'desc' },
    });

    const deliveredOrders = allOrdersInPeriod.filter(o => o.status === 'DELIVERED' && o.shippedAt && o.deliveredAt);
    let totalDeliveryMilliseconds = 0;
    deliveredOrders.forEach(order => {
        totalDeliveryMilliseconds += order.deliveredAt!.getTime() - order.shippedAt!.getTime();
    });

    const totalDeliveredCount = deliveredOrders.length;
    const averageDeliveryTimeInDays = totalDeliveredCount > 0 ? (totalDeliveryMilliseconds / totalDeliveredCount) / (1000 * 60 * 60 * 24) : 0;

    const summary = {
        totalShipments: allOrdersInPeriod.filter(o => o.shippingProvider).length,
        averageDeliveryTime: averageDeliveryTimeInDays,
        onTimeDeliveryRate: 0, // Placeholder
        providerPerformance: [], // Placeholder
        dailyShipments: [], // Placeholder
        orders: allOrdersInPeriod.map(order => ({
            id: order.id, date: order.createdAt, customer: order.customerName,
            product: order.product.name, quantity: order.quantity, status: order.status,
            provider: order.shippingProvider, trackingNumber: order.trackingNumber,
            salesPerson: order.assignedTo.name, latestUpdate: order.trackingUpdates[0]?.status || null,
        })),
    };
    return summary;
}


// Export Functions
export async function exportSalesReport(data: any, format: string): Promise<Buffer> {
  switch (format) {
    case 'excel':
      return exportToExcel(data.orders, 'Sales Report', [
        { header: 'Order ID', key: 'id' },
        { header: 'Date', key: 'date' },
        { header: 'Customer', key: 'customer' },
        { header: 'Total', key: 'total' },
        { header: 'Items', key: 'items' },
        { header: 'Status', key: 'status' },
        { header: 'Sales Person', key: 'salesPerson' },
      ]);
    case 'pdf':
      return exportToPdf(data, 'Sales Report');
    case 'csv':
      return exportToCsv(data.orders);
    default:
      throw new Error('Unsupported format');
  }
}

export async function exportProductReport(data: any, format: string): Promise<Buffer> {
  switch (format) {
    case 'excel':
      return exportToExcel(data, 'Products', [
        { header: 'Code', key: 'code' },
        { header: 'Name', key: 'name' },
        { header: 'Current Stock', key: 'currentStock' },
        { header: 'Total Sold', key: 'totalSold' },
        { header: 'Revenue', key: 'revenue' },
        { header: 'Leads', key: 'leads' },
        { header: 'Stock Movements', key: 'stockMovements' },
      ]);
    case 'pdf':
      return exportToPdf(data, 'Product Performance Report');
    case 'csv':
      return exportToCsv(data);
    default:
      throw new Error('Unsupported format');
  }
}

export async function exportLeadReport(data: any, format: string): Promise<Buffer> {
  switch (format) {
    case 'excel':
      return exportToExcel(data.leads, 'Leads', [
        { header: 'ID', key: 'id' },
        { header: 'Date', key: 'date' },
        { header: 'Product', key: 'product' },
        { header: 'Status', key: 'status' },
        { header: 'Assigned To', key: 'assignedTo' },
      ]);
    case 'pdf':
      return exportToPdf(data, 'Lead Performance Report');
    case 'csv':
      return exportToCsv(data.leads);
    default:
      throw new Error('Unsupported format');
  }
}

export async function exportShippingReport(data: any, format: string): Promise<Buffer> {
  switch (format) {
    case 'excel':
      return exportToExcel(data.orders, 'Shipping Report', [
        { header: 'Tracking Number', key: 'trackingNumber' },
        { header: 'Provider', key: 'provider' },
        { header: 'Status', key: 'status' },
        { header: 'Cost', key: 'cost' },
        { header: 'Weight', key: 'weight' },
        { header: 'Created At', key: 'createdAt' },
        { header: 'Estimated Delivery', key: 'estimatedDelivery' },
        { header: 'Actual Delivery', key: 'actualDelivery' },
        { header: 'Order ID', key: 'order.id' },
        { header: 'Order Total', key: 'order.total' },
        { header: 'Order Items', key: 'order.items' },
        { header: 'Sales Person', key: 'order.salesPerson' },
      ]);
    case 'pdf':
      return exportToPdf(data, 'Shipping Report');
    case 'csv':
      return exportToCsv(data.orders);
    default:
      throw new Error('Unsupported format');
  }
}

async function exportToExcel(
  data: any[],
  sheetName: string,
  columns: { header: string; key: string }[]
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  worksheet.columns = columns;
  worksheet.addRows(data);

  // Style the header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  // Adjust column widths
  worksheet.columns.forEach((column) => {
    column.width = 15;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

async function exportToPdf(data: any, title: string): Promise<Buffer> {
  const doc = new jsPDF();

  // Add title
  doc.setFontSize(20);
  doc.text(title, 20, 20);

  // Add content
  doc.setFontSize(12);
  const content = JSON.stringify(data, null, 2);
  const lines = doc.splitTextToSize(content, 170);
  doc.text(lines, 20, 40);

  // Convert to Buffer
  const buffer = Buffer.from(doc.output('arraybuffer'));
  return buffer;
}

async function exportToCsv(data: any[]): Promise<Buffer> {
  const csv = parse(data);
  return Buffer.from(csv);
}
