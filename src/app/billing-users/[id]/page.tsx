'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Container from '@/components/Container';
import Button from '@/components/Button';
import Table, { type TableColumn } from '@/components/ui/Table';
import { useAuth } from '@/providers/auth-provider';
import type { BillingUser } from '@/models/billingUser';
import type { BillingHistory } from '@/models/billingHistory';
import type { Invoice } from '@/schemas';

type TabType = 'history' | 'invoices' | 'receipts';

export default function BillingUserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const billingUserID = params.id as string;
  const { user } = useAuth();

  const [billingUser, setBillingUser] = useState<BillingUser | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('history');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab-specific data
  const [billingHistory, setBillingHistory] = useState<BillingHistory[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [tabLoading, setTabLoading] = useState(false);

  // Filters for billing history
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [billedStatus, setBilledStatus] = useState<'all' | 'unbilled' | 'billed'>('all');

  useEffect(() => {
    fetchBillingUser();
  }, [billingUserID, user]);

  useEffect(() => {
    if (billingUser) {
      fetchTabData();
    }
  }, [activeTab, billingUser, startDate, endDate, billedStatus]);

  async function fetchBillingUser() {
    if (!user) return;

    try {
      const response = await fetch(`/api/billing-users/${billingUserID}`);
      if (!response.ok) {
        throw new Error('Failed to fetch billing user');
      }
      const data = await response.json();
      setBillingUser(data.billingUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  async function fetchTabData() {
    setTabLoading(true);
    try {
      if (activeTab === 'history') {
        await fetchBillingHistory();
      } else if (activeTab === 'invoices') {
        await fetchInvoices();
      } else if (activeTab === 'receipts') {
        await fetchReceipts();
      }
    } catch (err) {
      console.error('Error fetching tab data:', err);
    } finally {
      setTabLoading(false);
    }
  }

  async function fetchBillingHistory() {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (billedStatus !== 'all') params.append('billedStatus', billedStatus);

    const response = await fetch(`/api/billing-users/${billingUserID}/history?${params}`);
    if (!response.ok) throw new Error('Failed to fetch billing history');
    const data = await response.json();
    setBillingHistory(data.billingHistory || []);
  }

  async function fetchInvoices() {
    const response = await fetch(`/api/invoices?billingUserID=${billingUserID}`);
    if (!response.ok) throw new Error('Failed to fetch invoices');
    const data = await response.json();
    setInvoices(data.invoices || []);
  }

  async function fetchReceipts() {
    // Fetch all receipts and filter by billing user's invoices
    const response = await fetch('/api/receipts');
    if (!response.ok) throw new Error('Failed to fetch receipts');
    const data = await response.json();
    
    // Filter receipts that belong to this billing user's invoices
    const invoiceIDs = invoices.map(inv => inv.invoiceID);
    const filtered = (data.receipts || []).filter((receipt: any) =>
      invoiceIDs.includes(receipt.invoiceID)
    );
    setReceipts(filtered);
  }

  if (loading) {
    return (
      <Container>
        <div className="text-center py-12">
          <p className="text-gray-500">Loading client details...</p>
        </div>
      </Container>
    );
  }

  if (error || !billingUser) {
    return (
      <Container>
        <div className="text-center py-12">
          <p className="text-red-500">Error: {error || 'Client not found'}</p>
          <Button onClick={() => router.push('/billing-users')} className="mt-4">
            Back to Clients
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{billingUser.name}</h1>
            <p className="text-gray-600 mt-1">
              {billingUser.addressLine}, {billingUser.cityAddress}
            </p>
            <p className="text-gray-600">
              {billingUser.postalAddress}, {billingUser.country}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/billing-users/${billingUserID}/import`)}
            >
              Import History
            </Button>
            <Button onClick={() => router.push('/billing-users')}>
              Back to Clients
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Billing History
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'invoices'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Invoices
            </button>
            <button
              onClick={() => setActiveTab('receipts')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'receipts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Receipts
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'history' && (
          <BillingHistoryTab
            billingHistory={billingHistory}
            loading={tabLoading}
            startDate={startDate}
            endDate={endDate}
            billedStatus={billedStatus}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onBilledStatusChange={setBilledStatus}
            onGenerateInvoice={() =>
              router.push(`/billing-users/${billingUserID}/invoices/new`)
            }
          />
        )}

        {activeTab === 'invoices' && (
          <InvoicesTab
            invoices={invoices}
            loading={tabLoading}
            onViewInvoice={(invoiceID) => router.push(`/invoices/${invoiceID}`)}
          />
        )}

        {activeTab === 'receipts' && (
          <ReceiptsTab
            receipts={receipts}
            loading={tabLoading}
            onViewReceipt={(receiptID) => router.push(`/receipts/${receiptID}`)}
          />
        )}
      </div>
    </Container>
  );
}

// Billing History Tab Component
function BillingHistoryTab({
  billingHistory,
  loading,
  startDate,
  endDate,
  billedStatus,
  onStartDateChange,
  onEndDateChange,
  onBilledStatusChange,
  onGenerateInvoice,
}: {
  billingHistory: BillingHistory[];
  loading: boolean;
  startDate: string;
  endDate: string;
  billedStatus: 'all' | 'unbilled' | 'billed';
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onBilledStatusChange: (status: 'all' | 'unbilled' | 'billed') => void;
  onGenerateInvoice: () => void;
}) {
  const columns: TableColumn[] = [
    { key: 'date', label: 'Date' },
    { key: 'invoiceItemID', label: 'Item ID' },
    { key: 'quantity', label: 'Quantity', align: 'right' },
    { key: 'rate', label: 'Rate', align: 'right' },
    { key: 'amount', label: 'Amount', align: 'right' },
    { key: 'billedStatus', label: 'Status' },
  ];

  const tableData = billingHistory.map((entry) => ({
    billingHistoryID: entry.billingHistoryID,
    date: entry.date,
    invoiceItemID: entry.invoiceItemID,
    quantity: entry.quantity,
    rate: `₱${entry.rate.toFixed(2)}`,
    amount: `₱${(entry.quantity * entry.rate).toFixed(2)}`,
    billedStatus: entry.billedStatus === 'billed' ? '✓ Billed' : 'Unbilled',
  }));

  return (
    <div>
      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={billedStatus}
            onChange={(e) =>
              onBilledStatusChange(e.target.value as 'all' | 'unbilled' | 'billed')
            }
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="all">All</option>
            <option value="unbilled">Unbilled</option>
            <option value="billed">Billed</option>
          </select>
        </div>
        <Button onClick={onGenerateInvoice}>Generate Invoice</Button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading billing history...</p>
        </div>
      ) : (
        <Table
          columns={columns}
          data={tableData}
          emptyMessage="No billing history found. Import billing history to get started."
        />
      )}
    </div>
  );
}

// Invoices Tab Component
function InvoicesTab({
  invoices,
  loading,
  onViewInvoice,
}: {
  invoices: Invoice[];
  loading: boolean;
  onViewInvoice: (invoiceID: string) => void;
}) {
  const columns: TableColumn[] = [
    { key: 'invoiceID', label: 'Invoice ID' },
    { key: 'invoiceDate', label: 'Date' },
    { key: 'dueDate', label: 'Due Date' },
    { key: 'currency', label: 'Currency', align: 'center' },
  ];

  const tableData = invoices.map((invoice) => ({
    invoiceID: invoice.invoiceID,
    invoiceDate: invoice.invoiceDate,
    dueDate: invoice.dueDate,
    currency: invoice.currency,
  }));

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Loading invoices...</p>
      </div>
    );
  }

  return (
    <Table
      columns={columns}
      data={tableData}
      onRowClick={(row) => onViewInvoice(row.invoiceID as string)}
      emptyMessage="No invoices found for this client."
    />
  );
}

// Receipts Tab Component
function ReceiptsTab({
  receipts,
  loading,
  onViewReceipt,
}: {
  receipts: any[];
  loading: boolean;
  onViewReceipt: (receiptID: string) => void;
}) {
  const columns: TableColumn[] = [
    { key: 'receiptID', label: 'Receipt ID' },
    { key: 'date', label: 'Date' },
    { key: 'invoiceID', label: 'Invoice ID' },
    { key: 'total', label: 'Total', align: 'right' },
  ];

  const tableData = receipts.map((receipt) => ({
    receiptID: receipt.receiptID,
    date: receipt.date,
    invoiceID: receipt.invoiceID,
    total: `₱${receipt.total.toFixed(2)}`,
  }));

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Loading receipts...</p>
      </div>
    );
  }

  return (
    <Table
      columns={columns}
      data={tableData}
      onRowClick={(row) => onViewReceipt(row.receiptID as string)}
      emptyMessage="No receipts found for this client."
    />
  );
}

// Made with Bob