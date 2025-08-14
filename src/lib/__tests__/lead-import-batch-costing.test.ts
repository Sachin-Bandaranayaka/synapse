import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the Prisma client
const mockPrisma = {
  $transaction: vi.fn(),
  leadBatch: {
    create: vi.fn(),
  },
  lead: {
    create: vi.fn(),
  },
  product: {
    findMany: vi.fn(),
  },
};

// Mock the getScopedPrismaClient function
vi.mock('@/lib/prisma', () => ({
  getScopedPrismaClient: vi.fn(() => mockPrisma),
}));

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(() => Promise.resolve({
    user: {
      id: 'user-1',
      tenantId: 'tenant-1',
    },
  })),
}));

// Mock auth options
vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

describe('Lead Import with Batch Costing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create lead batch with cost when importing leads with totalCost', async () => {
    const mockLeadBatch = {
      id: 'batch-1',
      totalCost: 100,
      leadCount: 2,
      costPerLead: 50,
    };

    const mockCreatedLeads = [
      { id: 'lead-1', batchId: 'batch-1' },
      { id: 'lead-2', batchId: 'batch-1' },
    ];

    // Mock the transaction to return both leadBatch and createdLeads
    mockPrisma.$transaction.mockImplementation(async (callback) => {
      // Mock leadBatch.create
      mockPrisma.leadBatch.create.mockResolvedValue(mockLeadBatch);
      
      // Mock lead.create calls
      mockPrisma.lead.create.mockResolvedValue(mockCreatedLeads[0]);
      
      const result = await callback(mockPrisma);
      return {
        leadBatch: mockLeadBatch,
        createdLeads: mockCreatedLeads,
      };
    });

    // Import the route handler
    const { POST } = await import('@/app/api/leads/import/route');

    const request = new Request('http://localhost/api/leads/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'import',
        leads: [
          {
            customer_name: 'John Doe',
            phone: '0771234567',
            address: '123 Main St',
            product_code: 'PROD001',
          },
          {
            customer_name: 'Jane Smith',
            phone: '0777654321',
            address: '456 Oak Ave',
            product_code: 'PROD002',
          },
        ],
        totalCost: 100,
      }),
    });

    const response = await POST(request);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.count).toBe(2);
    expect(result.totalCost).toBe(100);
    expect(result.costPerLead).toBe(50); // 100 / 2 leads
    expect(result.batchId).toBe('batch-1');

    // Verify leadBatch.create was called with correct parameters
    expect(mockPrisma.leadBatch.create).toHaveBeenCalledWith({
      data: {
        totalCost: 100,
        leadCount: 2,
        costPerLead: 50,
        tenantId: 'tenant-1',
        userId: 'user-1',
      },
    });
  });

  it('should create lead batch with zero cost when no totalCost provided', async () => {
    const mockLeadBatch = {
      id: 'batch-2',
      totalCost: 0,
      leadCount: 2,
      costPerLead: 0,
    };

    const mockCreatedLeads = [
      { id: 'lead-3', batchId: 'batch-2' },
      { id: 'lead-4', batchId: 'batch-2' },
    ];

    mockPrisma.$transaction.mockImplementation(async (callback) => {
      mockPrisma.leadBatch.create.mockResolvedValue(mockLeadBatch);
      mockPrisma.lead.create.mockResolvedValue(mockCreatedLeads[0]);
      
      const result = await callback(mockPrisma);
      return {
        leadBatch: mockLeadBatch,
        createdLeads: mockCreatedLeads,
      };
    });

    const { POST } = await import('@/app/api/leads/import/route');

    const request = new Request('http://localhost/api/leads/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'import',
        leads: [
          {
            customer_name: 'Bob Johnson',
            phone: '0779876543',
            address: '789 Pine St',
            product_code: 'PROD003',
          },
          {
            customer_name: 'Alice Brown',
            phone: '0776543210',
            address: '321 Elm St',
            product_code: 'PROD004',
          },
        ],
        // No totalCost provided
      }),
    });

    const response = await POST(request);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.count).toBe(2);
    expect(result.totalCost).toBe(0);
    expect(result.costPerLead).toBe(0);

    // Verify leadBatch.create was called with zero costs
    expect(mockPrisma.leadBatch.create).toHaveBeenCalledWith({
      data: {
        totalCost: 0,
        leadCount: 2,
        costPerLead: 0,
        tenantId: 'tenant-1',
        userId: 'user-1',
      },
    });
  });

  it('should handle preview action without creating batch', async () => {
    const mockProducts = [
      { code: 'PROD001', stock: 100, lowStockAlert: 10 },
      { code: 'PROD002', stock: 5, lowStockAlert: 10 },
    ];

    mockPrisma.product.findMany.mockResolvedValue(mockProducts);

    const { POST } = await import('@/app/api/leads/import/route');

    const request = new Request('http://localhost/api/leads/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'preview',
        leads: [
          {
            customer_name: 'Test User',
            phone: '0771111111',
            address: 'Test Address',
            product_code: 'PROD001',
          },
        ],
      }),
    });

    const response = await POST(request);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.preview).toBeDefined();
    expect(result.preview[0].status).toBe('OK_TO_IMPORT');

    // Verify no batch was created during preview
    expect(mockPrisma.leadBatch.create).not.toHaveBeenCalled();
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });
});