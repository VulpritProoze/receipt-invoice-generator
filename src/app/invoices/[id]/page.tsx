'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Container from '@/components/Container';
import Button from '@/components/Button';
import type { Invoice } from '@/schemas';

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const invoiceID = params.id as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInvoice() {
      try {
        const response = await fetch(`/api/invoices/${invoiceID}`);
        if (!response.ok) {
          throw new Error('Failed to fetch invoice');
        }
        const data = await response.json();
        setInvoice(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    if (invoiceID) {
      fetchInvoice();
    }
  }, [invoiceID]);

  const handleGeneratePDF = async () => {
    try {
      const response = await fetch(`/api/reports/invoice/${invoiceID}`);
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoiceID}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to generate PDF');
    }
  };

  if (loading) {
    return (
      <Container>
        <div className="text-center py-12">
          <p className="text-gray-500">Loading invoice...</p>
        </div>
      </Container>
    );
  }

  if (error || !invoice) {
    return (
      <Container>
        <div className="text-center py-12">
          <p className="text-red-500">Error: {error || 'Invoice not found'}</p>
          <Button onClick={() => router.push('/invoices')} className="mt-4">
            Back to Invoices
          </Button>
        </div>
      </Container>
    );
  }

  // Calculate totals
  const subtotal = invoice.invoiceItems.reduce(
    (sum, item) => sum + item.quantity * item.rate,
    0
  );
  const taxAmount = subtotal * invoice.taxRate;
  const total = subtotal + taxAmount;

  return (
    <Container>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Invoice Details</h1>
        <div className="space-x-2">
          <Button onClick={handleGeneratePDF}>Generate PDF</Button>
          <Button onClick={() => router.push('/invoices')} variant="secondary">
            Back to Invoices
          </Button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6 space-y-6">
        {/* Invoice Header */}
        <div className="border-b pb-4">
          <h2 className="text-xl font-semibold">{invoice.invoiceID}</h2>
          <p className="text-gray-600">Date: {invoice.invoiceDate}</p>
          <p className="text-gray-600">Due: {invoice.dueDate}</p>
          <p className="text-gray-600">Terms: {invoice.terms}</p>
        </div>

        {/* Bill To */}
        <div>
          <h3 className="font-semibold mb-2">Bill To:</h3>
          <p>{invoice.billTo}</p>
          <p>{invoice.billToAddressLine}</p>
          <p>
            {invoice.billToCityAddress}, {invoice.billToPostalAddress}
          </p>
          <p>{invoice.billToCountry}</p>
        </div>

        {/* Line Items */}
        <div>
          <h3 className="font-semibold mb-2">Items:</h3>
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Description</th>
                <th className="px-4 py-2 text-right">Quantity</th>
                <th className="px-4 py-2 text-right">Rate</th>
                <th className="px-4 py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.invoiceItems.map((item, index) => (
                <tr key={index} className="border-t">
                  <td className="px-4 py-2">{item.description}</td>
                  <td className="px-4 py-2 text-right">{item.quantity}</td>
                  <td className="px-4 py-2 text-right">
                    {invoice.currency === 'PHP' ? '₱' : '$'}
                    {item.rate.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {invoice.currency === 'PHP' ? '₱' : '$'}
                    {(item.quantity * item.rate).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>
              {invoice.currency === 'PHP' ? '₱' : '$'}
              {subtotal.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Tax ({(invoice.taxRate * 100).toFixed(0)}%):</span>
            <span>
              {invoice.currency === 'PHP' ? '₱' : '$'}
              {taxAmount.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between font-bold text-lg">
            <span>Total:</span>
            <span>
              {invoice.currency === 'PHP' ? '₱' : '$'}
              {total.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </Container>
  );
}

// Made with Bob
