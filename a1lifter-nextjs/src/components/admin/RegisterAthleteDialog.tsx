"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { UserPlus, Copy, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

interface Category {
  id: string
  name: string
}

interface RegisterAthleteDialogProps {
  eventId: string
  categories: Category[]
  onSuccess?: () => void
}

export function RegisterAthleteDialog({ eventId, categories, onSuccess }: RegisterAthleteDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    categoryId: "",
    bodyWeight: "",
    notes: "",
  })
  const [result, setResult] = useState<{
    isNewUser: boolean
    temporaryPassword?: string
    userEmail: string
  } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/admin/register-athlete-to-event", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          eventId,
          categoryId: formData.categoryId,
          bodyWeight: formData.bodyWeight ? parseFloat(formData.bodyWeight) : undefined,
          notes: formData.notes || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Failed to register athlete")
        setIsLoading(false)
        return
      }

      toast.success(data.message || "Athlete registered successfully")

      if (data.data.isNewUser && data.data.temporaryPassword) {
        setResult({
          isNewUser: data.data.isNewUser,
          temporaryPassword: data.data.temporaryPassword,
          userEmail: data.data.userEmail,
        })
      } else {
        // Close dialog and reset form
        setOpen(false)
        setFormData({
          name: "",
          email: "",
          categoryId: "",
          bodyWeight: "",
          notes: "",
        })
        if (onSuccess) onSuccess()
      }
    } catch (error) {
      console.error(error)
      toast.error("An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyCredentials = () => {
    if (result?.temporaryPassword) {
      const credentials = `Email: ${result.userEmail}\nTemporary Password: ${result.temporaryPassword}`
      navigator.clipboard.writeText(credentials)
      toast.success("Credentials copied to clipboard")
    }
  }

  const handleClose = () => {
    setOpen(false)
    setFormData({
      name: "",
      email: "",
      categoryId: "",
      bodyWeight: "",
      notes: "",
    })
    setResult(null)
    if (onSuccess) onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Register Athlete
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        {!result ? (
          <>
            <DialogHeader>
              <DialogTitle>Register Athlete to Event</DialogTitle>
              <DialogDescription>
                Create a new athlete account or register an existing athlete to this event.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="athlete@example.com"
                  required
                />
                <p className="text-xs text-gray-500">
                  If the email exists, the athlete will be registered. Otherwise, a new account will be created.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bodyWeight">Body Weight (kg)</Label>
                <Input
                  id="bodyWeight"
                  type="number"
                  step="0.1"
                  value={formData.bodyWeight}
                  onChange={(e) => setFormData({ ...formData, bodyWeight: e.target.value })}
                  placeholder="75.5"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes..."
                  className="w-full min-h-[80px] rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Registering..." : "Register Athlete"}
                </Button>
              </DialogFooter>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                Athlete Registered Successfully
              </DialogTitle>
              <DialogDescription>
                {result.isNewUser
                  ? "A new account has been created. Share these credentials with the athlete:"
                  : "The existing athlete has been registered for this event."}
              </DialogDescription>
            </DialogHeader>

            {result.isNewUser && result.temporaryPassword && (
              <div className="space-y-4">
                <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-4">
                  <h4 className="font-semibold text-indigo-900 mb-2">Login Credentials</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-indigo-700">Email:</span>{" "}
                      <span className="text-indigo-900">{result.userEmail}</span>
                    </div>
                    <div>
                      <span className="font-medium text-indigo-700">Temporary Password:</span>{" "}
                      <span className="font-mono text-indigo-900">{result.temporaryPassword}</span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full"
                    onClick={handleCopyCredentials}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Credentials
                  </Button>
                </div>
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded p-3">
                  ⚠️ Make sure to securely share these credentials with the athlete. They should change their password on first login.
                </p>
              </div>
            )}

            <DialogFooter>
              <Button onClick={handleClose}>Done</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
