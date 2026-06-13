import { useEffect, useRef, useState } from 'react'
import { useStrings } from '../../i18n/hooks'
import { presetProse } from '../../i18n'
import { presets } from '../../data'
import { useScenarioStore } from '../../store/useScenarioStore'
import { useTheme } from '../../lib/theme'
import { LanguageSelector } from './LanguageSelector'
import { PresentationToggle } from './PresentationToggle'
import { ExportMenu } from '../export/ExportMenu'

export function Header() {
  const t = useStrings()
  const presetId = useScenarioStore((s) => s.presetId)
  const isCustomized = useScenarioStore((s) => s.isCustomized)
  const loadPreset = useScenarioStore((s) => s.loadPreset)
  const currency = useScenarioStore((s) => s.currency)
  const setCurrency = useScenarioStore((s) => s.setCurrency)
  const presentation = useScenarioStore((s) => s.presentation)
  const serializeCurrent = useScenarioStore((s) => s.serializeCurrent)
  const reset = useScenarioStore((s) => s.reset)
  const dark = useTheme((s) => s.dark)
  const toggleTheme = useTheme((s) => s.toggle)

  const currencyOptions = [
    { id: 'eur', label: t.header.currencyEur, aria: t.header.currencyEurAria },
    { id: 'usd', label: t.header.currencyUsd, aria: t.header.currencyUsdAria },
  ] as const

  const [copied, setCopied] = useState(false)
  const copiedTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(copiedTimer.current), [])

  const copyLink = async () => {
    // La URL se construye bajo demanda desde el estado (la barra queda limpia durante la edición, D4)
    const query = serializeCurrent()
    const { origin, pathname } = window.location
    const url = `${origin}${pathname}${query ? `?${query}` : ''}`
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      // Sin permiso de portapapeles: fallback con selección temporal
      const textarea = document.createElement('textarea')
      textarea.value = url
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      textarea.remove()
    }
    setCopied(true)
    clearTimeout(copiedTimer.current)
    copiedTimer.current = setTimeout(() => setCopied(false), 2000)
  }

  const activePreset = presets.find((p) => p.id === presetId)!
  const activeProse = presetProse(t, activePreset.id)

  return (
    <header className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold">
            <span
              aria-hidden="true"
              className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-5"
              >
                <rect x="4" y="8" width="16" height="11" rx="2" />
                <path d="M12 8V4" />
                <circle cx="12" cy="3" r="1" />
                <path d="M9 13h.01M15 13h.01" />
                <path d="M4 12H2M22 12h-2" />
              </svg>
            </span>
            {t.app.title}
          </h1>
          <p className="text-sm text-muted">{t.app.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSelector />
          <div
            role="group"
            aria-label={t.header.currencyLabel}
            className="flex overflow-hidden rounded-md border border-line bg-raised"
          >
            {currencyOptions.map((opt) => {
              const active = currency === opt.id
              return (
                <button
                  key={opt.id}
                  type="button"
                  aria-pressed={active}
                  aria-label={opt.aria}
                  onClick={() => setCurrency(opt.id)}
                  className={`px-3 py-1.5 text-sm tabular-nums transition-colors ${
                    active ? 'bg-accent-soft text-accent' : 'hover:border-accent'
                  }`}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
          <button
            type="button"
            onClick={copyLink}
            className="rounded-md border border-line bg-raised px-3 py-1.5 text-sm hover:border-accent"
          >
            {copied ? t.header.copied : t.header.copyLink}
          </button>
          <button
            type="button"
            onClick={reset}
            aria-label={t.header.resetAria}
            className="rounded-md border border-line bg-raised px-3 py-1.5 text-sm hover:border-accent"
          >
            {t.header.reset}
          </button>
          <ExportMenu />
          <PresentationToggle />
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={t.header.themeToggle}
            className="rounded-md border border-line bg-raised px-3 py-1.5 text-sm hover:border-accent"
          >
            {dark ? '☀️' : '🌙'}
          </button>
        </div>
      </div>

      {!presentation && (
        <>
          <div
            role="group"
            aria-label={t.header.presetsLabel}
            className="grid gap-2 sm:grid-cols-3"
          >
            {presets.map((preset) => {
          const active = preset.id === presetId
          const prose = presetProse(t, preset.id)
          return (
            <button
              key={preset.id}
              type="button"
              aria-pressed={active && !isCustomized}
              onClick={() => loadPreset(preset.id)}
              className={`min-w-0 rounded-lg border p-3 text-left transition-colors ${
                active && !isCustomized
                  ? 'border-accent bg-accent-soft'
                  : 'border-line bg-raised hover:border-accent'
              }`}
            >
              <span className="block text-sm font-semibold">{prose.name}</span>
              <span className="mt-0.5 block truncate text-xs text-muted">{prose.description}</span>
            </button>
          )
            })}
          </div>

          <p className="text-sm">
            {isCustomized ? (
              <span className="font-medium text-accent">
                {t.header.customized(activeProse.name)}
              </span>
            ) : (
              <span className="font-medium">{activeProse.name}</span>
            )}
            <span className="text-muted"> — {activeProse.description}</span>
          </p>
        </>
      )}
    </header>
  )
}
