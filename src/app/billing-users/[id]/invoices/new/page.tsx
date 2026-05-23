'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Container from '@/components/Container';
import Button from '@/components/Button';
import { useAuth } from '@/providers/auth-provider';
import type { BillingUser } from '@/models/billingUser';
import type { BillingHistory } from '@/models/billingHistory';

export default function NewBillingUserInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const billingUserID = params.id as string;
  const { user } = useAuth();

  // Billing user data
  const [billingUser, setBillingUser] = useState<BillingUser | null>(null);

  // Form state
  const [dueDate, setDueDate] = useState('');
  const [currency, setCurrency] = useState<'PHP' | 'USD'>('PHP');
  const [taxRate, setTaxRate] = useState('12');
  const [terms, setTerms] = useState('Due Upon Receipt');

  // Billing history state
  const [billingHistory, setBillingHistory] = useState<BillingHistory[]>([]);
  const [selectedHistoryIds, setSelectedHistoryIds] = useState<Set<string>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);

  // Date range filter
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // UI state
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch billing user and their unbilled history
  useEffect(() => {
    async function fetchData() {
      if (!user) return;

      try {
        // Fetch billing user
        const userResponse = await fetch(`/api/billing-users/${billingUserID}`);
        if (!userResponse.ok) throw new Error('Failed to fetch billing user');
        const userData = await userResponse.json();
        setBillingUser(userData.billingUser);

        // Fetch unbilled history
        const historyResponse = await fetch(
          `/api/billing-users/${billingUserID}/history?billedStatus=unbilled`
        );
        if (!historyResponse.ok) throw new Error('Failed to fetch billing history');
        const historyData = await historyResponse.json();
        setBillingHistory(historyData.billingHistory || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [billingUserID, user]);

  // Filter history by date range
  const filteredHistory = billingHistory.filter((entry) => {
    if (!startDate && !endDate) return true;
    const entryDate = new Date(entry.date);
    if (startDate && entryDate < new Date(startDate)) return false;
    if (endDate && entryDate > new Date(endDate)) return false;
    return true;
  });

  // Calculate subtotal for selected entries
  const selectedEntries = filteredHistory.filter((entry) =>
    selectedHistoryIds.has(entry.billingHistoryID)
  );
  const subtotal = selectedEntries.reduce(
    (sum, entry) => sum + entry.quantity * entry.rate,
    0
  );
  const tax = subtotal * (parseFloat(taxRate) / 100);
  const total = subtotal + tax;

  // Handle checkbox click with Shift+Click range selection
  const handleHistorySelect = (
    historyId: string,
    index: number,
    event: React.MouseEvent
  ) => {
    const newSelected = new Set(selectedHistoryIds);

    if (event.shiftKey && lastSelectedIndex !== null) {
      // Range selection
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);

      for (let i = start; i <= end; i++) {
        newSelected.add(filteredHistory[i].billingHistoryID);
      }
    } else {
      // Single selection toggle
      if (newSelected.has(historyId)) {
        newSelected.delete(historyId);
      } else {
        newSelected.add(historyId);
      }
    }

    setSelectedHistoryIds(newSelected);
    setLastSelectedIndex(index);
  };

  // Select/deselect all
  const handleSelectAll = () => {
    if (selectedHistoryIds.size === filteredHistory.length) {
      setSelectedHistoryIds(new Set());
    } else {
      setSelectedHistoryIds(
        new Set(filteredHistory.map((entry) => entry.billingHistoryID))
      );
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !billingUser || selectedEntries.length === 0) return;

    setSubmitting(true);
    setError(null);

    try {
      const invoiceData = {
        invoiceDate: new Date().toISOString().split('T')[0],
        terms,
        dueDate,
        currency,
        billingUserID: billingUser.billingUserID,
        billingHistoryIDs: Array.from(selectedHistoryIds),
        taxRate: parseFloat(taxRate) / 100,
      };

      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create invoice');
      }

      const result = await response.json();
      router.push(`/invoices/${result.invoiceID}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create invoice');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <div className="text-center py-12">
          <p className="text-gray-500">Loading...</p>
        </div>
      </Container>
    );
  }

  if (error && !billingUser) {
    return (
      <Container>
        <div className="text-center py-12">
          <p className="text-red-500">Error: {error}</p>
          <Button onClick={() => router.push(`/billing-users/${billingUserID}`)}>
            Back to Client
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Invoice</h1>
          <p className="mt-2 text-gray-600">
            For: <span className="font-medium">{billingUser?.name}</span>
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push(`/billing-users/${billingUserID}`)}
        >
          Back to Client
        </Button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Client Info (Read-only) */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Bill To</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="font-medium text-gray-900">{billingUser?.name}</p>
            <p className="text-gray-600">{billingUser?.addressLine}</p>
            <p className="text-gray-600">
              {billingUser?.cityAddress}, {billingUser?.postalAddress}
            </p>
            <p className="text-gray-600">{billingUser?.country}</p>
          </div>
        </div>

        {/* Invoice Details Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Invoice Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Currency <span className="text-red-500">*</span>
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as 'PHP' | 'USD')}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="PHP">PHP (₱)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tax Rate (%) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                max="100"
                step="0.01"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Terms <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Billing History Selection Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Select Billing History
            </h2>
            <Button type="button" variant="secondary" onClick={handleSelectAll}>
              {selectedHistoryIds.size === filteredHistory.length
                ? 'Deselect All'
                : 'Select All'}
            </Button>
          </div>

          {/* Date Range Filter */}
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Filter by Date Range
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Billing History Table */}
          {filteredHistory.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No unbilled history available. Import billing history to get started.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Select
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Qty
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rate
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredHistory.map((entry, index) => {
                      const amount = entry.quantity * entry.rate;
                      const isSelected = selectedHistoryIds.has(entry.billingHistoryID);

                      return (
                        <tr
                          key={entry.billingHistoryID}
                          className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onClick={(e) =>
                                handleHistorySelect(entry.billingHistoryID, index, e)
                              }
                              readOnly
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                            />
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{entry.date}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {entry.invoiceItemID}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">
                            {entry.quantity}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">
                            {currency === 'PHP' ? '₱' : '$'}
                            {entry.rate.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                            {currency === 'PHP' ? '₱' : '$'}
                            {amount.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Summary */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Selected Entries:</span>
                  <span className="font-medium">{selectedEntries.length}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">
                    {currency === 'PHP' ? '₱' : '$'}
                    {subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Tax ({taxRate}%):</span>
                  <span className="font-medium">
                    {currency === 'PHP' ? '₱' : '$'}
                    {tax.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-2 mt-2">
                  <span>Total:</span>
                  <span>
                    {currency === 'PHP' ? '₱' : '$'}
                    {total.toFixed(2)}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push(`/billing-users/${billingUserID}`)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting || selectedEntries.length === 0}
            className={
              selectedEntries.length === 0 ? 'bg-gray-400 cursor-not-allowed' : ''
            }
          >
            {submitting ? 'Creating...' : 'Create Invoice'}
          </Button>
        </div>
      </form>
    </Container>
  );
}

// Made with Bob
