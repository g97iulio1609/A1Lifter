/**
 * Data export utilities for CSV and PDF
 */

/**
 * Convert array of objects to CSV string
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string = "export.csv"
): void {
  if (data.length === 0) {
    console.warn("No data to export")
    return
  }

  // Get headers from first object
  const headers = Object.keys(data[0])

  // Create CSV content
  const csvContent = [
    headers.join(","), // Header row
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header]
          // Handle values that might contain commas or quotes
          if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value ?? ""
        })
        .join(",")
    ),
  ].join("\n")

  // Create blob and trigger download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", filename)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

/**
 * Format data for export
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function formatForExport<T>(
  data: T[],
  fieldMapping?: Record<keyof T, string>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Record<string, any>[] {
  return data.map((item) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formatted: Record<string, any> = {}

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Object.entries(item as Record<string, any>).forEach(([key, value]) => {
      const label = fieldMapping?.[key as keyof T] || key

      // Format different types
      if (value instanceof Date) {
        formatted[label] = value.toISOString().split("T")[0]
      } else if (typeof value === "boolean") {
        formatted[label] = value ? "Yes" : "No"
      } else if (value === null || value === undefined) {
        formatted[label] = ""
      } else if (typeof value === "object") {
        formatted[label] = JSON.stringify(value)
      } else {
        formatted[label] = value
      }
    })

    return formatted
  })
}

/**
 * Export dashboard stats to CSV
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function exportDashboardStats(stats: any): void {
  const data = [
    {
      Metric: "Total Athletes",
      Value: stats.totalAthletes,
    },
    {
      Metric: "Active Competitions",
      Value: stats.activeCompetitions,
    },
    {
      Metric: "Today's Results",
      Value: stats.todayResults,
    },
    {
      Metric: "Records Broken",
      Value: stats.recordsBroken,
    },
    {
      Metric: "Total Events",
      Value: stats.totalEvents,
    },
    {
      Metric: "Upcoming Events",
      Value: stats.upcomingEvents,
    },
    {
      Metric: "Completed Events",
      Value: stats.completedEvents,
    },
    {
      Metric: "Total Registrations",
      Value: stats.totalRegistrations,
    },
    {
      Metric: "Pending Approvals",
      Value: stats.pendingApprovals,
    },
  ]

  const filename = `dashboard-stats-${new Date().toISOString().split("T")[0]}.csv`
  exportToCSV(data, filename)
}

/**
 * Export top lifters to CSV
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function exportTopLifters(lifters: any[]): void {
  const data = formatForExport(
    lifters.map((lifter) => ({
      Name: lifter.name,
      Email: lifter.email,
      Role: lifter.role,
      "Total Attempts": lifter.totalAttempts || 0,
      "Successful Lifts": lifter.successfulLifts || 0,
      "Success Rate": lifter.successRate ? `${lifter.successRate.toFixed(1)}%` : "0%",
      "Best Lift": lifter.bestLift || "N/A",
    }))
  )

  const filename = `top-lifters-${new Date().toISOString().split("T")[0]}.csv`
  exportToCSV(data, filename)
}

/**
 * Export event data to CSV
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function exportEvents(events: any[]): void {
  const data = formatForExport(
    events.map((event) => ({
      Name: event.name,
      Sport: event.sport,
      Status: event.status,
      "Start Date": new Date(event.startDate).toLocaleDateString(),
      "End Date": new Date(event.endDate).toLocaleDateString(),
      Location: event.location,
      "Max Athletes": event.maxAthletes || "Unlimited",
      "Registrations": event._count?.registrations || 0,
    }))
  )

  const filename = `events-${new Date().toISOString().split("T")[0]}.csv`
  exportToCSV(data, filename)
}

/**
 * Print current page (for PDF export via browser print)
 */
export function exportToPDF(): void {
  window.print()
}
