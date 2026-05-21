import React from 'react';

export type TableColumn = {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
};

export type TableProps = {
  columns: TableColumn[];
  data: Record<string, unknown>[];
  onRowClick?: (row: Record<string, unknown>) => void;
  emptyMessage?: string;
};

/**
 * Table component - Reusable data table with responsive design
 * 
 * @example
 * ```tsx
 * <Table
 *   columns={[
 *     { key: 'id', label: 'ID' },
 *     { key: 'name', label: 'Name' },
 *     { key: 'total', label: 'Total', align: 'right' }
 *   ]}
 *   data={items}
 *   onRowClick={(row) => router.push(`/items/${row.id}`)}
 *   emptyMessage="No items found"
 * />
 * ```
 */
export default function Table({
  columns,
  data,
  onRowClick,
  emptyMessage = 'No data available'
}: TableProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${
                  column.align === 'right'
                    ? 'text-right'
                    : column.align === 'center'
                      ? 'text-center'
                      : 'text-left'
                }`}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              onClick={() => onRowClick?.(row)}
              className={onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${
                    column.align === 'right'
                      ? 'text-right'
                      : column.align === 'center'
                        ? 'text-center'
                        : 'text-left'
                  }`}
                >
                  {row[column.key] as React.ReactNode}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Made with Bob
