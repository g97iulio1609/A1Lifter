"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { useAthlete, useUpdateAthlete } from "@/hooks/api/use-athletes"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2, ArrowLeft, Save } from "lucide-react"

export default function SettingsPage() {
  const { data: session } = useSession()
  const userId = session?.user?.id
  const { data: profile, isLoading } = useAthlete(userId)
  const updateAthlete = useUpdateAthlete()

  const [formState, setFormState] = useState({
    name: "",
    email: "",
    password: "",
  })

  useEffect(() => {
    if (!profile) return
    setFormState({
      name: profile.name ?? "",
      email: profile.email,
      password: "",
    })
  }, [profile])

  const handleChange = (field: "name" | "email" | "password", value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!userId) return

    try {
      await updateAthlete.mutateAsync({
        athleteId: userId,
        athleteData: {
          name: formState.name,
          email: formState.email,
          ...(formState.password ? { password: formState.password } : {}),
        },
      })

      toast.success("Settings saved")
      setFormState((prev) => ({ ...prev, password: "" }))
    } catch (error: unknown) {
      console.error(error)
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error("Unable to save settings")
      }
    }
  }

  if (!session) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Please sign in to manage your settings</h1>
          <Link href="/auth/signin">
            <Button className="mt-4">Sign in</Button>
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
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="mt-2 text-gray-600">Update your workspace preferences and profile details.</p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>These settings are shared across all devices.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
              </div>
            ) : !profile ? (
              <p className="text-sm text-gray-500">Unable to load your profile.</p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    value={formState.name}
                    onChange={(event) => handleChange("name", event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formState.email}
                    onChange={(event) => handleChange("email", event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Reset password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formState.password}
                    placeholder="Leave blank to keep current password"
                    onChange={(event) => handleChange("password", event.target.value)}
                  />
                </div>
                <Button type="submit" disabled={updateAthlete.isPending}>
                  {updateAthlete.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save changes
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
