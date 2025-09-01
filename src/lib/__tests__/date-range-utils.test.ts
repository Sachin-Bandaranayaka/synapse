import { describe, it, expect } from 'vitest';
import { 
  createDateRangeQueryString, 
  extractDateRangeParams, 
  validateDateRange,
  createPrismaDateFilter
} from '../date-range-utils';

describe('date-range-utils', () => {
  describe('createDateRangeQueryString', () => {
    it('should add date range parameters to empty search params', () => {
      const searchParams = new URLSearchParams();
      const result = createDateRangeQueryString(searchParams, {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        preset: 'thismonth'
      });
      
      expect(result).toBe('startDate=2024-01-01&endDate=2024-01-31&preset=thismonth');
    });

    it('should preserve existing parameters while adding date range', () => {
      const searchParams = new URLSearchParams('query=test&sort=createdAt:desc');
      const result = createDateRangeQueryString(searchParams, {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      });
      
      expect(result).toBe('query=test&sort=createdAt%3Adesc&startDate=2024-01-01&endDate=2024-01-31');
    });

    it('should remove parameters when empty string is provided', () => {
      const searchParams = new URLSearchParams('startDate=2024-01-01&endDate=2024-01-31&preset=today');
      const result = createDateRangeQueryString(searchParams, {
        startDate: '',
        endDate: '',
        preset: ''
      });
      
      expect(result).toBe('');
    });

    it('should update existing date parameters', () => {
      const searchParams = new URLSearchParams('startDate=2024-01-01&endDate=2024-01-31');
      const result = createDateRangeQueryString(searchParams, {
        startDate: '2024-02-01',
        endDate: '2024-02-28'
      });
      
      expect(result).toBe('startDate=2024-02-01&endDate=2024-02-28');
    });
  });

  describe('extractDateRangeParams', () => {
    it('should extract date range parameters from search params', () => {
      const searchParams = new URLSearchParams('startDate=2024-01-01&endDate=2024-01-31&preset=thismonth');
      const result = extractDateRangeParams(searchParams);
      
      expect(result).toEqual({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        preset: 'thismonth'
      });
    });

    it('should return undefined for missing parameters', () => {
      const searchParams = new URLSearchParams('query=test');
      const result = extractDateRangeParams(searchParams);
      
      expect(result).toEqual({
        startDate: undefined,
        endDate: undefined,
        preset: undefined
      });
    });
  });

  describe('validateDateRange', () => {
    it('should validate correct date range', () => {
      const result = validateDateRange('2024-01-01', '2024-01-31');
      expect(result).toEqual({ isValid: true });
    });

    it('should validate single start date', () => {
      const result = validateDateRange('2024-01-01', undefined);
      expect(result).toEqual({ isValid: true });
    });

    it('should validate single end date', () => {
      const result = validateDateRange(undefined, '2024-01-31');
      expect(result).toEqual({ isValid: true });
    });

    it('should validate empty date range', () => {
      const result = validateDateRange(undefined, undefined);
      expect(result).toEqual({ isValid: true });
    });

    it('should reject invalid date format', () => {
      const result = validateDateRange('invalid-date', '2024-01-31');
      expect(result).toEqual({ 
        isValid: false, 
        error: 'Invalid start date format' 
      });
    });

    it('should reject start date after end date', () => {
      const result = validateDateRange('2024-01-31', '2024-01-01');
      expect(result).toEqual({ 
        isValid: false, 
        error: 'Start date must be before or equal to end date' 
      });
    });

    it('should accept same start and end date', () => {
      const result = validateDateRange('2024-01-01', '2024-01-01');
      expect(result).toEqual({ isValid: true });
    });
  });

  describe('createPrismaDateFilter', () => {
    it('should create filter with both start and end dates', () => {
      const result = createPrismaDateFilter('2024-01-01', '2024-01-31');
      expect(result).toEqual({
        createdAt: {
          gte: new Date('2024-01-01T00:00:00.000Z'),
          lte: new Date('2024-01-31T23:59:59.999Z')
        }
      });
    });

    it('should create filter with only start date', () => {
      const result = createPrismaDateFilter('2024-01-01', undefined);
      expect(result).toEqual({
        createdAt: {
          gte: new Date('2024-01-01T00:00:00.000Z')
        }
      });
    });

    it('should create filter with only end date', () => {
      const result = createPrismaDateFilter(undefined, '2024-01-31');
      expect(result).toEqual({
        createdAt: {
          lte: new Date('2024-01-31T23:59:59.999Z')
        }
      });
    });

    it('should return empty object for no dates', () => {
      const result = createPrismaDateFilter(undefined, undefined);
      expect(result).toEqual({});
    });
  });
});