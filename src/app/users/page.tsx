'use client';

import Container from '@/components/Container';
import { useAuth } from '@/providers/auth-provider';

export default function UsersPage() {
  const { user } = useAuth();

  return (
    <Container>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Coming Soon
          </h2>
          <p className="text-gray-600 mb-6">
            User management features will be available in a future release.
          </p>
          
          {user && (
            <div className="mt-8 p-4 bg-gray-50 rounded-lg inline-block">
              <h3 className="font-semibold mb-2">Current User:</h3>
              <p className="text-sm text-gray-600">ID: {user.id}</p>
              <p className="text-sm text-gray-600">Name: {user.name}</p>
              <p className="text-sm text-gray-600">Email: {user.email}</p>
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}

// Made with Bob
