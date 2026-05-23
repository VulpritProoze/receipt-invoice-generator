'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Container from '@/components/Container';
import Button from '@/components/Button';
import { useAuth } from '@/providers/auth-provider';

interface UnmatchedItem {
  description: string;
  rate: number;
}

export default function BillingUserImportPage() {
  const router = useRouter();
  const params = useParams();
  const billingUserID = params.id as string;
  const { user } = useAuth();

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{
    imported: number;
    skipped: number;
    errors: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [unmatchedItems, setUnmatchedItems] = useState<UnmatchedItem[]>([]);
  const [creatingItems, setCreatingItems] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ];

      if (
        !validTypes.includes(selectedFile.type) &&
        !selectedFile.name.endsWith('.csv') &&
        !selectedFile.name.endsWith('.xlsx')
      ) {
        setError('Invalid file type. Please upload a CSV or XLSX file.');
        setFile(null);
        return;
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024;
      if (selectedFile.size > maxSize) {
        setError('File too large. Maximum size is 5MB.');
        setFile(null);
        return;
      }

      setFile(selectedFile);
      setError(null);
      setResult(null);
      setUnmatchedItems([]);
    }
  };

  const handleUpload = async () => {
    if (!file || !user) return;

    setUploading(true);
    setError(null);
    setResult(null);
    setUnmatchedItems([]);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('billingUserID', billingUserID);

      const response = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      // Check for unmatched items
      if (data.unmatched && data.unmatched.length > 0) {
        setUnmatchedItems(data.unmatched);
        return;
      }

      // Success
      setResult({
        imported: data.imported,
        skipped: data.skipped,
        errors: data.errors || [],
      });

      // Clear file input after successful upload
      setFile(null);
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleCreateItemsAndRetry = async () => {
    if (unmatchedItems.length === 0 || !file) return;

    setCreatingItems(true);
    setError(null);

    try {
      // Create missing invoice items
      const createResponse = await fetch('/api/import/create-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: unmatchedItems.map((item) => ({
            description: item.description,
            defaultRate: item.rate,
          })),
        }),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(errorData.message || 'Failed to create invoice items');
      }

      // Retry import
      setUnmatchedItems([]);
      await handleUpload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create items');
    } finally {
      setCreatingItems(false);
    }
  };

  return (
    <Container>
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Import Billing History</h1>
          <p className="mt-2 text-gray-600">
            Upload a CSV or XLSX file containing billing history for this client.
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push(`/billing-users/${billingUserID}`)}>
          Back to Client
        </Button>
      </div>

      {/* Instructions Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-3">File Format Requirements</h2>
        <div className="text-sm text-blue-800 space-y-2">
          <p>Your file must contain the following columns:</p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>
              <strong>Description</strong> — Item description (must match existing catalog items)
            </li>
            <li>
              <strong>Quantity</strong> — Quantity as a whole number (required)
            </li>
            <li>
              <strong>Rate</strong> — Rate per unit as a decimal (required)
            </li>
            <li>
              <strong>Date</strong> — Date in YYYY-MM-DD format (required)
            </li>
          </ul>
          <p className="mt-3">
            <strong>Supported formats:</strong> CSV (.csv) and Excel (.xlsx)
          </p>
          <p>
            <strong>Maximum file size:</strong> 5MB
          </p>
        </div>
      </div>

      {/* Unmatched Items Dialog */}
      {unmatchedItems.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-yellow-900 mb-3">
            Unmatched Items Found
          </h2>
          <p className="text-sm text-yellow-800 mb-4">
            The following items don't exist in your catalog. Would you like to create them?
          </p>
          <div className="bg-white rounded border border-yellow-300 p-4 mb-4 max-h-60 overflow-y-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Description</th>
                  <th className="px-4 py-2 text-right">Default Rate</th>
                </tr>
              </thead>
              <tbody>
                {unmatchedItems.map((item, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="px-4 py-2">{item.description}</td>
                    <td className="px-4 py-2 text-right">₱{item.rate.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCreateItemsAndRetry} disabled={creatingItems}>
              {creatingItems ? 'Creating Items...' : 'Create Items and Import'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setUnmatchedItems([]);
                setFile(null);
                const fileInput = document.getElementById('file-input') as HTMLInputElement;
                if (fileInput) fileInput.value = '';
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Upload Card */}
      {unmatchedItems.length === 0 && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload File</h2>

          <div className="space-y-4">
            {/* File Input */}
            <div>
              <label
                htmlFor="file-input"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Select File
              </label>
              <input
                id="file-input"
                type="file"
                accept=".csv,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                onChange={handleFileChange}
                disabled={uploading}
                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-md cursor-pointer bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-l-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {file && (
                <p className="mt-2 text-sm text-gray-600">
                  Selected: <span className="font-medium">{file.name}</span> (
                  {(file.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            {/* Upload Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleUpload}
                disabled={!file || uploading}
                className={!file || uploading ? 'bg-gray-400 cursor-not-allowed' : ''}
              >
                {uploading ? 'Uploading...' : 'Upload and Import'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Upload Error</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Success Result Display */}
      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-6 w-6 text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-lg font-semibold text-green-900 mb-2">Import Complete</h3>
              <div className="space-y-2 text-sm text-green-800">
                <p>
                  <strong>Successfully imported:</strong> {result.imported} items
                </p>
                {result.skipped > 0 && (
                  <p>
                    <strong>Skipped:</strong> {result.skipped} items
                  </p>
                )}

                {result.errors.length > 0 && (
                  <div className="mt-4">
                    <p className="font-semibold mb-2">Errors encountered:</p>
                    <ul className="list-disc list-inside space-y-1 text-red-700 bg-red-50 p-3 rounded border border-red-200 max-h-40 overflow-y-auto">
                      {result.errors.slice(0, 10).map((err, idx) => (
                        <li key={idx} className="text-xs">
                          {err}
                        </li>
                      ))}
                      {result.errors.length > 10 && (
                        <li className="text-xs italic">
                          ... and {result.errors.length - 10} more errors
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>

              <div className="mt-4 flex space-x-3">
                <Button onClick={() => router.push(`/billing-users/${billingUserID}`)}>
                  Back to Client
                </Button>
                <Button variant="secondary" onClick={() => setResult(null)}>
                  Import Another File
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sample File Link */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Need a sample file?</h3>
        <p className="text-sm text-gray-600 mb-3">
          Download a sample CSV file to see the correct format:
        </p>
        <a
          href="/api/import/sample"
          download="sample-billing-history.csv"
          className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Download Sample CSV
        </a>
      </div>
    </Container>
  );
}

// Made with Bob
