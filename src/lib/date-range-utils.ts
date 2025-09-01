/**
 * Utility functions for handling date range URL parameters
 */

export interface DateRangeParams {
  startDate?: string;
  endDate?: string;
  preset?: string;
}

/**
 * Creates a query string with date range parameters while preserving other parameters
 */
export function createDateRangeQueryString(
  searchParams: URLSearchParams,
  dateParams: DateRangeParams
): string {
  const params = new URLSearchParams(Array.from(searchParams.entries()));
  
  // Handle startDate parameter
  if (dateParams.startDate) {
    params.set('startDate', dateParams.startDate);
  } else if (dateParams.startDate === '') {
    params.delete('startDate');
  }
  
  // Handle endDate parameter
  if (dateParams.endDate) {
    params.set('endDate', dateParams.endDate);
  } else if (dateParams.endDate === '') {
    params.delete('endDate');
  }
  
  // Handle preset parameter
  if (dateParams.preset) {
    params.set('preset', dateParams.preset);
  } else if (dateParams.preset === '') {
    params.delete('preset');
  }
  
  return params.toString();
}

/**
 * Extracts date range parameters from URL search params
 */
export function extractDateRangeParams(searchParams: URLSearchParams): DateRangeParams {
  return {
    startDate: searchParams.get('startDate') || undefined,
    endDate: searchParams.get('endDate') || undefined,
    preset: searchParams.get('preset') || undefined,
  };
}

/**
 * Validates date range parameters
 */
export function validateDateRange(startDate?: string, endDate?: string): {
  isValid: boolean;
  error?: string;
} {
  if (!startDate && !endDate) {
    return { isValid: true };
  }

  if (startDate && !isValidDateString(startDate)) {
    return { isValid: false, error: 'Invalid start date format' };
  }

  if (endDate && !isValidDateString(endDate)) {
    return { isValid: false, error: 'Invalid end date format' };
  }

  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      return { isValid: false, error: 'Start date must be before or equal to end date' };
    }
  }

  return { isValid: true };
}

/**
 * Checks if a string is a valid date in YYYY-MM-DD format
 */
function isValidDateString(dateString: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return false;
  }

  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime()) && 
         date.toISOString().slice(0, 10) === dateString;
}

/**
 * Converts date range parameters to Prisma date filter
 */
export function createPrismaDateFilter(startDate?: string, endDate?: string) {
  if (!startDate && !endDate) {
    return {};
  }

  return {
    createdAt: {
      ...(startDate ? { gte: new Date(startDate + 'T00:00:00.000Z') } : {}),
      ...(endDate ? { lte: new Date(endDate + 'T23:59:59.999Z') } : {}),
    }
  };
}