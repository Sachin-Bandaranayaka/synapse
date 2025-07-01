'use client';

import { useState } from 'react';
import { parseCSV, type ParseResult } from '@/lib/csv-parser';

interface CSVUploadProps {
  onUploadComplete: (result: ParseResult) => void;
}

export function CSVUpload({ onUploadComplete }: CSVUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFile = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const result = await parseCSV(file);
      onUploadComplete(result);
    } catch (err) {
      setError('Failed to process CSV file');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <a
          href="/templates/lead-import-template.csv"
          download
          className="text-sm text-indigo-600 hover:text-indigo-500"
        >
          Download Template
        </a>
      </div>
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center ${
          isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="space-y-4">
          <div className="flex justify-center">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          <div className="text-gray-600">
            {isProcessing ? (
              'Processing...'
            ) : (
              <>
                <p className="font-medium">Drag and drop your CSV file here</p>
                <p className="text-sm">or</p>
                <label className="cursor-pointer text-indigo-600 hover:text-indigo-500">
                  Click to upload
                  <input
                    type="file"
                    className="hidden"
                    accept=".csv"
                    onChange={handleFileInput}
                  />
                </label>
              </>
            )}
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
      </div>
    </div>
  );
}
