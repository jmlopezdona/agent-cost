import { SliderInput } from './SliderInput'
import { strings } from '../../i18n/es'
import { pricingTable } from '../../data'
import { formatMoneyPerHour, formatPercent } from '../../lib/format'
import { usdToEur } from '../../engine/salary'
import { useResults } from '../../lib/useResults'
import { useScenarioStore } from '../../store/useScenarioStore'

const SLIDER_MODELS = ['fable', 'opus', 'sonnet'] as const

export function ModelMixSection() {
  const mix = useScenarioStore((s) => s.scenario.mix)
  const setMix = useScenarioStore((s) => s.setMix)
  const currency = useScenarioStore((s) => s.currency)
  const fx = useScenarioStore((s) => s.fx)
  const results = useResults()

  // Tasas del motor en USD/h → moneda activa (D3)
  const rate = (usdPerHour: number) =>
    formatMoneyPerHour(currency === 'eur' ? usdToEur(usdPerHour, fx) : usdPerHour, currency)

  return (
    <div className="flex flex-col gap-4">
      {SLIDER_MODELS.map((id) => (
        <SliderInput
          key={id}
          label={pricingTable.models[id].name}
          unit="%"
          value={Math.round(mix[id] * 100)}
          min={0}
          max={100}
          step={1}
          onChange={(v) => setMix(id, v / 100)}
          detail={strings.mix.rateLabel(rate(results.perModelRate[id]))}
        />
      ))}
      <div className="flex items-center justify-between rounded-md bg-surface px-3 py-2 text-sm">
        <span>
          {pricingTable.models.haiku.name}{' '}
          <span className="text-xs text-muted">({strings.mix.haikuRest})</span>
        </span>
        <span className="tabular-nums">
          {formatPercent(mix.haiku)}{' '}
          <span className="text-xs text-muted">
            · {strings.mix.rateLabel(rate(results.perModelRate.haiku))}
          </span>
        </span>
      </div>
      <div className="flex items-center justify-between border-t border-line pt-3 text-sm font-semibold">
        <span>{strings.mix.blendLabel}</span>
        <span className="tabular-nums">{rate(results.blendedRate)}</span>
      </div>
    </div>
  )
}
