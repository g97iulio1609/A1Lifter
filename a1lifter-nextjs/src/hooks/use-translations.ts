import { useTranslations as useNextIntlTranslations } from "next-intl"

/**
 * Hook to access translations in client components
 * Usage: const t = useTranslations('common')
 * Then: t('welcome') to get the translation
 */
export function useTranslations(namespace?: string) {
  return useNextIntlTranslations(namespace)
}

/**
 * Type-safe translation keys
 */
export type TranslationKeys = {
  common: keyof typeof import("../../messages/en.json")["common"]
  nav: keyof typeof import("../../messages/en.json")["nav"]
  dashboard: keyof typeof import("../../messages/en.json")["dashboard"]
  events: keyof typeof import("../../messages/en.json")["events"]
  athletes: keyof typeof import("../../messages/en.json")["athletes"]
  attempts: keyof typeof import("../../messages/en.json")["attempts"]
  judge: keyof typeof import("../../messages/en.json")["judge"]
  live: keyof typeof import("../../messages/en.json")["live"]
  analytics: keyof typeof import("../../messages/en.json")["analytics"]
  notifications: keyof typeof import("../../messages/en.json")["notifications"]
  email: keyof typeof import("../../messages/en.json")["email"]
}
