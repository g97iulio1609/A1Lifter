"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useCreateAthlete } from "@/hooks/api/use-athletes"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2, ArrowLeft, UserPlus } from "lucide-react"

export default function CreateAthletePage() {
  const router = useRouter()
  const { data: session } = useSession()
  const createAthlete = useCreateAthlete()

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  })

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    try {
      await createAthlete.mutateAsync({
        name: formData.name,
        email: formData.email,
        password: formData.password || undefined,
      })

      toast.success("Athlete created successfully")
      router.push("/athletes")
    } catch (error: unknown) {
      console.error(error)
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error("Unable to create athlete")
      }
    }
  }

  if (!session) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Please sign in to create athletes</h1>
          <Link href="/auth/signin">
            <Button className="mt-4">Sign in</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "ORGANIZER") {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Access denied</h1>
          <p className="mt-2 text-gray-600">Only organizers and admins can create athletes.</p>
          <Link href="/dashboard">
            <Button className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to dashboard
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-8 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">New athlete</h1>
            <p className="mt-2 text-gray-600">Create a profile and invite the athlete to the platform.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/athletes">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </Link>
            <Button form="create-athlete-form" type="submit" disabled={createAthlete.isPending}>
              {createAthlete.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
              Create athlete
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>Athlete details</CardTitle>
            <CardDescription>We will send an invite email with credentials once the profile is created.</CardDescription>
          </CardHeader>
          <CardContent>
            <form id="create-athlete-form" onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Full name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(event) => handleChange("name", event.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(event) => handleChange("email", event.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Temporary password (optional)</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(event) => handleChange("password", event.target.value)}
                  placeholder="Leave blank to auto-generate"
                />
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
