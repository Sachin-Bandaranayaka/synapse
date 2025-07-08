// src/app/leads/import/page.tsx

'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { parse } from 'papaparse';
import { z } from 'zod';
import { LeadSchema, type LeadData } from '@/lib/csv-parser';

// --- Type Definitions ---
type PreviewStatus = 'OK_TO_IMPORT' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'INVALID_PRODUCT';

interface PreviewItem {
  data: LeadData;
  status: PreviewStatus;
  id: string; 
}

// --- NEW: Phone Number Normalization Helper ---
function normalizePhoneNumber(phone: string): string {
    if (!phone) return '';
    // Remove all non-digit characters, but keep a leading '+'
    let cleaned = phone.trim().replace(/[^\d+]/g, '');

    // Case 1: Starts with +94 and is a valid length (e.g., +94769259694)
    if (cleaned.startsWith('+94') && cleaned.length === 12) {
        return '0' + cleaned.substring(3);
    }
    // Case 2: Starts with 94 and is a valid length (e.g., 94769259694)
    if (cleaned.startsWith('94') && cleaned.length === 11) {
        return '0' + cleaned.substring(2);
    }
    // Case 3: Is a 9-digit number, assume it's a mobile number missing the leading 0
    if (cleaned.length === 9 && !cleaned.startsWith('0')) {
        return '0' + cleaned;
    }
    // Otherwise, return the number as is (or after basic cleaning)
    return cleaned.replace('+', ''); // Remove plus if it's not a +94 number
}


// --- UI Components ---

// 1. CSV Upload Component
function CSVUpload({
  onUploadComplete,
  setIsLoading,
}: {
  onUploadComplete: (leads: LeadData[]) => void;
  setIsLoading: (loading: boolean) => void;
}) {
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    parse<LeadData>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: header => header.toLowerCase().trim().replace(/\s+/g, '_'),
      complete: (results) => {
        try {
          const validatedLeads = z.array(LeadSchema).parse(results.data);
          
          // --- NEW: Normalize phone numbers after parsing ---
          const normalizedLeads = validatedLeads.map(lead => ({
              ...lead,
              phone: normalizePhoneNumber(lead.phone),
          }));

          onUploadComplete(normalizedLeads);

        } catch (err) {
          if (err instanceof z.ZodError) {
            setError(`CSV validation failed: ${err.errors.map(e => `(Row: ${e.path[0]}, Field: ${e.path[1]}, Message: ${e.message})`).join(', ')}`);
          } else {
            setError('An unexpected error occurred during parsing.');
          }
          setIsLoading(false);
        }
      },
      error: (err) => {
        setError(err.message);
        setIsLoading(false);
      },
    });
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="flex flex-col items-center justify-center w-full">
        <label
          htmlFor="dropzone-file"
          className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-800/50 hover:bg-gray-700/50"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
            </svg>
            <p className="mb-2 text-sm text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
            <p className="text-xs text-gray-500">CSV file (MAX. 5MB)</p>
          </div>
          <input id="dropzone-file" type="file" className="hidden" accept=".csv" onChange={handleFileChange} />
        </label>
      </div>
      {error && <p className="mt-4 text-center text-red-400">{error}</p>}
    </div>
  );
}

// 2. Lead Preview Component
function LeadPreview({
  preview,
  onConfirm,
  onCancel,
  isImporting,
}: {
  preview: PreviewItem[];
  onConfirm: (leadsToImport: LeadData[]) => void;
  onCancel: () => void;
  isImporting: boolean;
}) {
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());

  useEffect(() => {
    const initialSelection = new Set<string>();
    preview.forEach(item => {
      if (item.status === 'OK_TO_IMPORT' || item.status === 'LOW_STOCK') {
        initialSelection.add(item.id);
      }
    });
    setSelectedLeads(initialSelection);
  }, [preview]);

  const handleSelectionChange = (itemId: string) => {
    setSelectedLeads(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(itemId)) {
        newSelection.delete(itemId);
      } else {
        newSelection.add(itemId);
      }
      return newSelection;
    });
  };

  const statusConfig: Record<PreviewStatus, { text: string; bg: string; label: string }> = {
    OK_TO_IMPORT: { text: 'text-green-300', bg: 'bg-green-500/10', label: 'OK to Import' },
    LOW_STOCK: { text: 'text-orange-300', bg: 'bg-orange-500/10', label: 'Low Stock' },
    OUT_OF_STOCK: { text: 'text-red-300', bg: 'bg-red-500/10', label: 'Out of Stock' },
    INVALID_PRODUCT: { text: 'text-gray-400', bg: 'bg-gray-500/10', label: 'Invalid Product' },
  };
  
  const summary = useMemo(() => {
    return preview.reduce((acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
    }, {} as Record<PreviewStatus, number>);
  }, [preview]);

  const leadsToImport = preview.filter(item => selectedLeads.has(item.id)).map(item => item.data);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-white">Import Preview</h3>
        <p className="mt-1 text-sm text-gray-400">Review and confirm the leads to import. Leads for out-of-stock or invalid products will be skipped.</p>
      </div>
      
      <div className="flex flex-wrap gap-4">
        {Object.entries(summary).map(([status, count]) => (
            <div key={status} className={`px-3 py-1.5 rounded-full text-sm font-medium ${statusConfig[status as PreviewStatus].bg} ${statusConfig[status as PreviewStatus].text}`}>
                {statusConfig[status as PreviewStatus].label}: {count}
            </div>
        ))}
      </div>

      <div className="max-h-[50vh] overflow-y-auto rounded-lg border border-gray-700">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-800 sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400 w-12">Import</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Customer</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Product</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800 bg-gray-900">
            {preview.map((item) => (
              <tr key={item.id} className={statusConfig[item.status].bg}>
                <td className="px-4 py-4">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                    checked={selectedLeads.has(item.id)}
                    disabled={item.status === 'OUT_OF_STOCK' || item.status === 'INVALID_PRODUCT'}
                    onChange={() => handleSelectionChange(item.id)}
                  />
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                    <div>{item.data.customer_name}</div>
                    <div className="text-xs text-gray-500">{item.data.phone}</div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{item.data.product_name} ({item.data.product_code})</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold">
                    <span className={statusConfig[item.status].text}>{statusConfig[item.status].label}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end space-x-4 pt-4">
        <button type="button" onClick={onCancel} disabled={isImporting} className="rounded-md bg-gray-700 px-4 py-2 text-sm font-medium text-white hover:bg-gray-600">
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onConfirm(leadsToImport)}
          disabled={isImporting || leadsToImport.length === 0}
          className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isImporting ? 'Importing...' : `Confirm Import (${leadsToImport.length})`}
        </button>
      </div>
    </div>
  );
}


// --- Main Page Component ---
export default function ImportLeadsPage() {
  const [stage, setStage] = useState<'upload' | 'preview' | 'complete'>('upload');
  const [isLoading, setIsLoading] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewItem[]>([]);
  const [importResult, setImportResult] = useState<{ count: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleUploadComplete = async (leads: LeadData[]) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/leads/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'preview', leads }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to get preview');
      
      const previewWithIds = result.preview.map((item: Omit<PreviewItem, 'id'>, index: number) => ({
        ...item,
        // The phone number in item.data is already normalized by the backend, but we ensure it's used for the key
        id: `${item.data.phone}-${item.data.product_code}-${index}`,
      }));

      setPreviewData(previewWithIds);
      setStage('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmImport = async (leadsToImport: LeadData[]) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/leads/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'import', leads: leadsToImport }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to import leads');
      
      setImportResult(result);
      setStage('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setStage('upload');
    setPreviewData([]);
    setImportResult(null);
    setError(null);
  };

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 bg-gray-900 text-white min-h-screen">
      <div className="px-4 py-6 sm:px-0">
        <div className="border-b border-gray-700 pb-5 flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-semibold leading-6 text-white">Import Leads</h3>
            <p className="mt-2 max-w-4xl text-sm text-gray-400">
              {stage === 'upload' && 'Upload a CSV file to begin the import process.'}
              {stage === 'preview' && 'Review and select the leads to import.'}
              {stage === 'complete' && 'The import process has finished.'}
            </p>
          </div>
          <a href="/templates/lead-import-template.csv" download className="inline-flex items-center px-4 py-2 border border-gray-600 rounded-md text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700">
            Download Template
          </a>
        </div>

        <div className="mt-10">
          <AnimatePresence mode="wait">
            {stage === 'upload' && (
              <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {isLoading ? <div className="text-center">Analyzing file...</div> : <CSVUpload onUploadComplete={handleUploadComplete} setIsLoading={setIsLoading} />}
              </motion.div>
            )}

            {stage === 'preview' && (
              <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <LeadPreview preview={previewData} onConfirm={handleConfirmImport} onCancel={handleReset} isImporting={isLoading} />
              </motion.div>
            )}

            {stage === 'complete' && (
              <motion.div key="complete" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                <div className="p-8 rounded-lg bg-gray-800 ring-1 ring-white/10 max-w-md mx-auto">
                    <h4 className="text-xl font-bold text-green-400">Import Complete!</h4>
                    <p className="mt-2 text-gray-300">Successfully imported {importResult?.count || 0} leads.</p>
                    <button onClick={() => router.push('/leads')} className="mt-6 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                        Go to Leads Page
                    </button>
                    <button onClick={handleReset} className="mt-4 text-sm text-gray-400 hover:text-white">
                        Import another file
                    </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {error && stage !== 'preview' && <p className="mt-4 text-center text-red-400">{error}</p>}
        </div>
      </div>
    </div>
  );
}
