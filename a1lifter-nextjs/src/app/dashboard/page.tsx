import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"

export default async function Dashboard() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Welcome to A1Lifter Dashboard
            </h1>
            <p className="text-gray-600 mb-4">
              Hello, {session.user.name}! Your role: {session.user.role}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Events</h3>
                <p className="text-gray-600">Manage your competitions</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Athletes</h3>
                <p className="text-gray-600">View athlete registrations</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Results</h3>
                <p className="text-gray-600">Track competition results</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}