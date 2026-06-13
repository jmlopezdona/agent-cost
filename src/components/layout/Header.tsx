import { useEffect, useRef, useState } from 'react'
import { strings } from '../../i18n/es'
import { presets } from '../../data'
import { useScenarioStore } from '../../store/useScenarioStore'
import { useTheme } from '../../lib/theme'
import { PresentationToggle } from './PresentationToggle'

export function Header() {
  const presetId = useScenarioStore((s) => s.presetId)
  const isCustomized = useScenarioStore((s) => s.isCustomized)
  const loadPreset = useScenarioStore((s) => s.loadPreset)
  const currency = useScenarioStore((s) => s.currency)
  const setCurrency = useScenarioStore((s) => s.setCurrency)
  const presentation = useScenarioStore((s) => s.presentation)
  const dark = useTheme((s) => s.dark)
  const toggleTheme = useTheme((s) => s.toggle)

  const currencyOptions = [
    { id: 'eur', label: strings.header.currencyEur, aria: strings.header.currencyEurAria },
    { id: 'usd', label: strings.header.currencyUsd, aria: strings.header.currencyUsdAria },
  ] as const

  const [copied, setCopied] = useState(false)
  const copiedTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(copiedTimer.current), [])

  const copyLink = async () => {
    const url = window.location.href
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

  return (
    <header className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">{strings.app.title}</h1>
          <p className="text-sm text-muted">{strings.app.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <div
            role="group"
            aria-label={strings.header.currencyLabel}
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
            {copied ? strings.header.copied : strings.header.copyLink}
          </button>
          <PresentationToggle />
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={strings.header.themeToggle}
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
            aria-label={strings.header.presetsLabel}
            className="grid gap-2 sm:grid-cols-3"
          >
            {presets.map((preset) => {
          const active = preset.id === presetId
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
              <span className="block text-sm font-semibold">{preset.name}</span>
              <span className="mt-0.5 block truncate text-xs text-muted">{preset.description}</span>
            </button>
          )
            })}
          </div>

          <p className="text-sm">
            {isCustomized ? (
              <span className="font-medium text-accent">
                {strings.header.customized(activePreset.name)}
              </span>
            ) : (
              <span className="font-medium">{activePreset.name}</span>
            )}
            <span className="text-muted"> — {activePreset.description}</span>
          </p>
        </>
      )}
    </header>
  )
}
