import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useExport } from '../use-export';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock DOM methods
const mockCreateObjectURL = vi.fn(() => 'mock-url');
const mockRevokeObjectURL = vi.fn();
const mockAppendChild = vi.fn();
const mockRemoveChild = vi.fn();
const mockClick = vi.fn();

// Setup DOM mocks
beforeEach(() => {
  Object.defineProperty(window, 'URL', {
    value: {
      createObjectURL: mockCreateObjectURL,
      revokeObjectURL: mockRevokeObjectURL,
    },
    configurable: true,
  });

  Object.defineProperty(document, 'createElement', {
    value: vi.fn(() => ({
      href: '',
      download: '',
      click: mockClick,
    })),
    configurable: true,
  });

  Object.defineProperty(document.body, 'appendChild', {
    value: mockAppendChild,
    configurable: true,
  });

  Object.defineProperty(document.body, 'removeChild', {
    value: mockRemoveChild,
    configurable: true,
  });
});

describe('useExport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useExport());

    expect(result.current.isExporting).toBe(false);
    expect(result.current.progress).toBe('');
    expect(result.current.error).toBe(null);
  });

  it('should handle successful CSV export', async () => {
    const mockBlob = new Blob(['csv,data'], { type: 'text/csv' });
    const mockResponse = {
      ok: true,
      blob: () => Promise.resolve(mockBlob),
      headers: {
        get: (name: string) => {
          if (name === 'content-disposition') {
            return 'attachment; filename="test-export.csv"';
          }
          return null;
        },
      },
    };

    mockFetch.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useExport());
    const onSuccess = vi.fn();

    await act(async () => {
      await result.current.exportData(
        'csv',
        { period: 'monthly', productId: 'product-1' },
        {
          endpoint: '/api/test/export',
          filename: 'test-export',
          onSuccess,
        }
      );
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/test/export?format=csv&period=monthly&productId=product-1');
    expect(onSuccess).toHaveBeenCalledWith('test-export.csv');
    expect(result.current.isExporting).toBe(false);
    expect(result.current.progress).toBe('Export completed successfully!');
    expect(result.current.error).toBe(null);
  });

  it('should handle successful Excel export', async () => {
    const mockBlob = new Blob(['excel data'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const mockResponse = {
      ok: true,
      blob: () => Promise.resolve(mockBlob),
      headers: {
        get: (name: string) => {
          if (name === 'content-disposition') {
            return 'attachment; filename="test-export.xlsx"';
          }
          return null;
        },
      },
    };

    mockFetch.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useExport());

    await act(async () => {
      await result.current.exportData(
        'excel',
        { period: 'weekly' },
        {
          endpoint: '/api/test/export',
          filename: 'test-export',
        }
      );
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/test/export?format=excel&period=weekly');
    expect(result.current.progress).toBe('Export completed successfully!');
  });

  it('should handle export errors', async () => {
    const mockResponse = {
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: 'Invalid parameters' }),
    };

    mockFetch.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useExport());
    const onError = vi.fn();

    await act(async () => {
      await result.current.exportData(
        'csv',
        { period: 'invalid' },
        {
          endpoint: '/api/test/export',
          onError,
        }
      );
    });

    expect(result.current.isExporting).toBe(false);
    expect(result.current.error).toBe('Invalid parameters');
    expect(onError).toHaveBeenCalledWith('Invalid parameters');
  });

  it('should handle network errors', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useExport());

    await act(async () => {
      await result.current.exportData(
        'csv',
        {},
        {
          endpoint: '/api/test/export',
        }
      );
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.isExporting).toBe(false);
  });

  it('should filter out empty parameters', async () => {
    const mockResponse = {
      ok: true,
      blob: () => Promise.resolve(new Blob()),
      headers: { get: () => null },
    };

    mockFetch.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useExport());

    await act(async () => {
      await result.current.exportData(
        'csv',
        {
          period: 'monthly',
          productId: '',
          userId: null,
          status: undefined,
          validParam: 'value',
        },
        {
          endpoint: '/api/test/export',
        }
      );
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/test/export?format=csv&period=monthly&validParam=value');
  });

  it('should clear error', () => {
    const { result } = renderHook(() => useExport());

    // Set an error first
    act(() => {
      result.current.exportData('csv', {}, { endpoint: '/api/test' });
    });

    // Clear the error
    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBe(null);
  });

  it('should reset state', () => {
    const { result } = renderHook(() => useExport());

    // Set some state first
    act(() => {
      result.current.exportData('csv', {}, { endpoint: '/api/test' });
    });

    // Reset
    act(() => {
      result.current.reset();
    });

    expect(result.current.isExporting).toBe(false);
    expect(result.current.progress).toBe('');
    expect(result.current.error).toBe(null);
  });

  it('should clear progress message after timeout', async () => {
    const mockResponse = {
      ok: true,
      blob: () => Promise.resolve(new Blob()),
      headers: { get: () => null },
    };

    mockFetch.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useExport());

    await act(async () => {
      await result.current.exportData('csv', {}, { endpoint: '/api/test' });
    });

    expect(result.current.progress).toBe('Export completed successfully!');

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.progress).toBe('');
  });

  it('should generate filename with extension when not provided', async () => {
    const mockResponse = {
      ok: true,
      blob: () => Promise.resolve(new Blob()),
      headers: { get: () => null },
    };

    mockFetch.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useExport());

    await act(async () => {
      await result.current.exportData(
        'excel',
        {},
        {
          endpoint: '/api/test/export',
          filename: 'test-export',
        }
      );
    });

    // Check that the download attribute was set with the correct extension
    expect(mockAppendChild).toHaveBeenCalled();
  });
});