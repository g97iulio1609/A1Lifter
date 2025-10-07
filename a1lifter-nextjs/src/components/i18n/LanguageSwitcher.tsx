"use client"

import type { ChangeEvent } from "react"
import { useI18n } from "@/components/i18n/I18nProvider"
import type { Locale } from "@/i18n/config"

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n()

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setLocale(event.target.value as Locale)
  }

  return (
    <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
      <span className="hidden sm:inline">{t("nav.language", "Language")}</span>
      <select
        aria-label={t("nav.language", "Language")}
        value={locale}
        onChange={handleChange}
        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
      >
        <option value="en">{t("nav.language.english", "English")}</option>
        <option value="it">{t("nav.language.italian", "Italian")}</option>
      </select>
    </label>
  )
}
