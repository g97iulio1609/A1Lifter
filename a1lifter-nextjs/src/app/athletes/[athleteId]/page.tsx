"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import {
  useAthlete,
  useAthleteStats,
  useUpdateAthlete,
  useDeleteAthlete,
} from "@/hooks/api/use-athletes"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  ArrowLeft,
  Loader2,
  Mail,
  ShieldCheck,
  ShieldAlert,
  Save,
  Trash2,
} from "lucide-react"

export default function AthleteDetailPage() {
  const params = useParams<{ athleteId: string }>()
  const athleteId = params.athleteId
  const router = useRouter()
  const { data: session } = useSession()
  const { data: athlete, isLoading } = useAthlete(athleteId)
  const { data: stats, isLoading: statsLoading } = useAthleteStats(athleteId)
  const updateAthlete = useUpdateAthlete()
  const deleteAthlete = useDeleteAthlete()

  const [formState, setFormState] = useState({
    name: "",
    email: "",
  })

  useEffect(() => {
    if (!athlete) return
    setFormState({
      name: athlete.name ?? "",
      email: athlete.email,
    })
  }, [athlete])

  const canEdit = session?.user?.role === "ADMIN" || session?.user?.role === "ORGANIZER" || session?.user?.id === athleteId
  const canDeactivate = session?.user?.role === "ADMIN"

  const handleChange = (field: "name" | "email", value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!canEdit) return

    try {
      await updateAthlete.mutateAsync({
        athleteId,
        athleteData: {
          name: formState.name,
          email: formState.email,
        },
      })

      toast.success("Profile updated")
    } catch (error: unknown) {
      console.error(error)
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error("Unable to update profile")
      }
    }
  }

  const handleDeactivate = async () => {
    if (!canDeactivate) return
    const confirmed = window.confirm("Disable this athlete account?")
    if (!confirmed) return

    try {
      await deleteAthlete.mutateAsync(athleteId)
      toast.success("Athlete deactivated")
      router.push("/athletes")
    } catch (error) {
      console.error(error)
      toast.error("Unable to deactivate athlete")
    }
  }

  if (!session) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Please sign in to view athlete profiles</h1>
          <Link href="/auth/signin">
            <Button className="mt-4">Sign in</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (isLoading || !athlete) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gray-50">
        {isLoading ? <Loader2 className="h-8 w-8 animate-spin text-indigo-600" /> : <p>Athlete not found.</p>}
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">{athlete.name || "Unnamed athlete"}</h1>
              <Badge variant={athlete.isActive ? "default" : "outline"}>
                {athlete.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <p className="mt-2 text-gray-600">Role: {athlete.role}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/athletes">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to list
              </Button>
            </Link>
            {canDeactivate && (
              <Button variant="destructive" onClick={handleDeactivate} disabled={deleteAthlete.isPending}>
                {deleteAthlete.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Deactivate
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Update athlete contact information.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    value={formState.name}
                    onChange={(event) => handleChange("name", event.target.value)}
                    disabled={!canEdit}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formState.email}
                    onChange={(event) => handleChange("email", event.target.value)}
                    disabled={!canEdit}
                  />
                </div>
                {canEdit && (
                  <Button type="submit" disabled={updateAthlete.isPending}>
                    {updateAthlete.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save changes
                  </Button>
                )}
              </form>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Contact</CardTitle>
              <CardDescription>Communication details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>{athlete.email}</span>
              </div>
              <div className="flex items-center gap-2">
                {athlete.isActive ? (
                  <ShieldCheck className="h-4 w-4 text-green-600" />
                ) : (
                  <ShieldAlert className="h-4 w-4 text-red-600" />
                )}
                <span>{athlete.isActive ? "Verified account" : "Account disabled"}</span>
              </div>
              <div className="text-xs text-gray-500">
                Member since {new Date(athlete.createdAt).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Performance insights</CardTitle>
            <CardDescription>Competition history and lift records.</CardDescription>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
              </div>
            ) : !stats ? (
              <p className="text-sm text-gray-500">Statistics are not available.</p>
            ) : (
              <div className="grid grid-cols-2 gap-6 text-sm md:grid-cols-3">
                <div>
                  <p className="text-gray-500">Total registrations</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalRegistrations}</p>
                </div>
                <div>
                  <p className="text-gray-500">Approved registrations</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.approvedRegistrations}</p>
                </div>
                <div>
                  <p className="text-gray-500">Total attempts</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalAttempts}</p>
                </div>
                <div>
                  <p className="text-gray-500">Good lifts</p>
                  <p className="text-2xl font-semibold text-gray-900 text-green-600">{stats.goodLifts}</p>
                </div>
                <div>
                  <p className="text-gray-500">Failed lifts</p>
                  <p className="text-2xl font-semibold text-gray-900 text-red-500">{stats.failedLifts}</p>
                </div>
                <div>
                  <p className="text-gray-500">Success rate</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.successRate.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-gray-500">Personal records</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.personalRecords}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
