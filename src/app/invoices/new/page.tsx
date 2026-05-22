'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Container from '@/components/Container';
import Button from '@/components/Button';
import { useAuth } from '@/providers/auth-provider';
import type { InvoiceItem } from '@/models/invoice';

export default function NewInvoicePage() {
  const router = useRouter();
  const { user } = useAuth();
  
  // Form state
  const [billTo, setBillTo] = useState('');
  const [billToAddressLine, setBillToAddressLine] = useState('');
  const [billToCityAddress, setBillToCityAddress] = useState('');
  const [billToPostalAddress, setBillToPostalAddress] = useState('');
  const [billToCountry, setBillToCountry] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [currency, setCurrency] = useState<'PHP' | 'USD'>('PHP');
  const [taxRate, setTaxRate] = useState('12');
  const [terms, setTerms] = useState('Due Upon Receipt');
  
  // Invoice items state
  const [availableItems, setAvailableItems] = useState<InvoiceItem[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  
  // Date range filter
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available invoice items
  useEffect(() => {
    async function fetchItems() {
      if (!user) return;
      
      try {
        const response = await fetch(`/api/invoices/items?userID=${user.id}`);
        if (!response.ok) throw new Error('Failed to fetch items');
        
        const data = await response.json();
        setAvailableItems(data.items || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load items');
      } finally {
        setLoading(false);
      }
    }
    
    fetchItems();
  }, [user]);

  // Filter items by date range
  const filteredItems = availableItems.filter((item) => {
    if (!startDate && !endDate) return true;
    const itemDate = new Date(item.date);
    if (startDate && itemDate < new Date(startDate)) return false;
    if (endDate && itemDate > new Date(endDate)) return false;
    return true;
  });

  // Calculate subtotal for selected items
  const selectedItems = filteredItems.filter((item) => selectedItemIds.has(item.itemID));
  const subtotal = selectedItems.reduce((sum, item) => sum + item.quantity * item.rate, 0);
  const tax = subtotal * (parseFloat(taxRate) / 100);
  const total = subtotal + tax;

  // Handle checkbox click with Shift+Click range selection
  const handleItemSelect = (itemId: string, index: number, event: React.MouseEvent) => {
    const newSelected = new Set(selectedItemIds);
    
    if (event.shiftKey && lastSelectedIndex !== null) {
      // Range selection
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);
      
      for (let i = start; i <= end; i++) {
        newSelected.add(filteredItems[i].itemID);
      }
    } else {
      // Single selection toggle
      if (newSelected.has(itemId)) {
        newSelected.delete(itemId);
      } else {
        newSelected.add(itemId);
      }
    }
    
    setSelectedItemIds(newSelected);
    setLastSelectedIndex(index);
  };

  // Select/deselect all
  const handleSelectAll = () => {
    if (selectedItemIds.size === filteredItems.length) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(filteredItems.map((item) => item.itemID)));
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || selectedItems.length === 0) return;
    
    setSubmitting(true);
    setError(null);
    
    try {
      const invoiceData = {
        userID: user.id,
        invoiceDate: new Date().toISOString().split('T')[0],
        terms,
        dueDate,
        currency,
        billTo,
        billToAddressLine,
        billToCityAddress,
        billToPostalAddress,
        billToCountry,
        invoiceItems: selectedItems,
        taxRate: parseFloat(taxRate) / 100
      };
      
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceData)
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

  return (
    <Container>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Create Invoice</h1>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Bill To Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Bill To</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={billTo}
                onChange={(e) => setBillTo(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address Line <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={billToAddressLine}
                onChange={(e) => setBillToAddressLine(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={billToCityAddress}
                onChange={(e) => setBillToCityAddress(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Postal Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={billToPostalAddress}
                onChange={(e) => setBillToPostalAddress(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={billToCountry}
                onChange={(e) => setBillToCountry(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
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

        {/* Items Selection Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Select Items</h2>
            <Button type="button" variant="secondary" onClick={handleSelectAll}>
              {selectedItemIds.size === filteredItems.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>

          {/* Date Range Filter */}
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Filter by Date Range</h3>
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

          {/* Items Table */}
          {filteredItems.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No items available. Import billing history to get started.
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
                        Description
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
                    {filteredItems.map((item, index) => {
                      const amount = item.quantity * item.rate;
                      const isSelected = selectedItemIds.has(item.itemID);
                      
                      return (
                        <tr
                          key={item.itemID}
                          className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onClick={(e) => handleItemSelect(item.itemID, index, e)}
                              readOnly
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                            />
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.date}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.description}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">{item.quantity}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">
                            {currency === 'PHP' ? '₱' : '$'}{item.rate.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                            {currency === 'PHP' ? '₱' : '$'}{amount.toFixed(2)}
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
                  <span className="text-gray-600">Selected Items:</span>
                  <span className="font-medium">{selectedItems.length}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">
                    {currency === 'PHP' ? '₱' : '$'}{subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Tax ({taxRate}%):</span>
                  <span className="font-medium">
                    {currency === 'PHP' ? '₱' : '$'}{tax.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-2 mt-2">
                  <span>Total:</span>
                  <span>
                    {currency === 'PHP' ? '₱' : '$'}{total.toFixed(2)}
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
            onClick={() => router.back()}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting || selectedItems.length === 0}
            className={selectedItems.length === 0 ? 'bg-gray-400 cursor-not-allowed' : ''}
          >
            {submitting ? 'Creating...' : 'Create Invoice'}
          </Button>
        </div>
      </form>
    </Container>
  );
}

// Made with Bob
