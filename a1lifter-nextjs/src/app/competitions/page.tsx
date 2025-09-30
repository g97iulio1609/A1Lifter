import { Button } from "@/components/ui/button"
import { Plus, Calendar, MapPin, Users } from "lucide-react"

export default function CompetitionsPage() {
  const competitions = [
    {
      id: 1,
      name: "Italian National Championships",
      date: "2024-03-15",
      location: "Rome, Italy",
      status: "upcoming",
      participants: 45,
      type: "powerlifting"
    },
    {
      id: 2,
      name: "Regional Strongman Cup",
      date: "2024-02-28",
      location: "Milan, Italy", 
      status: "in-progress",
      participants: 32,
      type: "strongman"
    },
    {
      id: 3,
      name: "Youth Development Meet",
      date: "2024-01-20",
      location: "Naples, Italy",
      status: "completed",
      participants: 28,
      type: "powerlifting"
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Competitions</h1>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Competition
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {competitions.map((competition) => (
            <CompetitionCard key={competition.id} competition={competition} />
          ))}
        </div>

        <div className="mt-12 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Next.js Migration Benefits</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Performance Improvements</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Server-side rendering for faster page loads</li>
                <li>• Automatic code splitting and optimization</li>
                <li>• Image optimization with Next.js Image component</li>
                <li>• Built-in caching and edge deployment</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Developer Experience</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• TypeScript support out of the box</li>
                <li>• Hot reload and fast refresh</li>
                <li>• Built-in API routes and middleware</li>
                <li>• Seamless Vercel deployment</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CompetitionCard({ competition }: {
  competition: {
    id: number
    name: string
    date: string
    location: string
    status: string
    participants: number
    type: string
  }
}) {
  const statusColors = {
    upcoming: 'bg-blue-100 text-blue-800',
    'in-progress': 'bg-green-100 text-green-800',
    completed: 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{competition.name}</h3>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[competition.status as keyof typeof statusColors]}`}>
          {competition.status}
        </span>
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="w-4 h-4 mr-2" />
          {new Date(competition.date).toLocaleDateString('it-IT')}
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <MapPin className="w-4 h-4 mr-2" />
          {competition.location}
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Users className="w-4 h-4 mr-2" />
          {competition.participants} participants
        </div>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-500 capitalize">
          {competition.type}
        </span>
        <Button variant="outline" size="sm">
          View Details
        </Button>
      </div>
    </div>
  )
}