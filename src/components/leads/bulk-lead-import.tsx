'use client';

import { useState } from 'react';

export function BulkLeadImport({ onSuccess }: { onSuccess: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/leads/import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to import leads');
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while importing leads');
    } finally {
      setIsLoading(false);
      // Reset the file input
      event.target.value = '';
    }
  };

  return (
    <div className="space-x-4">
      <label
        htmlFor="file-upload"
        className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
          isLoading ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'
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
        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Download Template
      </a>
      {error && (
        <div className="mt-2 text-sm text-red-600">{error}</div>
      )}
    </div>
  );
}
