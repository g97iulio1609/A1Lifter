const SINCLAIR_CONSTANTS = {
  MALE: { A: 0.794358141, B: 174.393 },
  FEMALE: { A: 0.89726074, B: 148.026 },
} as const

export type SinclairGender = keyof typeof SINCLAIR_CONSTANTS

export function calculateSinclairCoefficient(
  bodyWeight: number | null | undefined,
  gender: SinclairGender
): number | null {
  if (!bodyWeight || bodyWeight <= 0) {
    return null
  }

  const constants = SINCLAIR_CONSTANTS[gender]
  const exponent = constants.A * Math.pow(Math.log10(bodyWeight / constants.B), 2)
  const coefficient = Math.pow(10, exponent)

  if (!Number.isFinite(coefficient)) {
    return null
  }

  return parseFloat(coefficient.toFixed(4))
}

export function calculateSinclairPoints(
  total: number | null | undefined,
  bodyWeight: number | null | undefined,
  gender: SinclairGender
): { coefficient: number | null; points: number | null } {
  if (!total || total <= 0) {
    return { coefficient: null, points: null }
  }

  const coefficient = calculateSinclairCoefficient(bodyWeight, gender)
  if (coefficient === null) {
    return { coefficient: null, points: null }
  }

  const points = parseFloat((total * coefficient).toFixed(2))
  return { coefficient, points }
}
