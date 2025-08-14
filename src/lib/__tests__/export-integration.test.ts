// src/lib/__tests__/export-integration.test.ts

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

/**
 * Integration tests for export functionality
 * Tests CSV/Excel export capabilities with various data sets
 * Validates Requirements 8.1, 8.2, 8.3
 */
describe('Export Functionality Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Profit Report Export Integration', () => {
    it('should export profit data in CSV format with all cost components', async () => {
      // Test Requirement 8.1: CSV export capabilities
      
      // Mock authentication
      const { getServerSession } = await import('next-auth');
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          tenantId: 'tenant-export-test',
          role: 'ADMIN'
        },
      } as any);

      // Mock comprehensive profit data
      const mockProfitData = [
        {
          orderId: 'order-1',
          orderDate: '2024-01-15',
          productName: 'Test Product 1',
          customerName: 'John Doe',
          revenue: 150.00,
          costs: {
            product: 60.00,
            lead: 8.00,
            packaging: 5.00,
            printing: 3.00,
            return: 0,
            total: 76.00
          },
          grossProfit: 90.00,
          netProfit: 74.00,
          profitMargin: 49.33,
          isReturn: false,
          status: 'CONFIRMED'
        },
        {
          orderId: 'order-2',
          orderDate: '2024-01-20',
          productName: 'Test Product 2',
          customerName: 'Jane Smith',
          revenue: 200.00,
          costs: {
            product: 80.00,
            lead: 12.00,
            packaging: 8.00,
            printing: 4.00,
            return: 25.00,
            total: 129.00
          },
          grossProfit: 120.00,
          netProfit: 71.00,
          profitMargin: 35.50,
          isReturn: true,
          status: 'RETURNED'
        }
      ];

      // Mock database and services
      const { getScopedPrismaClient } = await import('@/lib/prisma');
      const mockPrisma = {
        order: {
          findMany: vi.fn().mockResolvedValue([
            {
              id: 'order-1',
              createdAt: new Date('2024-01-15'),
              total: 150.00,
              status: 'CONFIRMED',
              product: { name: 'Test Product 1' },
              lead: { 
                customerName: 'John Doe',
                batch: { costPerLead: 8.00 }
              },
              costs: {
                packagingCost: 5.00,
                printingCost: 3.00,
                returnCost: 0
              }
            },
            {
              id: 'order-2',
              createdAt: new Date('2024-01-20'),
              total: 200.00,
              status: 'RETURNED',
              product: { name: 'Test Product 2' },
              lead: { 
                customerName: 'Jane Smith',
                batch: { costPerLead: 12.00 }
              },
              costs: {
                packagingCost: 8.00,
                printingCost: 4.00,
                returnCost: 25.00
              }
            }
          ])
        }
      };
      vi.mocked(getScopedPrismaClient).mockReturnValue(mockPrisma as any);

      // Mock profit calculation service
      const { profitCalculationService } = await import('@/lib/profit-calculation');
      vi.mocked(profitCalculationService.calculateOrderProfit)
        .mockResolvedValueOnce(mockProfitData[0])
        .mockResolvedValueOnce(mockProfitData[1]);

      // Mock export utility
      const mockExportUtils = {
        generateCSV: vi.fn().mockReturnValue('Order ID,Date,Product,Customer,Revenue,Product Cost,Lead Cost,Packaging Cost,Printing Cost,Return Cost,Total Costs,Gross Profit,Net Profit,Profit Margin,Status\norder-1,2024-01-15,Test Product 1,John Doe,150.00,60.00,8.00,5.00,3.00,0.00,76.00,90.00,74.00,49.33%,CONFIRMED\norder-2,2024-01-20,Test Product 2,Jane Smith,200.00,80.00,12.00,8.00,4.00,25.00,129.00,120.00,71.00,35.50%,RETURNED'),
        generateExcel: vi.fn().mockReturnValue(Buffer.from('mock excel data'))
      };

      vi.doMock('@/lib/export-utils', () => mockExportUtils);

      // Import and test the export route
      const { GET: exportProfitReport } = await import('@/app/api/reports/profit/export/route');
      
      const request = new NextRequest(
        'http://localhost:3000/api/reports/profit/export?format=csv&period=monthly'
      );
      const response = await exportProfitReport(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/csv');
      expect(response.headers.get('Content-Disposition')).toContain('attachment');
      expect(response.headers.get('Content-Disposition')).toContain('profit-report');

      const csvContent = await response.text();
      expect(csvContent).toContain('Order ID,Date,Product,Customer,Revenue');
      expect(csvContent).toContain('order-1,2024-01-15,Test Product 1,John Doe,150.00');
      expect(csvContent).toContain('order-2,2024-01-20,Test Product 2,Jane Smith,200.00');
      expect(csvContent).toContain('74.00,49.33%,CONFIRMED');
      expect(csvContent).toContain('71.00,35.50%,RETURNED');
    });

    it('should export profit data in Excel format with proper formatting', async () => {
      // Test Requirement 8.1: Excel export capabilities
      
      const { getServerSession } = await import('next-auth');
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          tenantId: 'tenant-excel-test',
          role: 'ADMIN'
        },
      } as any);

      // Mock data and services (similar to CSV test)
      const { getScopedPrismaClient } = await import('@/lib/prisma');
      const mockPrisma = {
        order: {
          findMany: vi.fn().mockResolvedValue([
            {
              id: 'order-excel-1',
              createdAt: new Date('2024-02-01'),
              total: 300.00,
              status: 'CONFIRMED',
              product: { name: 'Excel Test Product' },
              lead: { 
                customerName: 'Excel Customer',
                batch: { costPerLead: 15.00 }
              },
              costs: {
                packagingCost: 10.00,
                printingCost: 5.00,
                returnCost: 0
              }
            }
          ])
        }
      };
      vi.mocked(getScopedPrismaClient).mockReturnValue(mockPrisma as any);

      const { profitCalculationService } = await import('@/lib/profit-calculation');
      vi.mocked(profitCalculationService.calculateOrderProfit).mockResolvedValue({
        orderId: 'order-excel-1',
        revenue: 300.00,
        costs: {
          product: 120.00,
          lead: 15.00,
          packaging: 10.00,
          printing: 5.00,
          return: 0,
          total: 150.00
        },
        grossProfit: 180.00,
        netProfit: 150.00,
        profitMargin: 50.00,
        isReturn: false
      });

      // Mock Excel export
      const mockExcelBuffer = Buffer.from('mock excel binary data');
      const mockExportUtils = {
        generateExcel: vi.fn().mockReturnValue(mockExcelBuffer)
      };
      vi.doMock('@/lib/export-utils', () => mockExportUtils);

      const { GET: exportProfitReport } = await import('@/app/api/reports/profit/export/route');
      
      const request = new NextRequest(
        'http://localhost:3000/api/reports/profit/export?format=excel&period=monthly'
      );
      const response = await exportProfitReport(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      expect(response.headers.get('Content-Disposition')).toContain('attachment');
      expect(response.headers.get('Content-Disposition')).toContain('.xlsx');

      const excelBuffer = await response.arrayBuffer();
      expect(Buffer.from(excelBuffer)).toEqual(mockExcelBuffer);
      expect(mockExportUtils.generateExcel).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            orderId: 'order-excel-1',
            revenue: 300.00,
            netProfit: 150.00
          })
        ]),
        expect.objectContaining({
          title: expect.stringContaining('Profit Report'),
          columns: expect.any(Array)
        })
      );
    });

    it('should respect current filters and date ranges in exports', async () => {
      // Test Requirement 8.3: Export respects current filters
      
      const { getServerSession } = await import('next-auth');
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          tenantId: 'tenant-filter-test',
          role: 'ADMIN'
        },
      } as any);

      const { getScopedPrismaClient } = await import('@/lib/prisma');
      const mockPrisma = {
        order: {
          findMany: vi.fn().mockResolvedValue([])
        }
      };
      vi.mocked(getScopedPrismaClient).mockReturnValue(mockPrisma as any);

      const { GET: exportProfitReport } = await import('@/app/api/reports/profit/export/route');
      
      // Test with multiple filters
      const request = new NextRequest(
        'http://localhost:3000/api/reports/profit/export?format=csv&period=custom&startDate=2024-01-01&endDate=2024-01-31&productId=product-123&userId=user-456&status=CONFIRMED'
      );
      const response = await exportProfitReport(request);

      expect(response.status).toBe(200);
      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
            productId: 'product-123',
            lead: expect.objectContaining({
              userId: 'user-456'
            }),
            status: 'CONFIRMED'
          }),
        })
      );
    });

    it('should handle large dataset exports efficiently', async () => {
      // Test performance with large datasets
      
      const { getServerSession } = await import('next-auth');
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          tenantId: 'tenant-large-export',
          role: 'ADMIN'
        },
      } as any);

      // Mock large dataset (5000 orders)
      const largeOrderSet = Array.from({ length: 5000 }, (_, i) => ({
        id: `order-large-${i}`,
        createdAt: new Date('2024-01-01'),
        total: 100 + (i % 100),
        status: i % 10 === 0 ? 'RETURNED' : 'CONFIRMED',
        product: { name: `Product ${i % 50}` },
        lead: { 
          customerName: `Customer ${i}`,
          batch: { costPerLead: 5 + (i % 10) }
        },
        costs: {
          packagingCost: 3 + (i % 3),
          printingCost: 2 + (i % 2),
          returnCost: i % 10 === 0 ? 15 : 0
        }
      }));

      const { getScopedPrismaClient } = await import('@/lib/prisma');
      const mockPrisma = {
        order: {
          findMany: vi.fn().mockResolvedValue(largeOrderSet)
        }
      };
      vi.mocked(getScopedPrismaClient).mockReturnValue(mockPrisma as any);

      const { profitCalculationService } = await import('@/lib/profit-calculation');
      vi.mocked(profitCalculationService.calculateOrderProfit)
        .mockImplementation(async (orderId) => {
          const index = parseInt(orderId.split('-')[2]);
          return {
            orderId,
            revenue: 100 + (index % 100),
            costs: {
              product: 50 + (index % 20),
              lead: 5 + (index % 10),
              packaging: 3 + (index % 3),
              printing: 2 + (index % 2),
              return: index % 10 === 0 ? 15 : 0,
              total: 60 + (index % 35)
            },
            grossProfit: 50 + (index % 80),
            netProfit: 40 + (index % 65),
            profitMargin: 40 + (index % 30),
            isReturn: index % 10 === 0
          };
        });

      const mockExportUtils = {
        generateCSV: vi.fn().mockImplementation((data) => {
          // Simulate CSV generation time
          return `Generated CSV with ${data.length} rows`;
        })
      };
      vi.doMock('@/lib/export-utils', () => mockExportUtils);

      const { GET: exportProfitReport } = await import('@/app/api/reports/profit/export/route');
      
      const startTime = Date.now();
      const request = new NextRequest(
        'http://localhost:3000/api/reports/profit/export?format=csv&period=monthly'
      );
      const response = await exportProfitReport(request);
      const endTime = Date.now();

      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
      expect(mockExportUtils.generateCSV).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            orderId: expect.stringMatching(/order-large-\d+/)
          })
        ])
      );
    });

    it('should provide download progress indicators for large exports', async () => {
      // Test Requirement 8.3: Export progress indicators
      
      const { getServerSession } = await import('next-auth');
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          tenantId: 'tenant-progress-test',
          role: 'ADMIN'
        },
      } as any);

      // Mock streaming export response
      const mockStreamingExport = {
        createExportStream: vi.fn().mockReturnValue({
          readable: true,
          pipe: vi.fn(),
          on: vi.fn(),
          emit: vi.fn()
        })
      };

      vi.doMock('@/lib/export-utils', () => mockStreamingExport);

      const { GET: exportProfitReport } = await import('@/app/api/reports/profit/export/route');
      
      const request = new NextRequest(
        'http://localhost:3000/api/reports/profit/export?format=csv&period=monthly&streaming=true'
      );
      const response = await exportProfitReport(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Transfer-Encoding')).toBe('chunked');
      expect(response.headers.get('X-Export-Status')).toBe('streaming');
    });

    it('should handle export errors gracefully', async () => {
      // Test error handling in export functionality
      
      const { getServerSession } = await import('next-auth');
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          tenantId: 'tenant-error-test',
          role: 'ADMIN'
        },
      } as any);

      const { getScopedPrismaClient } = await import('@/lib/prisma');
      const mockPrisma = {
        order: {
          findMany: vi.fn().mockRejectedValue(new Error('Database export query failed'))
        }
      };
      vi.mocked(getScopedPrismaClient).mockReturnValue(mockPrisma as any);

      const { GET: exportProfitReport } = await import('@/app/api/reports/profit/export/route');
      
      const request = new NextRequest(
        'http://localhost:3000/api/reports/profit/export?format=csv&period=monthly'
      );
      const response = await exportProfitReport(request);

      expect(response.status).toBe(500);
      const errorData = await response.json();
      expect(errorData.error).toBe('Failed to export profit report');
    });

    it('should validate export format parameters', async () => {
      // Test invalid export format handling
      
      const { getServerSession } = await import('next-auth');
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          tenantId: 'tenant-validation-test',
          role: 'ADMIN'
        },
      } as any);

      const { GET: exportProfitReport } = await import('@/app/api/reports/profit/export/route');
      
      // Test invalid format
      const request = new NextRequest(
        'http://localhost:3000/api/reports/profit/export?format=invalid&period=monthly'
      );
      const response = await exportProfitReport(request);

      expect(response.status).toBe(400);
      const errorData = await response.json();
      expect(errorData.error).toContain('Invalid export format');
    });
  });

  describe('Multi-Format Export Support', () => {
    it('should support multiple export formats with consistent data', async () => {
      // Test Requirement 8.2: Include all cost components and calculated fields
      
      const { getServerSession } = await import('next-auth');
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          tenantId: 'tenant-multi-format',
          role: 'ADMIN'
        },
      } as any);

      const mockProfitData = {
        orderId: 'order-multi-format',
        revenue: 250.00,
        costs: {
          product: 100.00,
          lead: 20.00,
          packaging: 8.00,
          printing: 5.00,
          return: 0,
          total: 133.00
        },
        grossProfit: 150.00,
        netProfit: 117.00,
        profitMargin: 46.80,
        isReturn: false
      };

      const { getScopedPrismaClient } = await import('@/lib/prisma');
      const mockPrisma = {
        order: {
          findMany: vi.fn().mockResolvedValue([
            {
              id: 'order-multi-format',
              createdAt: new Date('2024-03-01'),
              total: 250.00,
              status: 'CONFIRMED',
              product: { name: 'Multi Format Product' },
              lead: { 
                customerName: 'Multi Format Customer',
                batch: { costPerLead: 20.00 }
              },
              costs: {
                packagingCost: 8.00,
                printingCost: 5.00,
                returnCost: 0
              }
            }
          ])
        }
      };
      vi.mocked(getScopedPrismaClient).mockReturnValue(mockPrisma as any);

      const { profitCalculationService } = await import('@/lib/profit-calculation');
      vi.mocked(profitCalculationService.calculateOrderProfit).mockResolvedValue(mockProfitData);

      const mockExportUtils = {
        generateCSV: vi.fn().mockReturnValue('CSV data with all fields'),
        generateExcel: vi.fn().mockReturnValue(Buffer.from('Excel data with all fields')),
        generateJSON: vi.fn().mockReturnValue(JSON.stringify([mockProfitData]))
      };
      vi.doMock('@/lib/export-utils', () => mockExportUtils);

      const { GET: exportProfitReport } = await import('@/app/api/reports/profit/export/route');

      // Test CSV export
      const csvRequest = new NextRequest(
        'http://localhost:3000/api/reports/profit/export?format=csv&period=monthly'
      );
      const csvResponse = await exportProfitReport(csvRequest);
      expect(csvResponse.status).toBe(200);
      expect(csvResponse.headers.get('Content-Type')).toBe('text/csv');

      // Test Excel export
      const excelRequest = new NextRequest(
        'http://localhost:3000/api/reports/profit/export?format=excel&period=monthly'
      );
      const excelResponse = await exportProfitReport(excelRequest);
      expect(excelResponse.status).toBe(200);
      expect(excelResponse.headers.get('Content-Type')).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

      // Test JSON export
      const jsonRequest = new NextRequest(
        'http://localhost:3000/api/reports/profit/export?format=json&period=monthly'
      );
      const jsonResponse = await exportProfitReport(jsonRequest);
      expect(jsonResponse.status).toBe(200);
      expect(jsonResponse.headers.get('Content-Type')).toBe('application/json');

      // Verify all formats received the same data
      expect(mockExportUtils.generateCSV).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            orderId: 'order-multi-format',
            revenue: 250.00,
            netProfit: 117.00
          })
        ])
      );
      expect(mockExportUtils.generateExcel).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            orderId: 'order-multi-format',
            revenue: 250.00,
            netProfit: 117.00
          })
        ])
      );
    });
  });

  describe('Export Security and Authorization', () => {
    it('should enforce proper authorization for export operations', async () => {
      // Test export authorization requirements
      
      const { getServerSession } = await import('next-auth');
      
      // Test unauthorized access
      vi.mocked(getServerSession).mockResolvedValue(null);

      const { GET: exportProfitReport } = await import('@/app/api/reports/profit/export/route');
      
      const request = new NextRequest(
        'http://localhost:3000/api/reports/profit/export?format=csv&period=monthly'
      );
      const response = await exportProfitReport(request);

      expect(response.status).toBe(401);
      const errorData = await response.json();
      expect(errorData.error).toBe('Unauthorized');

      // Test insufficient permissions
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          tenantId: 'tenant-test',
          role: 'TEAM_MEMBER' // Not admin
        },
      } as any);

      const response2 = await exportProfitReport(request);
      expect(response2.status).toBe(403);
      const errorData2 = await response2.json();
      expect(errorData2.error).toBe('Forbidden');
    });

    it('should maintain tenant isolation in export operations', async () => {
      // Test tenant data isolation in exports
      
      const { getServerSession } = await import('next-auth');
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          tenantId: 'tenant-isolation-test',
          role: 'ADMIN'
        },
      } as any);

      const { getScopedPrismaClient } = await import('@/lib/prisma');
      const mockPrisma = {
        order: {
          findMany: vi.fn().mockResolvedValue([
            {
              id: 'order-isolated',
              tenantId: 'tenant-isolation-test',
              createdAt: new Date('2024-03-01'),
              total: 100.00
            }
          ])
        }
      };
      vi.mocked(getScopedPrismaClient).mockReturnValue(mockPrisma as any);

      const { GET: exportProfitReport } = await import('@/app/api/reports/profit/export/route');
      
      const request = new NextRequest(
        'http://localhost:3000/api/reports/profit/export?format=csv&period=monthly'
      );
      const response = await exportProfitReport(request);

      expect(response.status).toBe(200);
      expect(getScopedPrismaClient).toHaveBeenCalledWith('tenant-isolation-test');
      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({
            tenantId: expect.any(String) // Should not explicitly filter by tenantId as scoped client handles this
          })
        })
      );
    });
  });
});