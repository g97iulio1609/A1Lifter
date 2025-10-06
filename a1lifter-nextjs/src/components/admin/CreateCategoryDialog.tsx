"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCreateCategory } from "@/hooks/api/use-events"
import { toast } from "sonner"

interface CreateCategoryDialogProps {
  eventId: string
}

const GENDERS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "MIXED", label: "Mixed" },
  { value: "OTHER", label: "Other" },
] as const

export function CreateCategoryDialog({ eventId }: CreateCategoryDialogProps) {
  const [open, setOpen] = useState(false)
  const [formState, setFormState] = useState({
    name: "",
    gender: "MALE",
    minWeight: "",
    maxWeight: "",
    ageMin: "",
    ageMax: "",
  })
  const createCategory = useCreateCategory()

  const resetForm = () => {
    setFormState({
      name: "",
      gender: "MALE",
      minWeight: "",
      maxWeight: "",
      ageMin: "",
      ageMax: "",
    })
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!formState.name.trim()) {
      toast.error("Category name is required")
      return
    }

    try {
      await createCategory.mutateAsync({
        eventId,
        category: {
          name: formState.name.trim(),
          gender: formState.gender,
          minWeight: formState.minWeight ? Number(formState.minWeight) : undefined,
          maxWeight: formState.maxWeight ? Number(formState.maxWeight) : undefined,
          ageMin: formState.ageMin ? Number(formState.ageMin) : undefined,
          ageMax: formState.ageMax ? Number(formState.ageMax) : undefined,
        },
      })

      toast.success("Category created")
      resetForm()
      setOpen(false)
    } catch (error) {
      toast.error("Unable to create category", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">New category</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create category</DialogTitle>
          <DialogDescription>
            Define divisions for this competition. You can adjust them later if requirements change.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category-name">Name</Label>
            <Input
              id="category-name"
              value={formState.name}
              onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Women 71kg"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category-gender">Gender</Label>
            <Select
              value={formState.gender}
              onValueChange={(value) => setFormState((prev) => ({ ...prev, gender: value }))}
            >
              <SelectTrigger id="category-gender">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GENDERS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min-weight">Min weight (kg)</Label>
              <Input
                id="min-weight"
                type="number"
                min="0"
                step="0.1"
                value={formState.minWeight}
                onChange={(event) => setFormState((prev) => ({ ...prev, minWeight: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-weight">Max weight (kg)</Label>
              <Input
                id="max-weight"
                type="number"
                min="0"
                step="0.1"
                value={formState.maxWeight}
                onChange={(event) => setFormState((prev) => ({ ...prev, maxWeight: event.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age-min">Min age</Label>
              <Input
                id="age-min"
                type="number"
                min="0"
                value={formState.ageMin}
                onChange={(event) => setFormState((prev) => ({ ...prev, ageMin: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age-max">Max age</Label>
              <Input
                id="age-max"
                type="number"
                min="0"
                value={formState.ageMax}
                onChange={(event) => setFormState((prev) => ({ ...prev, ageMax: event.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createCategory.isPending}>
              {createCategory.isPending ? "Creating..." : "Create category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
