import { SliderInput } from './SliderInput'
import { HelpTip } from './HelpTip'
import { strings } from '../../i18n/es'
import { pricingTable } from '../../data'
import { MODEL_IDS, PRICE_FIELDS } from '../../engine/types'
import { RANGES } from '../../lib/ranges'
import { formatFx } from '../../lib/format'
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

/** Panel colapsable de configuración avanzada (RF-08, D3) */
export function AdvancedConfigSection() {
  const priceOverrides = useScenarioStore((s) => s.priceOverrides)
  const setPriceOverride = useScenarioStore((s) => s.setPriceOverride)
  const resetPriceOverrides = useScenarioStore((s) => s.resetPriceOverrides)
  const batchEnabled = useScenarioStore((s) => s.batchEnabled)
  const setBatchEnabled = useScenarioStore((s) => s.setBatchEnabled)
  const batchFraction = useScenarioStore((s) => s.batchFraction)
  const setBatchFraction = useScenarioStore((s) => s.setBatchFraction)
  const regional = useScenarioStore((s) => s.regional)
  const setRegional = useScenarioStore((s) => s.setRegional)
  const fx = useScenarioStore((s) => s.fx)
  const setFx = useScenarioStore((s) => s.setFx)
  const employerMultiplier = useScenarioStore((s) => s.employerMultiplier)
  const setEmployerMultiplier = useScenarioStore((s) => s.setEmployerMultiplier)
  const effectiveHours = useScenarioStore((s) => s.effectiveHours)
  const setEffectiveHours = useScenarioStore((s) => s.setEffectiveHours)

  const hasOverrides = MODEL_IDS.some((id) => priceOverrides[id] !== undefined)
  const t = strings.advanced

  return (
    <details className="rounded-lg border border-line bg-raised p-4">
      <summary
        aria-label={t.toggleExpand}
        className="cursor-pointer list-none text-sm font-semibold [&::-webkit-details-marker]:hidden"
      >
        {t.sectionTitle}
        <span className="ml-2 text-xs font-normal text-muted">{t.sectionHint}</span>
      </summary>

      <div className="mt-4 flex flex-col gap-5">
        {/* Tabla de precios editable */}
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
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-xs tabular-nums">
              <thead>
                <tr className="text-left text-muted">
                  <th scope="col" className="py-1 pr-2 font-medium">
                    {t.colModel}
                  </th>
                  {PRICE_FIELDS.map((field) => (
                    <th key={field} scope="col" className="py-1 pr-2 text-right font-medium">
                      {t.priceFields[field]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MODEL_IDS.map((id) => (
                  <tr key={id} className="border-t border-line">
                    <th scope="row" className="py-1 pr-2 text-left font-medium">
                      {pricingTable.models[id].name}
                    </th>
                    {PRICE_FIELDS.map((field) => {
                      const value = priceOverrides[id]?.[field] ?? pricingTable.models[id][field]
                      const edited = priceOverrides[id]?.[field] !== undefined
                      return (
                        <td key={field} className="py-1 pr-2 text-right">
                          <input
                            type="number"
                            aria-label={t.priceCellAria(
                              pricingTable.models[id].name,
                              t.priceFields[field],
                            )}
                            value={value}
                            min={0}
                            step={0.1}
                            onChange={(e) => {
                              const v = Number(e.target.value)
                              if (Number.isFinite(v)) setPriceOverride(id, field, v)
                            }}
                            className={`w-16 rounded-md border bg-surface px-1.5 py-1 text-right tabular-nums focus:border-accent focus:outline-none ${
                              edited ? 'border-accent text-accent' : 'border-line'
                            }`}
                          />
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Batch API */}
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

        {/* Recargo regional / Bedrock */}
        <div className="flex items-center gap-1.5 border-t border-line pt-4">
          <Toggle checked={regional} onChange={setRegional} label={t.regionalTitle} />
          <HelpTip label={t.regionalToggle} text={t.regionalHelp} />
        </div>

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
            unit={t.effectiveHoursUnit}
            onChange={setEffectiveHours}
            help={t.effectiveHoursHelp}
          />
        </div>
      </div>
    </details>
  )
}
