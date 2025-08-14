import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';
import { getServerSession } from 'next-auth';
import { getScopedPrismaClient } from '@/lib/prisma';
import { profitCalculationService } from '@/lib/profit-calculation';

// Mock dependencies
vi.mock('next-auth');
vi.mock('@/lib/prisma');
vi.mock('@/lib/profit-calculation');

const mockGetServerSession = vi.mocked(getServerSession);
const mockGetScopedPrismaClient = vi.mocked(getScopedPrismaClient);
const mockProfitCalculationService = vi.mocked(profitCalculationService);

describe('/api/reports/profit/export', () => {
  const mockSession = {
    user: {
      id: 'user-1',
      tenantId: 'tenant-1',
      role: 'ADMIN',
    },
  };

  const mockPrisma = {
    order: {
      findMany: vi.fn(),
    },
  };

  const mockOrders = [
    {
      id: 'order-1',
      createdAt: new Date('2024-01-15'),
      customerName: 'John Doe',
      customerPhone: '1234567890',
      quantity: 2,
      discount: 10,
      status: 'DELIVERED',
      product: {
        id: 'product-1',
        name: 'Test Product',
        price: 100,
      },
      lead: {
        id: 'lead-1',
        assignedTo: {
          id: 'user-1',
          name: 'Test User',
        },
        batch: {
          id: 'batch-1',
          costPerLead: 5,
        },
      },
      costs: {
        id: 'costs-1',
        productCost: 60,
        leadCost: 5,
        packagingCost: 3,
        printingCost: 2,
        returnCost: 0,
        totalCosts: 70,
        grossProfit: 130,
        netProfit: 130,
        profitMargin: 65,
      },
    },
  ];

  const mockProfitBreakdown = {
    orderId: 'order-1',
    revenue: 190,
    costs: {
      product: 60,
      lead: 5,
      packaging: 3,
      printing: 2,
      return: 0,
      total: 70,
    },
    grossProfit: 130,
    netProfit: 120,
    profitMargin: 63.16,
    isReturn: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetServerSession.mockResolvedValue(mockSession);
    mockGetScopedPrismaClient.mockReturnValue(mockPrisma as any);
    mockPrisma.order.findMany.mockResolvedValue(mockOrders);
    mockProfitCalculationService.calculateOrderProfit.mockResolvedValue(mockProfitBreakdown);
  });

  describe('Authentication and Authorization', () => {
    it('should return 401 if no session', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/reports/profit/export');
      const response = await GET(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 403 if user is not admin', async () => {
      mockGetServerSession.mockResolvedValue({
        ...mockSession,
        user: { ...mockSession.user, role: 'USER' },
      });

      const request = new NextRequest('http://localhost/api/reports/profit/export');
      const response = await GET(request);

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe('Forbidden');
    });
  });

  describe('Parameter Validation', () => {
    it('should return 400 for invalid format', async () => {
      const request = new NextRequest('http://localhost/api/reports/profit/export?format=invalid');
      const response = await GET(request);

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid date range', async () => {
      const request = new NextRequest(
        'http://localhost/api/reports/profit/export?startDate=2024-12-01&endDate=2024-01-01'
      );
      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Start date must be before end date');
    });

    it('should return 400 for date range exceeding 1 year', async () => {
      const request = new NextRequest(
        'http://localhost/api/reports/profit/export?startDate=2023-01-01&endDate=2024-12-31'
      );
      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Date range cannot exceed 1 year');
    });
  });

  describe('CSV Export', () => {
    it('should export CSV with correct headers and data', async () => {
      const request = new NextRequest('http://localhost/api/reports/profit/export?format=csv');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('text/csv');
      expect(response.headers.get('content-disposition')).toContain('attachment');
      expect(response.headers.get('content-disposition')).toContain('.csv');

      const csvContent = await response.text();
      expect(csvContent).toContain('Order ID,Order Date,Customer Name');
      expect(csvContent).toContain('order-1');
      expect(csvContent).toContain('John Doe');
    });

    it('should handle empty data for CSV export', async () => {
      mockPrisma.order.findMany.mockResolvedValue([]);

      const request = new NextRequest('http://localhost/api/reports/profit/export?format=csv');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const csvContent = await response.text();
      expect(csvContent).toBe('No data available');
    });
  });

  describe('Excel Export', () => {
    it('should export Excel with correct content type', async () => {
      const request = new NextRequest('http://localhost/api/reports/profit/export?format=excel');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      expect(response.headers.get('content-disposition')).toContain('attachment');
      expect(response.headers.get('content-disposition')).toContain('.xlsx');
    });

    it('should handle empty data for Excel export', async () => {
      mockPrisma.order.findMany.mockResolvedValue([]);

      const request = new NextRequest('http://localhost/api/reports/profit/export?format=excel');
      const response = await GET(request);

      expect(response.status).toBe(200);
      // Should still return a valid Excel file with "No data available" message
      const buffer = await response.arrayBuffer();
      expect(buffer.byteLength).toBeGreaterThan(0);
    });
  });

  describe('Filtering', () => {
    it('should apply filters correctly', async () => {
      const request = new NextRequest(
        'http://localhost/api/reports/profit/export?productId=product-1&status=DELIVERED&period=monthly'
      );
      await GET(request);

      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            productId: 'product-1',
            status: 'DELIVERED',
          }),
        })
      );
    });

    it('should handle custom date range', async () => {
      const request = new NextRequest(
        'http://localhost/api/reports/profit/export?period=custom&startDate=2024-01-01&endDate=2024-01-31'
      );
      await GET(request);

      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: {
              gte: new Date('2024-01-01'),
              lte: new Date('2024-01-31'),
            },
          }),
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockPrisma.order.findMany.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost/api/reports/profit/export');
      const response = await GET(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Failed to export profit report');
    });

    it('should handle profit calculation errors gracefully', async () => {
      mockProfitCalculationService.calculateOrderProfit.mockRejectedValue(
        new Error('Calculation error')
      );

      const request = new NextRequest('http://localhost/api/reports/profit/export');
      const response = await GET(request);

      // Should still return success but with empty data
      expect(response.status).toBe(200);
    });
  });

  describe('Filename Generation', () => {
    it('should generate filename with date range', async () => {
      const request = new NextRequest(
        'http://localhost/api/reports/profit/export?period=custom&startDate=2024-01-01&endDate=2024-01-31'
      );
      const response = await GET(request);

      const contentDisposition = response.headers.get('content-disposition');
      expect(contentDisposition).toContain('profit-report-2024-01-01-to-2024-01-31');
    });

    it('should generate filename with current date for non-custom periods', async () => {
      const request = new NextRequest('http://localhost/api/reports/profit/export?period=monthly');
      const response = await GET(request);

      const contentDisposition = response.headers.get('content-disposition');
      expect(contentDisposition).toContain('profit-report-');
      expect(contentDisposition).toMatch(/profit-report-\d{4}-\d{2}-\d{2}/);
    });
  });
});