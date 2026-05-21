import React from 'react';

export default function Footer(): JSX.Element {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 text-sm text-gray-600">
        © {year} BillGen
      </div>
    </footer>
  );
}
