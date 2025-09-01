import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPrismaDateFilter, validateDateRange, createDateRangeQueryString, extractDateRangeParams } from '@/lib/date-range-utils';

// Mock the orders page logic for testing date range integration
describe('Orders Page Date Range Integration', () => {
  describe('URL parameter handling', () => {
    it('should extract and validate date parameters correctly', () => {
      // Simulate URL search params
      const mockSearchParams = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        query: 'test-search',
        sort: 'createdAt:desc'
      };

      const startDate = mockSearchParams.startDate || '';
      const endDate = mockSearchParams.endDate || '';

      // Validate date range parameters
      const dateValidation = validateDateRange(startDate || undefined, endDate || undefined);
      expect(dateValidation.isValid).toBe(true);

      // Create Prisma filter
      const dateFilter = createPrismaDateFilter(startDate || undefined, endDate || undefined);
      expect(dateFilter).toEqual({
        createdAt: {
          gte: new Date('2024-01-01T00:00:00.000Z'),
          lte: new Date('2024-01-31T23:59:59.999Z')
        }
      });
    });

    it('should handle invalid date parameters gracefully', () => {
      const mockSearchParams = {
        startDate: 'invalid-date',
        endDate: '2024-01-31'
      };

      const startDate = mockSearchParams.startDate || '';
      const endDate = mockSearchParams.endDate || '';

      // Validate date range parameters
      const dateValidation = validateDateRange(startDate || undefined, endDate || undefined);
      expect(dateValidation.isValid).toBe(false);
      expect(dateValidation.error).toBe('Invalid start date format');

      // Should not create filter for invalid dates
      const dateFilter = dateValidation.isValid 
        ? createPrismaDateFilter(startDate || undefined, endDate || undefined) 
        : {};
      expect(dateFilter).toEqual({});
    });

    it('should handle missing date parameters', () => {
      const mockSearchParams = {
        query: 'test-search',
        sort: 'createdAt:desc'
      };

      const startDate = mockSearchParams.startDate || '';
      const endDate = mockSearchParams.endDate || '';

      // Validate empty date range
      const dateValidation = validateDateRange(startDate || undefined, endDate || undefined);
      expect(dateValidation.isValid).toBe(true);

      // Should return empty filter for no dates
      const dateFilter = createPrismaDateFilter(startDate || undefined, endDate || undefined);
      expect(dateFilter).toEqual({});
    });

    it('should handle single date parameter', () => {
      const mockSearchParams = {
        startDate: '2024-01-01'
      };

      const startDate = mockSearchParams.startDate || '';
      const endDate = mockSearchParams.endDate || '';

      // Validate single date
      const dateValidation = validateDateRange(startDate || undefined, endDate || undefined);
      expect(dateValidation.isValid).toBe(true);

      // Should create filter with only start date
      const dateFilter = createPrismaDateFilter(startDate || undefined, endDate || undefined);
      expect(dateFilter).toEqual({
        createdAt: {
          gte: new Date('2024-01-01T00:00:00.000Z')
        }
      });
    });
  });

  describe('Prisma where clause integration', () => {
    it('should integrate date filter with existing where conditions', () => {
      const mockUser = { id: 'user1', role: 'ADMIN' };
      const searchQuery = 'test-search';
      const startDate = '2024-01-01';
      const endDate = '2024-01-31';
      const canViewAll = true;

      // Simulate the where clause construction from the orders page
      const dateValidation = validateDateRange(startDate, endDate);
      const dateFilter = dateValidation.isValid 
        ? createPrismaDateFilter(startDate, endDate) 
        : {};

      const where = {
        ...(!canViewAll && mockUser.role === 'TEAM_MEMBER' ? { userId: mockUser.id } : {}),
        ...(searchQuery ? {
          OR: [
            { id: { contains: searchQuery, mode: 'insensitive' } },
            { customerName: { contains: searchQuery, mode: 'insensitive' } },
            { customerPhone: { contains: searchQuery, mode: 'insensitive' } },
            { product: { name: { contains: searchQuery, mode: 'insensitive' } } },
          ],
        } : {}),
        ...dateFilter,
      };

      expect(where).toEqual({
        OR: [
          { id: { contains: 'test-search', mode: 'insensitive' } },
          { customerName: { contains: 'test-search', mode: 'insensitive' } },
          { customerPhone: { contains: 'test-search', mode: 'insensitive' } },
          { product: { name: { contains: 'test-search', mode: 'insensitive' } } },
        ],
        createdAt: {
          gte: new Date('2024-01-01T00:00:00.000Z'),
          lte: new Date('2024-01-31T23:59:59.999Z')
        }
      });
    });
  });

  describe('URL parameter persistence', () => {
    it('should preserve date range parameters when navigating', () => {
      // Simulate existing URL parameters
      const existingParams = new URLSearchParams('query=test&sort=createdAt:desc');
      
      // Add date range parameters
      const dateParams = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        preset: 'thismonth'
      };

      const queryString = createDateRangeQueryString(existingParams, dateParams);
      const newParams = new URLSearchParams(queryString);

      // Verify all parameters are preserved
      expect(newParams.get('query')).toBe('test');
      expect(newParams.get('sort')).toBe('createdAt:desc');
      expect(newParams.get('startDate')).toBe('2024-01-01');
      expect(newParams.get('endDate')).toBe('2024-01-31');
      expect(newParams.get('preset')).toBe('thismonth');
    });

    it('should extract date range parameters from URL correctly', () => {
      const urlParams = new URLSearchParams('startDate=2024-01-01&endDate=2024-01-31&preset=thismonth&query=test');
      
      const dateParams = extractDateRangeParams(urlParams);
      
      expect(dateParams).toEqual({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        preset: 'thismonth'
      });
    });

    it('should clear date range parameters when requested', () => {
      const existingParams = new URLSearchParams('startDate=2024-01-01&endDate=2024-01-31&preset=thismonth&query=test');
      
      // Clear date range parameters
      const queryString = createDateRangeQueryString(existingParams, {
        startDate: '',
        endDate: '',
        preset: ''
      });
      
      const newParams = new URLSearchParams(queryString);
      
      // Date parameters should be removed
      expect(newParams.get('startDate')).toBeNull();
      expect(newParams.get('endDate')).toBeNull();
      expect(newParams.get('preset')).toBeNull();
      
      // Other parameters should be preserved
      expect(newParams.get('query')).toBe('test');
    });

    it('should handle partial date range updates', () => {
      const existingParams = new URLSearchParams('startDate=2024-01-01&endDate=2024-01-31&query=test');
      
      // Update only end date
      const queryString = createDateRangeQueryString(existingParams, {
        endDate: '2024-02-29'
      });
      
      const newParams = new URLSearchParams(queryString);
      
      // Start date should remain unchanged
      expect(newParams.get('startDate')).toBe('2024-01-01');
      // End date should be updated
      expect(newParams.get('endDate')).toBe('2024-02-29');
      // Other parameters should be preserved
      expect(newParams.get('query')).toBe('test');
    });
  });
});