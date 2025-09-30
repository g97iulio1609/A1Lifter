import { Button } from "@/components/ui/button"
import { Plus, Search, Filter } from "lucide-react"

export default function AthletesPage() {
  const athletes = [
    {
      id: 1,
      name: "Marco Rossi",
      email: "marco.rossi@email.com",
      gender: "M",
      weightClass: "83kg",
      federation: "FIPL",
      personalBests: { squat: 220, bench: 150, deadlift: 280 },
      total: 650
    },
    {
      id: 2,
      name: "Sofia Bianchi",
      email: "sofia.bianchi@email.com",
      gender: "F",
      weightClass: "63kg",
      federation: "FIPL",
      personalBests: { squat: 140, bench: 85, deadlift: 180 },
      total: 405
    },
    {
      id: 3,
      name: "Andrea Ferrari",
      email: "andrea.ferrari@email.com",
      gender: "M",
      weightClass: "93kg",
      federation: "FIPL",
      personalBests: { squat: 240, bench: 170, deadlift: 300 },
      total: 710
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Athletes</h1>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Athlete
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search athletes..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Athlete
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Weight Class
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Personal Bests
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Federation
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {athletes.map((athlete) => (
                  <AthleteRow key={athlete.id} athlete={athlete} />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-12 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Database Migration Progress</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">From Firebase to Supabase</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• NoSQL to PostgreSQL migration</li>
                <li>• Type-safe queries with Prisma ORM</li>
                <li>• Real-time subscriptions maintained</li>
                <li>• Enhanced query performance</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Schema Improvements</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Normalized database structure</li>
                <li>• Foreign key constraints</li>
                <li>• Optimized indexing strategy</li>
                <li>• ACID compliance guarantee</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AthleteRow({ athlete }: {
  athlete: {
    id: number
    name: string
    email: string
    gender: string
    weightClass: string
    federation: string
    personalBests: { squat: number; bench: number; deadlift: number }
    total: number
  }
}) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div>
          <div className="text-sm font-medium text-gray-900">{athlete.name}</div>
          <div className="text-sm text-gray-500">{athlete.email}</div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {athlete.gender} {athlete.weightClass}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <div className="font-medium">{athlete.personalBests.squat}</div>
            <div className="text-xs text-gray-500">SQ</div>
          </div>
          <div className="text-center">
            <div className="font-medium">{athlete.personalBests.bench}</div>
            <div className="text-xs text-gray-500">BP</div>
          </div>
          <div className="text-center">
            <div className="font-medium">{athlete.personalBests.deadlift}</div>
            <div className="text-xs text-gray-500">DL</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        {athlete.total} kg
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {athlete.federation}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <Button variant="ghost" size="sm">
          Edit
        </Button>
      </td>
    </tr>
  )
}