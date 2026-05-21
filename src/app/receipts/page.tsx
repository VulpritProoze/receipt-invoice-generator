'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Container from '@/components/Container';
import Table, { type TableColumn } from '@/components/ui/Table';
import { useAuth } from '@/providers/auth-provider';
import type { Receipt } from '@/schemas';

export default function ReceiptsPage() {
  const _router = useRouter();
  const { user } = useAuth();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReceipts() {
      if (!user) return;

      try {
        const response = await fetch('/api/receipts');
        if (!response.ok) {
          throw new Error('Failed to fetch receipts');
        }
        const data = await response.json();
        setReceipts(data.receipts || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchReceipts();
  }, [user]);

  const columns: TableColumn[] = [
    { key: 'receiptID', label: 'Receipt ID' },
    { key: 'date', label: 'Date' },
    { key: 'invoiceID', label: 'Invoice ID' },
    { key: 'total', label: 'Total', align: 'right' }
  ];

  // Transform data for table display
  const tableData = receipts.map((receipt) => ({
    receiptID: receipt.receiptID,
    date: receipt.date,
    invoiceID: receipt.invoiceID,
    total: `$${receipt.total.toFixed(2)}`
  }));

  if (loading) {
    return (
      <Container>
        <div className="text-center py-12">
          <p className="text-gray-500">Loading receipts...</p>
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Receipts</h1>
      </div>

      <Table
        columns={columns}
        data={tableData}
        onRowClick={(row) => {
          // Navigate to receipt detail or download PDF
          window.open(`/api/reports/receipt/${row.receiptID}`, '_blank');
        }}
        emptyMessage="No receipts found."
      />
    </Container>
  );
}

// Made with Bob
