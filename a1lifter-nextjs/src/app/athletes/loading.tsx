import { TableSkeleton, Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950">
      <header className="border-b bg-white dark:border-slate-700 dark:bg-slate-900">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex-1">
            <Skeleton className="mb-2 h-8 w-48 md:h-10" />
            <Skeleton className="h-4 w-80 md:h-5" />
          </div>
          <Skeleton className="h-11 w-full sm:w-40" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-10 w-80" />
          <Skeleton className="h-10 w-32" />
        </div>

        <TableSkeleton rows={8} />
      </main>
    </div>
  )
}
