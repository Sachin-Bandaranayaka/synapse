'use client';

import { CSVUpload } from '@/components/leads/csv-upload';
import { LeadPreview } from '@/components/leads/lead-preview';
import { type ParseResult, type LeadData } from '@/lib/csv-parser';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ImportLeadsPage() {
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const router = useRouter();

  const handleUploadComplete = (result: ParseResult) => {
    setParseResult(result);
  };

  const handleConfirmImport = async (leads: LeadData[]) => {
    const response = await fetch('/api/leads/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(leads),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to import leads');
    }

    router.push('/leads');
    router.refresh();
  };

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="border-b border-gray-200 pb-5">
          <h3 className="text-2xl font-semibold leading-6 text-gray-900">
            Import Leads
          </h3>
          <p className="mt-2 max-w-4xl text-sm text-gray-500">
            Upload a CSV file containing lead information. The file should include
            columns for customer name, phone, address, and product code.
          </p>
        </div>

        <div className="mt-6">
          {!parseResult ? (
            <CSVUpload onUploadComplete={handleUploadComplete} />
          ) : (
            <LeadPreview
              parseResult={parseResult}
              onConfirm={handleConfirmImport}
            />
          )}
        </div>
      </div>
    </div>
  );
}
