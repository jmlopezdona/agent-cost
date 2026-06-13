import { SliderInput } from './SliderInput'
import { useFormat, useStrings } from '../../i18n/hooks'
import { pricingTable } from '../../data'
import { PROVIDER_IDS, type ModelKey } from '../../engine/types'
import { usdToEur } from '../../engine/salary'
import { useResults } from '../../lib/useResults'
import { isApproxScore, mixHasApproxScore } from '../../lib/swePro'
import { useScenarioStore } from '../../store/useScenarioStore'

export function ModelMixSection() {
  const t = useStrings()
  const { formatMoneyPerHour, formatPercent, formatScore } = useFormat()
  const providerId = useScenarioStore((s) => s.scenario.providerId)
  const mix = useScenarioStore((s) => s.scenario.mix)
  const setMix = useScenarioStore((s) => s.setMix)
  const setProvider = useScenarioStore((s) => s.setProvider)
  const currency = useScenarioStore((s) => s.currency)
  const fx = useScenarioStore((s) => s.fx)
  const results = useResults()

  const provider = pricingTable.providers[providerId]
  const remainderKey = provider.remainderModel
  const sliderKeys = Object.keys(provider.models).filter((k) => k !== remainderKey)

  // Tasas del motor en USD/h → moneda activa (D3)
  const rate = (usdPerHour: number) =>
    formatMoneyPerHour(currency === 'eur' ? usdToEur(usdPerHour, fx) : usdPerHour, currency)

  // Score SWE-Pro entre paréntesis junto al modelo; ≈ si no es vendor/high (D5). Sin score → null
  const scoreParen = (key: ModelKey) => {
    const swePro = provider.models[key].swePro
    if (!swePro) return null
    return t.mix.scoreParen(`${isApproxScore(swePro) ? '≈' : ''}${formatScore(swePro.score)}`)
  }

  // Desempeño ponderado del mix al pie, con marca de aproximación coherente con la tarjeta
  const hasScore = results.weightedSwePro > 0
  const perfApprox = hasScore && mixHasApproxScore(mix, provider)
  const perfText = hasScore
    ? `${perfApprox ? '≈' : ''}${formatScore(results.weightedSwePro)}`
    : t.performance.na

  return (
    <div className="flex flex-col gap-4">
      {/* Pestañas por familia; cambiar de pestaña fija el proveedor activo (single-provider) */}
      <div role="tablist" aria-label={t.mix.tabsLabel} className="flex flex-wrap gap-1">
        {PROVIDER_IDS.map((id) => {
          const active = id === providerId
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => !active && setProvider(id)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? 'bg-accent-soft text-accent'
                  : 'border border-line bg-raised hover:border-accent'
              }`}
            >
              {t.providers[id]}
            </button>
          )
        })}
      </div>

      {sliderKeys.map((id) => (
        <SliderInput
          key={id}
          label={provider.models[id].name}
          labelExtra={
            scoreParen(id) && <span className="text-xs text-muted tabular-nums">{scoreParen(id)}</span>
          }
          unit="%"
          value={Math.round((mix[id] ?? 0) * 100)}
          min={0}
          max={100}
          step={1}
          onChange={(v) => setMix(id, v / 100)}
          detail={t.mix.rateLabel(rate(results.perModelRate[id] ?? 0))}
        />
      ))}
      <div className="flex items-center justify-between rounded-md bg-surface px-3 py-2 text-sm">
        <span>
          {provider.models[remainderKey].name}{' '}
          {scoreParen(remainderKey) && (
            <span className="text-xs text-muted tabular-nums">{scoreParen(remainderKey)} </span>
          )}
          <span className="text-xs text-muted">({t.mix.haikuRest})</span>
        </span>
        <span className="tabular-nums">
          {formatPercent(mix[remainderKey] ?? 0)}{' '}
          <span className="text-xs text-muted">
            · {t.mix.rateLabel(rate(results.perModelRate[remainderKey] ?? 0))}
          </span>
        </span>
      </div>
      <div className="flex items-center justify-between border-t border-line pt-3 text-sm font-semibold">
        <span>{t.mix.blendLabel}</span>
        <span className="tabular-nums">{rate(results.blendedRate)}</span>
      </div>
      <div className="flex items-center justify-between text-sm font-semibold">
        <span>{t.mix.perfLabel}</span>
        <span data-testid="mix-performance" className="tabular-nums">
          {perfText}
        </span>
      </div>
      {/* Disclaimer único de comparabilidad entre familias (D5) */}
      <p className="text-xs text-muted">{t.performance.disclaimer}</p>
    </div>
  )
}
