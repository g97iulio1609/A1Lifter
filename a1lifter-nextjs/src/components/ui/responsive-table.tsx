/**
 * Responsive table component
 * Switches to card view on mobile
 */

import { cn } from "@/lib/utils"
import { ReactNode } from "react"

interface Column<T> {
  header: string
  accessor: keyof T | ((item: T) => ReactNode)
  className?: string
  mobileLabel?: string // Label to show in mobile card view
}

interface ResponsiveTableProps<T> {
  data: T[]
  columns: Column<T>[]
  keyExtractor: (item: T) => string
  onRowClick?: (item: T) => void
  emptyMessage?: string
  className?: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ResponsiveTable<T extends Record<string, any>>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  emptyMessage = "No data available",
  className,
}: ResponsiveTableProps<T>) {
  const getCellValue = (item: T, column: Column<T>) => {
    if (typeof column.accessor === "function") {
      return column.accessor(item)
    }
    return item[column.accessor]
  }

  if (data.length === 0) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-gray-500">
        {emptyMessage}
      </div>
    )
  }

  return (
    <>
      {/* Desktop table view */}
      <div className={cn("hidden overflow-x-auto md:block", className)}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={cn(
                    "px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500",
                    column.className
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {data.map((item) => (
              <tr
                key={keyExtractor(item)}
                onClick={() => onRowClick?.(item)}
                className={cn(
                  "hover:bg-gray-50",
                  onRowClick && "cursor-pointer"
                )}
              >
                {columns.map((column, index) => (
                  <td
                    key={index}
                    className={cn(
                      "whitespace-nowrap px-6 py-4 text-sm text-gray-900",
                      column.className
                    )}
                  >
                    {getCellValue(item, column)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card view */}
      <div className="space-y-4 md:hidden">
        {data.map((item) => (
          <div
            key={keyExtractor(item)}
            onClick={() => onRowClick?.(item)}
            className={cn(
              "rounded-lg border border-gray-200 bg-white p-4 shadow-sm",
              onRowClick && "cursor-pointer active:bg-gray-50"
            )}
          >
            {columns.map((column, index) => (
              <div key={index} className="mb-2 last:mb-0">
                <dt className="text-xs font-medium text-gray-500">
                  {column.mobileLabel || column.header}
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {getCellValue(item, column)}
                </dd>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  )
}
