import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('it-IT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatDateTime(date: Date | string) {
  return new Date(date).toLocaleString('it-IT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatWeight(weight: number) {
  return `${weight} kg`
}

export function calculateWilksScore(bodyweight: number, total: number, gender: 'M' | 'F'): number {
  // Simplified Wilks formula - this should be replaced with the actual formula
  const coefficient = gender === 'M' ? 
    500 / (Math.pow(bodyweight, 2) * 0.001 + 0.5 * bodyweight + 40) :
    500 / (Math.pow(bodyweight, 2) * 0.002 + 0.4 * bodyweight + 35)
  
  return Math.round(total * coefficient * 100) / 100
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}