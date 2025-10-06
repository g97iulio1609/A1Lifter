import { Skeleton, StatCardSkeleton, TableSkeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950">
      <header className="border-b bg-white dark:border-slate-700 dark:bg-slate-900">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex-1">
            <Skeleton className="mb-2 h-8 w-48 md:h-10" />
            <Skeleton className="h-4 w-96 md:h-5" />
          </div>
          <Skeleton className="h-11 w-full sm:w-32" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats Grid */}
        <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </section>

        {/* Highlighted Event and KPI Summary */}
        <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
            <Skeleton className="mb-2 h-6 w-40" />
            <Skeleton className="mb-6 h-4 w-64" />
            <Skeleton className="mb-4 h-4 w-full" />
            <Skeleton className="mb-4 h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
            <Skeleton className="mb-2 h-6 w-48" />
            <Skeleton className="mb-6 h-4 w-56" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        </section>

        {/* Top Performers Table */}
        <section className="mt-8">
          <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
            <div className="border-b border-slate-200 p-6 dark:border-slate-700">
              <Skeleton className="mb-2 h-6 w-64" />
              <Skeleton className="h-4 w-80" />
            </div>
            <div className="p-6">
              <TableSkeleton rows={5} />
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
