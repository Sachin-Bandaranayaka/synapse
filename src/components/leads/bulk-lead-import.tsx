'use client';

import { useState } from 'react';
import Head from 'next/head';
import { LeadCostTooltip } from '@/components/ui/tooltip';

export function BulkLeadImport({ onSuccess }: { onSuccess: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCost, setTotalCost] = useState<number>(0);
  const [leadCount, setLeadCount] = useState<number>(0);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    // Use the PapaParse library to convert the CSV file to JSON
    // The 'window as any' is used because Papa is added globally by the script tag
    (window as any).Papa.parse(file, {
      header: true, // Treat the first row as headers
      skipEmptyLines: true,
      complete: async (results: any) => {
        // This function runs after the file is successfully parsed
        try {
          setLeadCount(results.data.length);
          
          // Prepare the import payload with cost information
          const importPayload = {
            action: 'import',
            leads: results.data,
            totalCost: totalCost > 0 ? totalCost : undefined
          };

          // Now, send the parsed JSON data to the API
          const response = await fetch('/api/leads/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(importPayload), // Send the data as a JSON string
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to import leads');
          }

          onSuccess();
        } catch (err) {
          setError(err instanceof Error ? err.message : 'An error occurred while importing leads');
        } finally {
          setIsLoading(false);
          event.target.value = ''; // Reset the file input
          setTotalCost(0);
          setLeadCount(0);
        }
      },
      error: (err: any) => {
        // This runs if the CSV file itself is malformed
        setError('Failed to parse CSV file. Please check the format and try again.');
        setIsLoading(false);
      }
    });
  };

  return (
    <>
      {/* This script tag adds the PapaParse library to the page */}
      <Head>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.0/papaparse.min.js"></script>
      </Head>
      <div className="space-y-4">
        {/* Cost Input Section */}
        <div className="bg-gray-800 rounded-lg p-4 ring-1 ring-white/10">
          <div className="flex items-center space-x-2 mb-3">
            <label htmlFor="totalCost" className="text-sm font-medium text-gray-300">
              Total Lead Acquisition Cost ($)
            </label>
            <LeadCostTooltip />
          </div>
          <input
            id="totalCost"
            type="number"
            step="0.01"
            min="0"
            value={totalCost}
            onChange={(e) => setTotalCost(parseFloat(e.target.value) || 0)}
            disabled={isLoading}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Enter total amount spent on acquiring these leads"
          />
          {totalCost > 0 && leadCount > 0 && (
            <p className="mt-2 text-xs text-gray-400">
              Cost per lead: ${(totalCost / leadCount).toFixed(2)}
            </p>
          )}
        </div>

        {/* Import Controls */}
        <div className="flex flex-wrap items-center gap-4">
          <label
            htmlFor="file-upload"
            className={`inline-flex items-center px-4 py-2 border border-transparent ring-1 ring-white/10 text-sm font-medium rounded-md text-white ${
              isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer`}
          >
            {isLoading ? 'Importing...' : 'Import CSV'}
          </label>
          <input
            id="file-upload"
            name="file-upload"
            type="file"
            accept=".csv"
            className="sr-only"
            onChange={handleFileUpload}
            disabled={isLoading}
          />
          <a
            href="/templates/lead-import-template.csv"
            download
            className="inline-flex items-center px-4 py-2 border border-gray-600 ring-1 ring-white/10 text-sm font-medium rounded-md text-gray-400 bg-gray-800 hover:bg-gray-700"
          >
            Download Template
          </a>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-900/20 border border-red-700/50 rounded-lg">
            <div className="text-sm text-red-400">{error}</div>
          </div>
        )}
      </div>
    </>
  );
}
