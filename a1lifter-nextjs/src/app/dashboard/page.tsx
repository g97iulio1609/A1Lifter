export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Competition Dashboard</h1>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <DashboardCard
            title="Active Competitions"
            value="3"
            subtitle="2 in progress"
            color="blue"
          />
          <DashboardCard
            title="Total Athletes"
            value="156"
            subtitle="12 new this month"
            color="green"
          />
          <DashboardCard
            title="Live Sessions"
            value="1"
            subtitle="Platform 2 active"
            color="purple"
          />
          <DashboardCard
            title="Records Broken"
            value="8"
            subtitle="This competition"
            color="yellow"
          />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Migration Status</h2>
          <div className="space-y-3">
            <StatusRow status="completed" label="Next.js 15 Framework Migration" />
            <StatusRow status="completed" label="Prisma Database Schema" />
            <StatusRow status="completed" label="Supabase Integration Setup" />
            <StatusRow status="in-progress" label="UI Component Migration" />
            <StatusRow status="pending" label="Authentication System" />
            <StatusRow status="pending" label="Real-time Features" />
          </div>
        </div>
      </div>
    </div>
  )
}

function DashboardCard({ title, value, subtitle, color }: {
  title: string
  value: string
  subtitle: string
  color: 'blue' | 'green' | 'purple' | 'yellow'
}) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    yellow: 'bg-yellow-500'
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`p-2 ${colorClasses[color]} rounded-lg mr-4`}>
          <div className="w-6 h-6 bg-white rounded"></div>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
      </div>
    </div>
  )
}

function StatusRow({ status, label }: {
  status: 'completed' | 'in-progress' | 'pending'
  label: string
}) {
  const statusConfig = {
    completed: { icon: '✅', color: 'text-green-600' },
    'in-progress': { icon: '🔄', color: 'text-yellow-600' },
    pending: { icon: '⏸️', color: 'text-gray-600' }
  }

  const config = statusConfig[status]

  return (
    <div className="flex items-center space-x-3">
      <span className={config.color}>{config.icon}</span>
      <span className="text-gray-900">{label}</span>
    </div>
  )
}