'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Container from '@/components/Container';
import Button from '@/components/Button';
import Table, { type TableColumn } from '@/components/ui/Table';
import { useAuth } from '@/providers/auth-provider';
import type { Invoice } from '@/schemas';

export default function InvoicesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInvoices() {
      if (!user) return;

      try {
        const response = await fetch(`/api/invoices?userID=${user.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch invoices');
        }
        const data = await response.json();
        setInvoices(data.invoices || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchInvoices();
  }, [user]);

  const columns: TableColumn[] = [
    { key: 'invoiceID', label: 'Invoice ID' },
    { key: 'invoiceDate', label: 'Date' },
    { key: 'billingUserID', label: 'Billing User' },
    { key: 'currency', label: 'Currency', align: 'center' },
    { key: 'dueDate', label: 'Due Date' }
  ];

  // Transform data for table display
  const tableData = invoices.map((invoice) => ({
    invoiceID: invoice.invoiceID,
    invoiceDate: invoice.invoiceDate,
    billingUserID: invoice.billingUserID,
    currency: invoice.currency,
    dueDate: invoice.dueDate
  }));

  const handleExport = (format: 'csv' | 'xlsx' | 'pdf') => {
    if (!user) return;
    window.location.href = `/api/reports/generate?type=invoice&userID=${user.id}&format=${format}`;
  };

  if (loading) {
    return (
      <Container>
        <div className="text-center py-12">
          <p className="text-gray-500">Loading invoices...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <div className="text-center py-12">
          <p className="text-red-500">Error: {error}</p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => handleExport('csv')}>
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => handleExport('xlsx')}>
            Export XLSX
          </Button>
          <Button variant="outline" onClick={() => handleExport('pdf')}>
            Export PDF
          </Button>
          <Button onClick={() => router.push('/invoices/new')}>
            Create Invoice
          </Button>
        </div>
      </div>

      <Table
        columns={columns}
        data={tableData}
        onRowClick={(row) => router.push(`/invoices/${row.invoiceID}`)}
        emptyMessage="No invoices found. Create your first invoice to get started."
      />
    </Container>
  );
}

// Made with Bob
