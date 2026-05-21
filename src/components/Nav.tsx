'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="bg-white border-b" role="navigation" aria-label="Main navigation">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-lg font-semibold">
              BillGen
            </Link>
            <div className="hidden md:flex md:space-x-4">
              <Link href="/dashboard" className="text-sm hover:underline">
                Dashboard
              </Link>
              <Link href="/invoices" className="text-sm hover:underline">
                Invoices
              </Link>
              <Link href="/receipts" className="text-sm hover:underline">
                Receipts
              </Link>
              <Link href="/users" className="text-sm hover:underline">
                Users
              </Link>
              <Link href="/import" className="text-sm hover:underline">
                Import
              </Link>
              <Link href="/onboarding" className="text-sm hover:underline">
                Onboarding
              </Link>
            </div>
          </div>

          <div className="flex items-center md:hidden">
            <button
              type="button"
              aria-label={open ? 'Close menu' : 'Open menu'}
              onClick={() => setOpen((v) => !v)}
              className="inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-100"
            >
              <span>{open ? '✕' : '☰'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t">
          <div className="space-y-1 px-2 pt-2 pb-3">
            <Link href="/dashboard" className="block px-3 py-2 text-base">
              Dashboard
            </Link>
            <Link href="/invoices" className="block px-3 py-2 text-base">
              Invoices
            </Link>
            <Link href="/receipts" className="block px-3 py-2 text-base">
              Receipts
            </Link>
            <Link href="/users" className="block px-3 py-2 text-base">
              Users
            </Link>
            <Link href="/import" className="block px-3 py-2 text-base">
              Import
            </Link>
            <Link href="/onboarding" className="block px-3 py-2 text-base">
              Onboarding
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
