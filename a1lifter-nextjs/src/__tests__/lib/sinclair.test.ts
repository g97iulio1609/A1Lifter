import { describe, it, expect } from "vitest"
import { calculateSinclairCoefficient, calculateSinclairPoints } from "@/lib/analytics/sinclair"

describe("Sinclair calculations", () => {
  it("computes coefficient for male lifter", () => {
    const coefficient = calculateSinclairCoefficient(85, "MALE")
    expect(coefficient).not.toBeNull()
    expect(coefficient ?? 0).toBeGreaterThan(0)
  })

  it("returns null when bodyweight missing", () => {
    const coefficient = calculateSinclairCoefficient(null, "FEMALE")
    expect(coefficient).toBeNull()
  })

  it("computes points when totals available", () => {
    const result = calculateSinclairPoints(250, 90, "MALE")
    expect(result.coefficient).not.toBeNull()
    expect(result.points).not.toBeNull()
    expect(result.points ?? 0).toBeGreaterThan(0)
  })
})
