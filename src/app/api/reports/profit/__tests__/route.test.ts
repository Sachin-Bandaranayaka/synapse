import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';

// Mock the dependencies
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

vi.mock('@/lib/prisma', () => ({
  getScopedPrismaClient: vi.fn(),
}));

vi.mock('@/lib/profit-calculation', () => ({
  profitCalculationService: {
    calculateOrderProfit: vi.fn(),
  },
}));

describe('Profit Reports API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 for unauthenticated requests', async () => {
    const { getServerSession } = await import('next-auth');
    vi.mocked(getServerSession).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/reports/profit');
    const response = await GET(request);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 403 for non-admin users', async () => {
    const { getServerSession } = await import('next-auth');
    vi.mocked(getServerSession).mockResolvedValue({
      user: {
        tenantId: 'tenant-1',
        role: 'TEAM_MEMBER',
      },
    } as any);

    const request = new NextRequest('http://localhost:3000/api/reports/profit');
    const response = await GET(request);

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toBe('Forbidden');
  });

  it('should handle valid requests for admin users', async () => {
    const { getServerSession } = await import('next-auth');
    const { getScopedPrismaClient } = await import('@/lib/prisma');
    const { profitCalculationService } = await import('@/lib/profit-calculation');

    // Mock session
    vi.mocked(getServerSession).mockResolvedValue({
      user: {
        tenantId: 'tenant-1',
        role: 'ADMIN',
      },
    } as any);

    // Mock prisma client
    const mockPrisma = {
      order: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'order-1',
            createdAt: new Date('2024-01-01'),
            product: { id: 'product-1', name: 'Test Product' },
            lead: { batch: null, assignedTo: null },
            costs: null,
          },
        ]),
      },
    };
    vi.mocked(getScopedPrismaClient).mockReturnValue(mockPrisma as any);

    // Mock profit calculation
    vi.mocked(profitCalculationService.calculateOrderProfit).mockResolvedValue({
      orderId: 'order-1',
      revenue: 100,
      costs: {
        product: 50,
        lead: 10,
        packaging: 5,
        printing: 3,
        return: 0,
        total: 68,
      },
      grossProfit: 50,
      netProfit: 32,
      profitMargin: 32,
      isReturn: false,
    });

    const request = new NextRequest('http://localhost:3000/api/reports/profit?period=monthly');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    
    expect(data).toHaveProperty('period');
    expect(data).toHaveProperty('summary');
    expect(data).toHaveProperty('breakdown');
    expect(data).toHaveProperty('trends');
    
    expect(data.summary.totalRevenue).toBe(100);
    expect(data.summary.netProfit).toBe(32);
    expect(data.summary.orderCount).toBe(1);
  });

  it('should handle custom date ranges', async () => {
    const { getServerSession } = await import('next-auth');
    const { getScopedPrismaClient } = await import('@/lib/prisma');

    vi.mocked(getServerSession).mockResolvedValue({
      user: {
        tenantId: 'tenant-1',
        role: 'ADMIN',
      },
    } as any);

    const mockPrisma = {
      order: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    };
    vi.mocked(getScopedPrismaClient).mockReturnValue(mockPrisma as any);

    const request = new NextRequest(
      'http://localhost:3000/api/reports/profit?period=custom&startDate=2024-01-01&endDate=2024-01-31'
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          createdAt: expect.objectContaining({
            gte: expect.any(Date),
            lte: expect.any(Date),
          }),
        }),
      })
    );
  });

  it('should handle filtering by product and user', async () => {
    const { getServerSession } = await import('next-auth');
    const { getScopedPrismaClient } = await import('@/lib/prisma');

    vi.mocked(getServerSession).mockResolvedValue({
      user: {
        tenantId: 'tenant-1',
        role: 'ADMIN',
      },
    } as any);

    const mockPrisma = {
      order: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    };
    vi.mocked(getScopedPrismaClient).mockReturnValue(mockPrisma as any);

    const request = new NextRequest(
      'http://localhost:3000/api/reports/profit?productId=product-1&userId=user-1'
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          productId: 'product-1',
          lead: {
            userId: 'user-1',
          },
        }),
      })
    );
  });
});