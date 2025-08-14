import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getScopedPrismaClient } from '@/lib/prisma';
import { profitCalculationService } from '@/lib/profit-calculation';
import { z } from 'zod';
import { OrderStatus } from '@prisma/client';
import { ExportService, ExportColumn } from '@/lib/export-utils';

const exportSchema = z.object({
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  period: z.enum(['daily', 'weekly', 'monthly', 'custom']).nullable().default('monthly'),
  productId: z.string().nullable().optional(),
  userId: z.string().nullable().optional(),
  status: z.nativeEnum(OrderStatus).nullable().optional(),
  format: z.enum(['csv', 'excel']).nullable().default('csv'),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    
    // Parse and validate parameters
    let params;
    try {
      params = exportSchema.parse({
        startDate: searchParams.get('startDate'),
        endDate: searchParams.get('endDate'),
        period: searchParams.get('period') || 'monthly',
        productId: searchParams.get('productId'),
        userId: searchParams.get('userId'),
        status: searchParams.get('status'),
        format: searchParams.get('format') || 'csv',
      });
    } catch (error) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    // Validate export parameters
    const validation = ExportService.validateExportParams({
      format: params.format || 'csv',
      startDate: params.startDate || undefined,
      endDate: params.endDate || undefined,
    });

    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const prisma = getScopedPrismaClient(session.user.tenantId);

    // Calculate date range
    const { startDate, endDate } = calculateDateRange(params.period || 'monthly', params.startDate || undefined, params.endDate || undefined);

    // Build where clause
    const whereClause: any = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (params.productId) {
      whereClause.productId = params.productId;
    }

    if (params.userId) {
      whereClause.lead = {
        userId: params.userId,
      };
    }

    if (params.status) {
      whereClause.status = params.status;
    }

    // Get orders with all related data
    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        product: true,
        lead: {
          include: {
            batch: true,
            assignedTo: true,
          },
        },
        costs: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate profit for each order
    const exportData = await Promise.all(
      orders.map(async (order) => {
        try {
          const profit = await profitCalculationService.calculateOrderProfit(order.id, session.user.tenantId);
          
          return {
            orderId: order.id,
            orderDate: order.createdAt.toISOString().split('T')[0],
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            productName: order.product.name,
            quantity: order.quantity,
            sellingPrice: order.product.price,
            discount: order.discount || 0,
            revenue: profit.revenue,
            productCost: profit.costs.product,
            leadCost: profit.costs.lead,
            packagingCost: profit.costs.packaging,
            printingCost: profit.costs.printing,
            returnCost: profit.costs.return,
            totalCosts: profit.costs.total,
            grossProfit: profit.grossProfit,
            netProfit: profit.netProfit,
            profitMargin: profit.profitMargin,
            status: order.status,
            assignedTo: order.lead.assignedTo?.name || 'Unassigned',
            isReturn: profit.isReturn,
          };
        } catch (error) {
          console.error(`Error calculating profit for order ${order.id}:`, error);
          return null;
        }
      })
    );

    const validData = exportData.filter(Boolean);

    // Define export columns
    const columns: ExportColumn[] = [
      { key: 'orderId', header: 'Order ID', width: 15 },
      { key: 'orderDate', header: 'Order Date', width: 12, type: 'date' },
      { key: 'customerName', header: 'Customer Name', width: 20 },
      { key: 'customerPhone', header: 'Customer Phone', width: 15 },
      { key: 'productName', header: 'Product Name', width: 25 },
      { key: 'quantity', header: 'Quantity', width: 10, type: 'number' },
      { key: 'sellingPrice', header: 'Selling Price', width: 12, type: 'currency' },
      { key: 'discount', header: 'Discount', width: 10, type: 'currency' },
      { key: 'revenue', header: 'Revenue', width: 12, type: 'currency' },
      { key: 'productCost', header: 'Product Cost', width: 12, type: 'currency' },
      { key: 'leadCost', header: 'Lead Cost', width: 12, type: 'currency' },
      { key: 'packagingCost', header: 'Packaging Cost', width: 12, type: 'currency' },
      { key: 'printingCost', header: 'Printing Cost', width: 12, type: 'currency' },
      { key: 'returnCost', header: 'Return Cost', width: 12, type: 'currency' },
      { key: 'totalCosts', header: 'Total Costs', width: 12, type: 'currency' },
      { key: 'grossProfit', header: 'Gross Profit', width: 12, type: 'currency' },
      { key: 'netProfit', header: 'Net Profit', width: 12, type: 'currency' },
      { key: 'profitMargin', header: 'Profit Margin (%)', width: 15, type: 'percentage' },
      { key: 'status', header: 'Status', width: 12 },
      { key: 'assignedTo', header: 'Assigned To', width: 15 },
      { key: 'isReturn', header: 'Is Return', width: 10 },
    ];

    // Generate filename
    const filename = ExportService.generateFilename(
      'profit-report',
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );

    // Calculate summary for Excel export
    const summary = calculateSummary(validData);
    const summaryData = {
      'Total Orders': validData.length,
      'Total Revenue': summary.totalRevenue,
      'Total Costs': summary.totalCosts,
      'Net Profit': summary.netProfit,
      'Profit Margin (%)': summary.profitMargin,
      'Returns Count': summary.returnCount,
      'Product Costs': summary.breakdown.productCosts,
      'Lead Costs': summary.breakdown.leadCosts,
      'Packaging Costs': summary.breakdown.packagingCosts,
      'Printing Costs': summary.breakdown.printingCosts,
      'Return Costs': summary.breakdown.returnCosts,
    };

    if ((params.format || 'csv') === 'csv') {
      const csv = ExportService.generateCSV(validData, columns);
      return ExportService.createDownloadResponse(csv, filename, 'csv');
    } else if (params.format === 'excel') {
      const excel = await ExportService.generateExcel(validData, columns, {
        filename: 'Profit Report',
        sheetName: 'Profit Data',
        includeTimestamp: true,
        summaryData,
      });
      return ExportService.createDownloadResponse(excel, filename, 'excel');
    }

    return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
  } catch (error) {
    console.error('Error exporting profit report:', error);
    return NextResponse.json(
      { error: 'Failed to export profit report' },
      { status: 500 }
    );
  }
}

function calculateDateRange(period: string, startDateStr?: string, endDateStr?: string) {
  const now = new Date();
  let startDate: Date;
  let endDate: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  if (period === 'custom' && startDateStr && endDateStr) {
    startDate = new Date(startDateStr);
    endDate = new Date(endDateStr);
  } else {
    switch (period) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'weekly':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        startDate = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate());
        break;
      case 'monthly':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }
  }

  return { startDate, endDate };
}



function calculateSummary(data: any[]) {
  const summary = {
    totalRevenue: 0,
    totalCosts: 0,
    netProfit: 0,
    profitMargin: 0,
    returnCount: 0,
    breakdown: {
      productCosts: 0,
      leadCosts: 0,
      packagingCosts: 0,
      printingCosts: 0,
      returnCosts: 0,
    },
  };

  data.forEach((row) => {
    summary.totalRevenue += row.revenue;
    summary.totalCosts += row.totalCosts;
    summary.netProfit += row.netProfit;
    if (row.isReturn) summary.returnCount++;

    summary.breakdown.productCosts += row.productCost;
    summary.breakdown.leadCosts += row.leadCost;
    summary.breakdown.packagingCosts += row.packagingCost;
    summary.breakdown.printingCosts += row.printingCost;
    summary.breakdown.returnCosts += row.returnCost;
  });

  summary.profitMargin = summary.totalRevenue > 0 ? (summary.netProfit / summary.totalRevenue) * 100 : 0;

  return summary;
}