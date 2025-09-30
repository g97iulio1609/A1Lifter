import { Button } from "@/components/ui/button"
import { Trophy, Users, Calendar, BarChart3 } from "lucide-react"
import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Trophy className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">A1Lifter</h1>
          </div>
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/competitions" className="text-gray-600 hover:text-gray-900">Competitions</Link>
            <Link href="/athletes" className="text-gray-600 hover:text-gray-900">Athletes</Link>
            <Link href="/results" className="text-gray-600 hover:text-gray-900">Results</Link>
            <Button variant="outline" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-5xl font-bold text-gray-900 mb-6">
          Modern Sports Competition Management
        </h2>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          The most advanced platform for managing powerlifting, weightlifting, strongman, 
          and functional fitness competitions. Built for organizers, athletes, and spectators.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" asChild>
            <Link href="/dashboard">Start Managing Events</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/live">View Live Competitions</Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <h3 className="text-3xl font-bold text-center mb-12">Platform Features</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <Calendar className="h-12 w-12 text-blue-600 mb-4" />
            <h4 className="text-xl font-semibold mb-2">Event Management</h4>
            <p className="text-gray-600">Create and manage competitions with advanced scheduling and category management.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <Users className="h-12 w-12 text-green-600 mb-4" />
            <h4 className="text-xl font-semibold mb-2">Athlete Registration</h4>
            <p className="text-gray-600">Streamlined athlete registration with automatic category placement and validation.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <BarChart3 className="h-12 w-12 text-purple-600 mb-4" />
            <h4 className="text-xl font-semibold mb-2">Live Scoring</h4>
            <p className="text-gray-600">Real-time scoring and leaderboards with offline-capable judge interfaces.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <Trophy className="h-12 w-12 text-orange-600 mb-4" />
            <h4 className="text-xl font-semibold mb-2">Results & Analytics</h4>
            <p className="text-gray-600">Comprehensive results tracking with performance analytics and record management.</p>
          </div>
        </div>
      </section>

      {/* Sports Supported */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold mb-8">Supported Sports</h3>
          <div className="flex flex-wrap justify-center gap-6">
            {['Powerlifting', 'Weightlifting', 'Strongman', 'CrossFit', 'Streetlifting'].map((sport) => (
              <div key={sport} className="bg-slate-100 px-6 py-3 rounded-full">
                <span className="font-medium text-gray-800">{sport}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Trophy className="h-6 w-6" />
                <span className="text-xl font-bold">A1Lifter</span>
              </div>
              <p className="text-gray-400">Modern sports competition management platform.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/features" className="hover:text-white">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/docs" className="hover:text-white">Documentation</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/help" className="hover:text-white">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
                <li><Link href="/status" className="hover:text-white">Status</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/privacy" className="hover:text-white">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms</Link></li>
                <li><Link href="/security" className="hover:text-white">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 A1Lifter. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
