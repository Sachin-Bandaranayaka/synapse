'use client';

import { type ParseResult, type LeadData } from '@/lib/csv-parser';
import { useState } from 'react';

interface LeadPreviewProps {
  parseResult: ParseResult;
  onConfirm: (leads: LeadData[]) => Promise<void>;
}

export function LeadPreview({ parseResult, onConfirm }: LeadPreviewProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      await onConfirm(parseResult.validLeads);
    } catch (err) {
      // --- FIX: Display the specific error message from the API ---
      // Instead of a generic message, we now show the user exactly why the import failed.
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred during import.');
      }
      // We keep the console.error for debugging purposes.
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* This section for CSV parsing errors remains the same */}
      {parseResult.errors.length > 0 && (
        <div className="bg-yellow-100 p-4 rounded-md">
          <h3 className="text-yellow-800 font-medium">
            Found {parseResult.errors.length} invalid rows that will be skipped
          </h3>
          <div className="mt-2 max-h-40 overflow-y-auto">
            {parseResult.errors.map((error, index) => (
              <div key={index} className="text-sm text-yellow-700">
                <span className="font-medium">Row {error.row}:</span>{' '}
                {error.errors.join(', ')}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* The preview list of valid leads remains the same */}
      <div className="bg-gray-800 ring-1 ring-white/10 overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-700">
          {parseResult.validLeads.map((lead, index) => (
            <li key={index} className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-indigo-400 truncate">
                  {lead.customer_name}
                </div>
                <div className="ml-2 flex-shrink-0 flex">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-900/30 text-green-300">
                    Valid
                  </span>
                </div>
              </div>
              <div className="mt-2 sm:flex sm:justify-between">
                <div className="sm:flex">
                  <div className="mr-6 flex items-center text-sm text-gray-400">
                    <span className="truncate">{lead.phone}</span>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-400 sm:mt-0">
                    <span className="truncate">{lead.product_code}</span>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex justify-end items-center space-x-4">
        {/* --- FIX: This will now display the detailed error message --- */}
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          onClick={handleConfirm}
          disabled={isSubmitting || parseResult.validLeads.length === 0}
          className="inline-flex justify-center py-2 px-4 border border-transparent ring-1 ring-white/10 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isSubmitting ? 'Importing...' : `Import ${parseResult.validLeads.length} Leads`}
        </button>
      </div>
    </div>
  );
}