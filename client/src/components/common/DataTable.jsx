import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import Skeleton from './Skeleton';
import EmptyState from './EmptyState';

export default function DataTable({
  columns = [],
  data = [],
  keyField = '_id',
  sortBy,
  sortOrder = 'asc',
  onSort,
  density = 'comfortable', // 'compact' | 'comfortable'
  selectedRowKeys = new Set(),
  onToggleSelectRow,
  onToggleSelectAll,
  onRowClick,
  onRowHover,
  isLoading = false,
  emptyTitle = 'No data available',
  emptyMessage = 'No matching records found in this view.',
  className = '',
}) {
  const isCompact = density === 'compact';
  const cellPadding = isCompact ? 'px-3 py-2 text-xs' : 'px-4 py-3.5 text-sm';
  const headerPadding = isCompact ? 'px-3 py-2 text-xs' : 'px-4 py-3 text-xs';

  const visibleColumns = columns.filter((col) => !col.hidden);
  const allSelected = data.length > 0 && data.every((row) => selectedRowKeys.has(row[keyField]));
  const someSelected = data.some((row) => selectedRowKeys.has(row[keyField])) && !allSelected;

  return (
    <div className={`w-full overflow-hidden border border-[#E4E7EF] dark:border-[#262B44] rounded-[16px] bg-white dark:bg-[#171B2E] shadow-sm ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#E4E7EF] dark:border-[#262B44] bg-slate-50/75 dark:bg-[#1E2338]/60 text-[#5B6480] dark:text-[#98A0BE] font-semibold select-none sticky top-0 z-10 backdrop-blur-sm">
              {onToggleSelectRow && (
                <th className={`${headerPadding} w-10 text-center`}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected;
                    }}
                    onChange={onToggleSelectAll}
                    className="rounded border-[#E4E7EF] dark:border-[#262B44] text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                  />
                </th>
              )}
              {visibleColumns.map((col) => {
                const isSorted = sortBy === col.key || sortBy === col.sortKey;
                return (
                  <th
                    key={col.key}
                    onClick={() => col.sortable && onSort && onSort(col.sortKey || col.key)}
                    className={`${headerPadding} whitespace-nowrap ${
                      col.sortable ? 'cursor-pointer hover:text-[#141A33] dark:hover:text-[#ECEEF8]' : ''
                    } ${col.headerClassName || ''}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.title}</span>
                      {col.sortable && (
                        <span className="opacity-70">
                          {isSorted ? (
                            sortOrder === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-40 hover:opacity-100" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E4E7EF] dark:divide-[#262B44] text-[#141A33] dark:text-[#ECEEF8]">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, rIdx) => (
                <tr key={rIdx}>
                  {onToggleSelectRow && (
                    <td className={cellPadding}>
                      <Skeleton className="w-4 h-4 rounded" />
                    </td>
                  )}
                  {visibleColumns.map((col, cIdx) => (
                    <td key={cIdx} className={cellPadding}>
                      <Skeleton className="h-4 w-3/4 rounded" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleColumns.length + (onToggleSelectRow ? 1 : 0)}
                  className="p-8 text-center"
                >
                  <EmptyState title={emptyTitle} message={emptyMessage} />
                </td>
              </tr>
            ) : (
              data.map((row) => {
                const key = row[keyField];
                const isSelected = selectedRowKeys.has(key);
                return (
                  <tr
                    key={key}
                    onClick={() => onRowClick && onRowClick(row)}
                    onMouseEnter={() => onRowHover && onRowHover(row)}
                    className={`transition-colors duration-150 ${
                      isSelected
                        ? 'bg-indigo-50/60 dark:bg-indigo-950/30'
                        : 'hover:bg-slate-50 dark:hover:bg-[#1E2338]/50'
                    } ${onRowClick ? 'cursor-pointer' : ''}`}
                  >
                    {onToggleSelectRow && (
                      <td
                        className={`${cellPadding} text-center`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onToggleSelectRow(key)}
                          className="rounded border-[#E4E7EF] dark:border-[#262B44] text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                        />
                      </td>
                    )}
                    {visibleColumns.map((col) => {
                      const val = col.render ? col.render(row) : row[col.key] ?? '—';
                      return (
                        <td
                          key={col.key}
                          className={`${cellPadding} ${col.className || ''}`}
                        >
                          {val}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
