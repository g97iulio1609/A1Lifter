import { Button } from "@/components/ui/button"
import { ArrowRight, Trophy, Users, Calendar, BarChart3 } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Trophy className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">A1Lifter</h1>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/competitions" className="text-gray-600 hover:text-gray-900">
              Competitions
            </Link>
            <Link href="/athletes" className="text-gray-600 hover:text-gray-900">
              Athletes
            </Link>
            <Link href="/live" className="text-gray-600 hover:text-gray-900">
              Live Results
            </Link>
            <Button>Admin Login</Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Professional Powerlifting Competition Management
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Complete solution for managing powerlifting, strongman, and weightlifting competitions. 
            Real-time scoring, live streaming, and comprehensive athlete management.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8 py-4">
              Start Competition
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-4">
              View Live Demo
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <FeatureCard
            icon={<Users className="h-8 w-8 text-blue-600" />}
            title="Athlete Management"
            description="Complete athlete profiles, registrations, and performance tracking"
          />
          <FeatureCard
            icon={<Calendar className="h-8 w-8 text-green-600" />}
            title="Event Organization"
            description="Schedule competitions, manage categories, and handle logistics"
          />
          <FeatureCard
            icon={<BarChart3 className="h-8 w-8 text-purple-600" />}
            title="Live Scoring"
            description="Real-time judging, automatic calculations, and live leaderboards"
          />
          <FeatureCard
            icon={<Trophy className="h-8 w-8 text-yellow-600" />}
            title="Records Tracking"
            description="Automatic record detection and comprehensive statistics"
          />
        </div>

        {/* Migration Status */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Migration Status</h3>
          <div className="space-y-4">
            <StatusItem status="completed" text="Next.js 15 Setup" />
            <StatusItem status="completed" text="Prisma Schema Design" />
            <StatusItem status="completed" text="Supabase Integration Foundation" />
            <StatusItem status="in-progress" text="Component Migration" />
            <StatusItem status="pending" text="Authentication Implementation" />
            <StatusItem status="pending" text="Database Migration" />
            <StatusItem status="pending" text="Real-time Features" />
            <StatusItem status="pending" text="Production Deployment" />
          </div>
        </div>

        {/* Technology Stack */}
        <div className="bg-gray-50 rounded-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Technology Stack</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <TechStack
              title="Frontend"
              technologies={["Next.js 15", "React 19", "Tailwind CSS", "Shadcn/ui", "TypeScript"]}
            />
            <TechStack
              title="Backend"
              technologies={["Supabase", "PostgreSQL", "Prisma ORM", "NextAuth.js", "Real-time subscriptions"]}
            />
            <TechStack
              title="Infrastructure"
              technologies={["Vercel", "Edge Functions", "PWA Support", "Service Workers", "Redis Cache"]}
            />
          </div>
        </div>
      </main>
    </div>
  )
}

function FeatureCard({ icon, title, description }: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}

function StatusItem({ status, text }: {
  status: "completed" | "in-progress" | "pending"
  text: string
}) {
  const statusColors = {
    completed: "bg-green-100 text-green-800",
    "in-progress": "bg-yellow-100 text-yellow-800",
    pending: "bg-gray-100 text-gray-800"
  }

  const statusIcons = {
    completed: "✓",
    "in-progress": "⏳",
    pending: "○"
  }

  return (
    <div className="flex items-center space-x-3">
      <span className={`px-2 py-1 rounded-full text-sm font-medium ${statusColors[status]}`}>
        {statusIcons[status]} {status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ")}
      </span>
      <span className="text-gray-700">{text}</span>
    </div>
  )
}

function TechStack({ title, technologies }: {
  title: string
  technologies: string[]
}) {
  return (
    <div>
      <h4 className="text-lg font-semibold text-gray-900 mb-3">{title}</h4>
      <ul className="space-y-2">
        {technologies.map((tech, index) => (
          <li key={index} className="text-gray-600 flex items-center">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
            {tech}
          </li>
        ))}
      </ul>
    </div>
  )
}
