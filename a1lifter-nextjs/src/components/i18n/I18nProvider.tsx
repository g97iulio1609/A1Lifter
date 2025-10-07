"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { defaultLocale, locales, type Locale } from "@/i18n/config"
import { translations } from "@/i18n/translations"

interface I18nContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, fallback?: string) => string
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined)

function resolveMessage(locale: Locale, key: string, fallback?: string) {
  const messages = translations[locale] ?? translations[defaultLocale]
  if (messages[key]) {
    return messages[key]
  }

  const defaultMessages = translations[defaultLocale]
  if (defaultMessages[key]) {
    return defaultMessages[key]
  }

  return fallback ?? key
}

function normalizeLocale(locale: string | undefined): Locale {
  if (!locale) return defaultLocale
  return locales.includes(locale as Locale) ? (locale as Locale) : defaultLocale
}

export function I18nProvider({ initialLocale, children }: { initialLocale?: string; children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => normalizeLocale(initialLocale))

  useEffect(() => {
    setLocaleState(normalizeLocale(initialLocale))
  }, [initialLocale])

  const setLocale = (nextLocale: Locale) => {
    setLocaleState(nextLocale)
    try {
      document.cookie = `locale=${nextLocale}; path=/; max-age=${60 * 60 * 24 * 365}`
    } catch (error) {
      console.warn("Unable to persist locale preference", error)
    }
  }

  const value = useMemo<I18nContextValue>(() => ({
    locale,
    setLocale,
    t: (key: string, fallback?: string) => resolveMessage(locale, key, fallback),
  }), [locale])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider")
  }
  return context
}
