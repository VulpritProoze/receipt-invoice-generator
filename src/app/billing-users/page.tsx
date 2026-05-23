'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Container from '@/components/Container';
import Button from '@/components/Button';
import Table, { type TableColumn } from '@/components/ui/Table';
import { useAuth } from '@/providers/auth-provider';
import type { BillingUser } from '@/models/billingUser';

export default function BillingUsersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [billingUsers, setBillingUsers] = useState<BillingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    addressLine: '',
    cityAddress: '',
    postalAddress: '',
    country: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBillingUsers();
  }, [user]);

  async function fetchBillingUsers() {
    if (!user) return;

    try {
      const response = await fetch('/api/billing-users');
      if (!response.ok) {
        throw new Error('Failed to fetch billing users');
      }
      const data = await response.json();
      setBillingUsers(data.billingUsers || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateBillingUser(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      const response = await fetch('/api/billing-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create billing user');
      }

      // Reset form and refresh list
      setFormData({
        name: '',
        addressLine: '',
        cityAddress: '',
        postalAddress: '',
        country: '',
      });
      setShowCreateForm(false);
      await fetchBillingUsers();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteBillingUser(billingUserID: string) {
    if (!confirm('Are you sure you want to delete this billing user? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/billing-users/${billingUserID}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete billing user');
      }

      await fetchBillingUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete billing user');
    }
  }

  const columns: TableColumn[] = [
    { key: 'name', label: 'Name' },
    { key: 'addressLine', label: 'Address' },
    { key: 'cityAddress', label: 'City' },
    { key: 'country', label: 'Country' },
    { key: 'createdAt', label: 'Created' },
  ];

  // Transform data for table display
  const tableData = billingUsers.map((bu) => ({
    billingUserID: bu.billingUserID,
    name: bu.name,
    addressLine: bu.addressLine,
    cityAddress: bu.cityAddress,
    country: bu.country,
    createdAt: bu.createdAt,
  }));

  if (loading) {
    return (
      <Container>
        <div className="text-center py-12">
          <p className="text-gray-500">Loading billing users...</p>
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
        <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? 'Cancel' : 'Add Client'}
        </Button>
      </div>

      {showCreateForm && (
        <div className="mb-6 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Create New Client</h2>
          <form onSubmit={handleCreateBillingUser} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="addressLine" className="block text-sm font-medium text-gray-700 mb-1">
                Address Line *
              </label>
              <input
                type="text"
                id="addressLine"
                required
                value={formData.addressLine}
                onChange={(e) => setFormData({ ...formData, addressLine: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="cityAddress" className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  id="cityAddress"
                  required
                  value={formData.cityAddress}
                  onChange={(e) => setFormData({ ...formData, cityAddress: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="postalAddress" className="block text-sm font-medium text-gray-700 mb-1">
                  Postal/Province *
                </label>
                <input
                  type="text"
                  id="postalAddress"
                  required
                  value={formData.postalAddress}
                  onChange={(e) => setFormData({ ...formData, postalAddress: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                Country *
              </label>
              <input
                type="text"
                id="country"
                required
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {formError && (
              <div className="text-red-500 text-sm">{formError}</div>
            )}

            <div className="flex gap-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Client'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false);
                  setFormError(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      <Table
        columns={columns}
        data={tableData}
        onRowClick={(row) => router.push(`/billing-users/${row.billingUserID}`)}
        emptyMessage="No clients found. Add your first client to get started."
        actions={(row) => (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/billing-users/${row.billingUserID}`);
              }}
            >
              View
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteBillingUser(row.billingUserID as string);
              }}
            >
              Delete
            </Button>
          </div>
        )}
      />
    </Container>
  );
}

// Made with Bob