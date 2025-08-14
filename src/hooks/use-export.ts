import { useState } from 'react';

export interface ExportOptions {
  endpoint: string;
  filename?: string;
  onSuccess?: (filename: string) => void;
  onError?: (error: string) => void;
}

export interface ExportState {
  isExporting: boolean;
  progress: string;
  error: string | null;
}

export function useExport() {
  const [state, setState] = useState<ExportState>({
    isExporting: false,
    progress: '',
    error: null,
  });

  const exportData = async (
    format: 'csv' | 'excel',
    params: Record<string, string | number | boolean>,
    options: ExportOptions
  ) => {
    setState({
      isExporting: true,
      progress: 'Preparing export...',
      error: null,
    });

    try {
      // Build query parameters
      const searchParams = new URLSearchParams();
      searchParams.set('format', format);
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          searchParams.set(key, String(value));
        }
      });

      setState(prev => ({ ...prev, progress: 'Generating report...' }));

      const response = await fetch(`${options.endpoint}?${searchParams}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Export failed with status ${response.status}`);
      }

      setState(prev => ({ ...prev, progress: 'Downloading file...' }));

      // Handle file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Get filename from response headers or use provided filename
      let filename = options.filename || `export-${new Date().toISOString().split('T')[0]}`;
      const contentDisposition = response.headers.get('content-disposition');
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      } else {
        // Add extension if not present
        const extension = format === 'excel' ? 'xlsx' : 'csv';
        if (!filename.endsWith(`.${extension}`)) {
          filename += `.${extension}`;
        }
      }
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setState({
        isExporting: false,
        progress: 'Export completed successfully!',
        error: null,
      });

      // Call success callback
      if (options.onSuccess) {
        options.onSuccess(filename);
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setState(prev => ({ ...prev, progress: '' }));
      }, 3000);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Export failed';
      
      setState({
        isExporting: false,
        progress: '',
        error: errorMessage,
      });

      // Call error callback
      if (options.onError) {
        options.onError(errorMessage);
      }

      console.error('Export error:', error);
    }
  };

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  const reset = () => {
    setState({
      isExporting: false,
      progress: '',
      error: null,
    });
  };

  return {
    ...state,
    exportData,
    clearError,
    reset,
  };
}