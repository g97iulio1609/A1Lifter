import { Button } from "@/components/ui/button"
import { Play, Pause, RotateCcw } from "lucide-react"

export default function LivePage() {
  const currentAttempt = {
    athlete: "Marco Rossi",
    discipline: "Squat",
    attempt: 2,
    weight: 225,
    platform: "Platform 1"
  }

  const leaderboard = [
    {
      rank: 1,
      name: "Andrea Ferrari",
      category: "M 93kg",
      squat: 240,
      bench: 170,
      deadlift: 300,
      total: 710,
      wilks: 445.2
    },
    {
      rank: 2,
      name: "Marco Rossi", 
      category: "M 83kg",
      squat: 220,
      bench: 150,
      deadlift: 280,
      total: 650,
      wilks: 442.8
    },
    {
      rank: 3,
      name: "Sofia Bianchi",
      category: "F 63kg",
      squat: 140,
      bench: 85,
      deadlift: 180,
      total: 405,
      wilks: 441.5
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Live Competition</h1>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-600">LIVE</span>
          </div>
        </div>

        {/* Current Attempt */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Attempt</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="text-3xl font-bold text-gray-900 mb-2">{currentAttempt.athlete}</div>
              <div className="text-lg text-gray-600 mb-4">
                {currentAttempt.discipline} - Attempt {currentAttempt.attempt}
              </div>
              <div className="text-4xl font-bold text-blue-600 mb-4">
                {currentAttempt.weight} kg
              </div>
              <div className="text-sm text-gray-500">{currentAttempt.platform}</div>
            </div>
            <div className="flex flex-col justify-center">
              <div className="flex space-x-2 mb-4">
                <Button size="lg">
                  <Play className="w-4 h-4 mr-2" />
                  Start Timer
                </Button>
                <Button variant="outline" size="lg">
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </Button>
                <Button variant="outline" size="lg">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
              <div className="text-6xl font-mono font-bold text-center text-gray-900">
                01:30
              </div>
            </div>
          </div>
        </div>

        {/* Judges Panel */}
        <div className="bg-white rounded-lg shadow mb-8 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Judges Panel</h3>
          <div className="grid grid-cols-3 gap-4">
            <JudgeVote judge="Judge 1" position="Left" vote="valid" />
            <JudgeVote judge="Judge 2" position="Center" vote="valid" />
            <JudgeVote judge="Judge 3" position="Right" vote="invalid" />
          </div>
          <div className="mt-4 text-center">
            <span className="text-lg font-semibold text-green-600">VALID - 2/3 White Lights</span>
          </div>
        </div>

        {/* Live Leaderboard */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">Live Leaderboard</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Athlete
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Squat
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bench
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deadlift
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Wilks
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leaderboard.map((athlete) => (
                  <LeaderboardRow key={athlete.rank} athlete={athlete} />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-12 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Real-time Features Migration</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">From Firebase Realtime DB</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• WebSocket connections for live updates</li>
                <li>• Firestore snapshot listeners</li>
                <li>• Manual connection management</li>
                <li>• Custom real-time logic</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">To Supabase Real-time</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• PostgreSQL change data capture</li>
                <li>• Built-in real-time subscriptions</li>
                <li>• Automatic connection handling</li>
                <li>• Row Level Security for real-time</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function JudgeVote({ judge, position, vote }: {
  judge: string
  position: string
  vote: 'valid' | 'invalid' | 'pending'
}) {
  const voteColors = {
    valid: 'bg-green-500',
    invalid: 'bg-red-500',
    pending: 'bg-gray-300'
  }

  return (
    <div className="text-center p-4 border rounded-lg">
      <div className="text-sm font-medium text-gray-900 mb-2">{judge}</div>
      <div className="text-xs text-gray-500 mb-3">{position}</div>
      <div className={`w-16 h-16 ${voteColors[vote]} rounded-full mx-auto flex items-center justify-center`}>
        {vote === 'valid' && <span className="text-white font-bold text-xl">✓</span>}
        {vote === 'invalid' && <span className="text-white font-bold text-xl">✗</span>}
        {vote === 'pending' && <span className="text-gray-600 font-bold text-xl">?</span>}
      </div>
    </div>
  )
}

function LeaderboardRow({ athlete }: {
  athlete: {
    rank: number
    name: string
    category: string
    squat: number
    bench: number
    deadlift: number
    total: number
    wilks: number
  }
}) {
  const isCurrentAthlete = athlete.name === "Marco Rossi"
  
  return (
    <tr className={`${isCurrentAthlete ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50'}`}>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <span className={`text-lg font-bold ${athlete.rank === 1 ? 'text-yellow-600' : athlete.rank === 2 ? 'text-gray-500' : athlete.rank === 3 ? 'text-orange-600' : 'text-gray-900'}`}>
            {athlete.rank}
          </span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div>
          <div className={`text-sm font-medium ${isCurrentAthlete ? 'text-blue-900' : 'text-gray-900'}`}>
            {athlete.name}
          </div>
          <div className="text-sm text-gray-500">{athlete.category}</div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
        {athlete.squat}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
        {athlete.bench}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
        {athlete.deadlift}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
        {athlete.total}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {athlete.wilks}
      </td>
    </tr>
  )
}