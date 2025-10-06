# Loading States & Perceived Performance

## Overview
This document outlines best practices for loading states, skeleton screens, and perceived performance optimization in A1Lifter.

## Skeleton Screens

### Benefits
- Reduces perceived loading time
- Provides visual feedback during data fetching
- Prevents layout shift (CLS)
- Better UX than spinners alone

### Usage

```tsx
import { Skeleton, CardSkeleton, TableSkeleton } from "@/components/ui/skeleton"

// Simple skeleton
<Skeleton className="h-4 w-64" />

// Card skeleton
<CardSkeleton />

// Table skeleton
<TableSkeleton rows={5} />

// Stat card skeleton
<StatCardSkeleton />
```

### Next.js Loading Files

Create `loading.tsx` files alongside your `page.tsx`:

```tsx
// app/events/loading.tsx
import { CardSkeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}
```

## Suspense Boundaries

Use React Suspense to handle loading states declaratively:

```tsx
import { Suspense } from "react"
import { CardSkeleton } from "@/components/ui/skeleton"

export default function EventsPage() {
  return (
    <Suspense fallback={<CardSkeleton />}>
      <EventsList />
    </Suspense>
  )
}
```

### Granular Suspense

Wrap independent data fetches separately for better UX:

```tsx
<div className="grid grid-cols-2 gap-6">
  <Suspense fallback={<StatCardSkeleton />}>
    <StatsCard />
  </Suspense>

  <Suspense fallback={<TableSkeleton />}>
    <EventsTable />
  </Suspense>
</div>
```

## Image Loading

### Next.js Image Component

Always use Next.js Image component for automatic optimization:

```tsx
import Image from "next/image"

<Image
  src="/athlete.jpg"
  alt="Athlete profile"
  width={400}
  height={400}
  loading="lazy"  // Lazy load by default
  placeholder="blur"  // Show blur effect while loading
  blurDataURL="data:image/jpeg;base64,..."  // Low-quality placeholder
/>
```

### Lazy Loading

```tsx
// Below-the-fold images
<Image
  src="/photo.jpg"
  alt="Description"
  loading="lazy"
  width={800}
  height={600}
/>

// Above-the-fold (LCP images)
<Image
  src="/hero.jpg"
  alt="Hero image"
  priority  // Load immediately
  width={1200}
  height={800}
/>
```

## Link Prefetching

### Automatic Prefetching

Next.js Link components prefetch by default when in viewport:

```tsx
import Link from "next/link"

// Prefetches when link enters viewport
<Link href="/events/123">View event</Link>

// Disable prefetching for dynamic routes
<Link href="/events/[id]" prefetch={false}>
  View event
</Link>
```

### Manual Prefetching

```tsx
import { useRouter } from "next/navigation"

const router = useRouter()

// Prefetch on hover
<button
  onMouseEnter={() => router.prefetch("/events/123")}
  onClick={() => router.push("/events/123")}
>
  View event
</button>
```

## Loading Indicators

### Spinner Component

Use sparingly - prefer skeletons:

```tsx
import { Loader2 } from "lucide-react"

// Button loading state
<Button disabled={isLoading}>
  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  Submit
</Button>

// Inline loading
{isLoading ? (
  <Loader2 className="h-6 w-6 animate-spin" />
) : (
  <Content />
)}
```

### Progress Bars

For long-running operations:

```tsx
<div className="w-full bg-gray-200 rounded-full h-2">
  <div
    className="bg-indigo-600 h-2 rounded-full transition-all"
    style={{ width: `${progress}%` }}
  />
</div>
```

## React Query Loading States

### Optimistic Updates

Show changes immediately before server confirmation:

```tsx
const mutation = useMutation({
  mutationFn: updateAthlete,
  onMutate: async (newData) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['athlete', id] })

    // Snapshot previous value
    const previous = queryClient.getQueryData(['athlete', id])

    // Optimistically update
    queryClient.setQueryData(['athlete', id], newData)

    return { previous }
  },
  onError: (err, newData, context) => {
    // Rollback on error
    queryClient.setQueryData(['athlete', id], context.previous)
  },
})
```

### Stale-While-Revalidate

Show cached data while fetching fresh data:

```tsx
const { data, isLoading } = useQuery({
  queryKey: ['events'],
  queryFn: fetchEvents,
  staleTime: 5 * 60 * 1000,  // Consider fresh for 5 minutes
  refetchOnMount: 'always',  // Always check for updates
})
```

## Performance Patterns

### Avoid Flash of Empty Content

```tsx
// ❌ Bad - shows nothing then content
{data && <EventsList events={data} />}

// ✅ Good - shows skeleton then content
{isLoading ? <EventsListSkeleton /> : <EventsList events={data} />}
```

### Parallel Data Fetching

```tsx
// Fetch in parallel, not sequentially
const [eventsQuery, athletesQuery] = useQueries([
  { queryKey: ['events'], queryFn: fetchEvents },
  { queryKey: ['athletes'], queryFn: fetchAthletes },
])
```

### Debounce Search

```tsx
import { useDeferredValue } from "react"

function SearchResults({ query }: { query: string }) {
  const deferredQuery = useDeferredValue(query)

  const { data } = useQuery({
    queryKey: ['search', deferredQuery],
    queryFn: () => searchEvents(deferredQuery),
  })

  return <Results data={data} />
}
```

## Testing Loading States

```tsx
import { render, screen } from "@testing-library/react"

it("shows skeleton while loading", () => {
  render(<EventsPage />)

  expect(screen.getByRole("status", { name: /loading/i }))
    .toBeInTheDocument()
})

it("shows content after loading", async () => {
  render(<EventsPage />)

  await waitFor(() => {
    expect(screen.getByText("Event Name")).toBeInTheDocument()
  })
})
```

## Best Practices Checklist

- [ ] Use skeleton screens instead of spinners for list/grid content
- [ ] Add loading.tsx files to all major routes
- [ ] Use Suspense boundaries for independent data fetches
- [ ] Lazy load images below the fold
- [ ] Priority load LCP images (hero images)
- [ ] Prefetch critical navigation paths
- [ ] Show optimistic updates for mutations
- [ ] Debounce search and filter inputs
- [ ] Test loading states with slow 3G throttling
- [ ] Measure Core Web Vitals (LCP, FID, CLS)

## Core Web Vitals Targets

- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

## Resources

- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)
- [React Query Optimistic Updates](https://tanstack.com/query/latest/docs/react/guides/optimistic-updates)
- [Web Vitals](https://web.dev/vitals/)
- [Skeleton Screens](https://uxdesign.cc/what-you-should-know-about-skeleton-screens-a820c45a571a)
