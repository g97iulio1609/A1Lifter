"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
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
import { UserPlus, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

interface Category {
  id: string
  name: string
  gender?: string
  minWeight?: number | null
  maxWeight?: number | null
}

interface Event {
  id: string
  name: string
  categories: Category[]
}

interface RegisterToEventDialogProps {
  event: Event
  onSuccess?: () => void
}

export function RegisterToEventDialog({ event, onSuccess }: RegisterToEventDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    categoryId: "",
    bodyWeight: "",
    notes: "",
  })
  const [registered, setRegistered] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/registrations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId: event.id,
          categoryId: formData.categoryId,
          bodyWeight: formData.bodyWeight ? parseFloat(formData.bodyWeight) : undefined,
          notes: formData.notes || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Failed to register for event")
        setIsLoading(false)
        return
      }

      toast.success("Successfully registered for the event!")
      setRegistered(true)

      // Wait a bit before closing to show success message
      setTimeout(() => {
        setOpen(false)
        setFormData({
          categoryId: "",
          bodyWeight: "",
          notes: "",
        })
        setRegistered(false)
        if (onSuccess) onSuccess()
      }, 2000)
    } catch (error) {
      console.error(error)
      toast.error("An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Register
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        {!registered ? (
          <>
            <DialogHeader>
              <DialogTitle>Register for {event.name}</DialogTitle>
              <DialogDescription>
                Choose your category and provide your details to register for this event.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your category" />
                  </SelectTrigger>
                  <SelectContent>
                    {event.categories.length === 0 ? (
                      <div className="p-2 text-sm text-gray-500">No categories available</div>
                    ) : (
                      event.categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                          {category.gender && ` (${category.gender})`}
                          {category.minWeight && category.maxWeight &&
                            ` - ${category.minWeight}-${category.maxWeight}kg`}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bodyWeight">Body Weight (kg) *</Label>
                <Input
                  id="bodyWeight"
                  type="number"
                  step="0.1"
                  value={formData.bodyWeight}
                  onChange={(e) => setFormData({ ...formData, bodyWeight: e.target.value })}
                  placeholder="75.5"
                  required
                />
                <p className="text-xs text-gray-500">
                  Your official weigh-in body weight
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any additional information (medical conditions, special requirements, etc.)"
                  className="w-full min-h-[80px] rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading || event.categories.length === 0}>
                  {isLoading ? "Registering..." : "Register for Event"}
                </Button>
              </DialogFooter>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                Registration Successful!
              </DialogTitle>
              <DialogDescription>
                You&rsquo;ve been successfully registered for {event.name}. You&rsquo;ll receive a notification once your registration is approved.
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-lg bg-green-50 border border-green-200 p-4">
              <p className="text-sm text-green-800">
                ✓ Check the event details page for more information about the competition schedule and requirements.
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
