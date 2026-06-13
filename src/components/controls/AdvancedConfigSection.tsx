import { useState } from 'react'
import { SliderInput } from './SliderInput'
import { HelpTip } from './HelpTip'
import { useFormat, useStrings } from '../../i18n/hooks'
import { offersRegional, pricingTable, storageCategory } from '../../data'
import { modelId, PROVIDER_IDS, type ProviderId } from '../../engine/types'
import { RANGES } from '../../lib/ranges'
import { useScenarioStore } from '../../store/useScenarioStore'

/** Casilla de activación accesible reutilizada por los toggles del panel */
function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-(--accent)"
      />
      {label}
    </label>
  )
}

/** Campo numérico etiquetado para multiplicador, horas y tipo de cambio */
function NumberField({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  help,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit?: string
  onChange: (v: number) => void
  help?: string
}) {
  return (
    <label className="flex items-center justify-between gap-2 text-sm">
      <span className="flex items-center gap-1.5">
        {label}
        {help && <HelpTip label={label} text={help} />}
      </span>
      <span className="flex items-center gap-1">
        <input
          type="number"
          aria-label={label}
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => {
            const v = Number(e.target.value)
            if (Number.isFinite(v)) onChange(v)
          }}
          className="w-24 rounded-md border border-line bg-surface px-2 py-1 text-right text-sm tabular-nums focus:border-accent focus:outline-none"
        />
        {unit && <span className="text-xs whitespace-nowrap text-muted">{unit}</span>}
      </span>
    </label>
  )
}

/** Cuerpo de configuración avanzada (RF-08); su cabecera la aporta el acordeón */
export function AdvancedConfigSection() {
  const activeProvider = useScenarioStore((s) => s.scenario.providerId)
  const priceOverrides = useScenarioStore((s) => s.priceOverrides)
  const setPriceOverride = useScenarioStore((s) => s.setPriceOverride)
  const resetPriceOverrides = useScenarioStore((s) => s.resetPriceOverrides)
  const batchEnabled = useScenarioStore((s) => s.batchEnabled)
  const setBatchEnabled = useScenarioStore((s) => s.setBatchEnabled)
  const batchFraction = useScenarioStore((s) => s.batchFraction)
  const setBatchFraction = useScenarioStore((s) => s.setBatchFraction)
  const regional = useScenarioStore((s) => s.regional)
  const setRegional = useScenarioStore((s) => s.setRegional)
  const storageEnabled = useScenarioStore((s) => s.storageEnabled)
  const setStorageEnabled = useScenarioStore((s) => s.setStorageEnabled)
  const fx = useScenarioStore((s) => s.fx)
  const setFx = useScenarioStore((s) => s.setFx)
  const employerMultiplier = useScenarioStore((s) => s.employerMultiplier)
  const setEmployerMultiplier = useScenarioStore((s) => s.setEmployerMultiplier)
  const effectiveHours = useScenarioStore((s) => s.effectiveHours)
  const setEffectiveHours = useScenarioStore((s) => s.setEffectiveHours)

  const { formatFx } = useFormat()
  const t = useStrings().advanced
  const tProviders = useStrings().providers

  const hasOverrides = Object.keys(priceOverrides).length > 0

  // Pestaña de precios: por defecto la familia activa; editable independientemente
  const [pricingTab, setPricingTab] = useState<ProviderId>(activeProvider)
  const tabProvider = pricingTable.providers[pricingTab]
  const tabCategories = tabProvider.costModel
  const priceFields = t.priceFields as Record<string, string>

  const providerOffersRegional = offersRegional(activeProvider)
  const providerOffersStorage = storageCategory(activeProvider) !== undefined

  return (
    <div className="flex flex-col gap-5">
      {/* Tabla de precios editable por familia */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xs font-semibold text-muted">{t.pricingTitle}</h3>
          <button
            type="button"
            onClick={resetPriceOverrides}
            disabled={!hasOverrides}
            className="rounded-md border border-line px-2 py-1 text-xs hover:border-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t.restoreOfficial}
          </button>
        </div>
        <p className="mt-0.5 text-xs text-muted">{t.pricingHint}</p>

        {/* Pestañas por familia de precios */}
        <div role="tablist" aria-label={t.pricingTabsLabel} className="mt-2 flex flex-wrap gap-1">
          {PROVIDER_IDS.map((id) => {
            const active = id === pricingTab
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setPricingTab(id)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  active
                    ? 'bg-accent-soft text-accent'
                    : 'border border-line bg-raised hover:border-accent'
                }`}
              >
                {tProviders[id]}
              </button>
            )
          })}
        </div>

        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-xs tabular-nums">
            <thead>
              <tr className="text-left text-muted">
                <th scope="col" className="py-1 pr-2 font-medium">
                  {t.colModel}
                </th>
                {tabCategories.map((cat) => (
                  <th key={cat.key} scope="col" className="py-1 pr-2 text-right font-medium">
                    {priceFields[cat.key] ?? cat.key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.keys(tabProvider.models).map((key) => {
                const id = modelId(pricingTab, key)
                const model = tabProvider.models[key]
                return (
                  <tr key={key} className="border-t border-line">
                    <th scope="row" className="py-1 pr-2 text-left font-medium">
                      {model.name}
                    </th>
                    {tabCategories.map((cat) => {
                      const value = priceOverrides[id]?.[cat.key] ?? model.prices[cat.key]
                      const edited = priceOverrides[id]?.[cat.key] !== undefined
                      return (
                        <td key={cat.key} className="py-1 pr-2 text-right">
                          <input
                            type="number"
                            aria-label={t.priceCellAria(
                              model.name,
                              priceFields[cat.key] ?? cat.key,
                            )}
                            value={value}
                            min={0}
                            step={0.1}
                            onChange={(e) => {
                              const v = Number(e.target.value)
                              if (Number.isFinite(v)) setPriceOverride(id, cat.key, v)
                            }}
                            className={`w-16 rounded-md border bg-surface px-1.5 py-1 text-right tabular-nums focus:border-accent focus:outline-none ${
                              edited ? 'border-accent text-accent' : 'border-line'
                            }`}
                          />
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Batch API (todos los proveedores) */}
      <div className="flex flex-col gap-2 border-t border-line pt-4">
        <div className="flex items-center gap-1.5">
          <Toggle checked={batchEnabled} onChange={setBatchEnabled} label={t.batchTitle} />
          <HelpTip label={t.batchToggle} text={t.batchHelp} />
        </div>
        {batchEnabled && (
          <SliderInput
            label={t.batchFractionLabel}
            unit={t.batchUnit}
            value={Math.round(batchFraction * 100)}
            min={RANGES.batchFraction.min * 100}
            max={RANGES.batchFraction.max * 100}
            onChange={(v) => setBatchFraction(v / 100)}
          />
        )}
      </div>

      {/* Recargo regional: las tres familias lo ofrecen; deshabilitado por defecto */}
      {providerOffersRegional && (
        <div className="flex items-center gap-1.5 border-t border-line pt-4">
          <Toggle checked={regional} onChange={setRegional} label={t.regionalTitle} />
          <HelpTip label={t.regionalToggle} text={t.regionalHelp} />
        </div>
      )}

      {/* Almacenamiento de caché: solo en proveedores con categoría storage (Google) */}
      {providerOffersStorage && (
        <div className="flex flex-col gap-2 border-t border-line pt-4">
          <div className="flex items-center gap-1.5">
            <Toggle checked={storageEnabled} onChange={setStorageEnabled} label={t.storageTitle} />
            <HelpTip label={t.storageToggle} text={t.storageHelp} />
          </div>
          {storageEnabled && <p className="text-xs text-muted">{t.storageDisclaimer}</p>}
        </div>
      )}

      {/* Tipo de cambio, multiplicador y horas efectivas */}
      <div className="flex flex-col gap-3 border-t border-line pt-4">
        <NumberField
          label={`${t.fxLabel} (${formatFx(fx)})`}
          value={fx}
          min={RANGES.fx.min}
          max={RANGES.fx.max}
          step={0.01}
          unit={t.fxUnit}
          onChange={setFx}
        />
        <NumberField
          label={t.employerMultiplierLabel}
          value={employerMultiplier}
          min={RANGES.employerMultiplier.min}
          max={RANGES.employerMultiplier.max}
          step={0.05}
          onChange={setEmployerMultiplier}
          help={t.employerMultiplierHelp}
        />
        <NumberField
          label={t.effectiveHoursLabel}
          value={effectiveHours}
          min={RANGES.effectiveHours.min}
          max={RANGES.effectiveHours.max}
          step={10}
          onChange={setEffectiveHours}
          help={t.effectiveHoursHelp}
        />
      </div>
    </div>
  )
}
