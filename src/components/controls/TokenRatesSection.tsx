import { SliderInput } from './SliderInput'
import { HelpTip } from './HelpTip'
import { useFormat, useStrings } from '../../i18n/hooks'
import { RANGES } from '../../lib/ranges'
import { usdToEur } from '../../engine/salary'
import { useResults } from '../../lib/useResults'
import { useScenarioStore } from '../../store/useScenarioStore'
import type { TokenCategory, TokenRates } from '../../engine/types'

const CONTROLS: Array<{
  field: keyof TokenRates
  category: TokenCategory
  copyKey: 'input' | 'output' | 'cacheRead' | 'cacheWrite'
  range: { min: number; max: number }
  step: number
}> = [
  { field: 'inputK', category: 'input', copyKey: 'input', range: RANGES.inputK, step: 1 },
  { field: 'outputK', category: 'output', copyKey: 'output', range: RANGES.outputK, step: 5 },
  {
    field: 'cacheReadM',
    category: 'cacheRead',
    copyKey: 'cacheRead',
    range: RANGES.cacheReadM,
    step: 1,
  },
  {
    field: 'cacheWriteK',
    category: 'cacheWrite',
    copyKey: 'cacheWrite',
    range: RANGES.cacheWriteK,
    step: 10,
  },
]

export function TokenRatesSection() {
  const t = useStrings()
  const { formatMoneyPerHour, formatPercent } = useFormat()
  const tokens = useScenarioStore((s) => s.scenario.tokens)
  const setToken = useScenarioStore((s) => s.setToken)
  const currency = useScenarioStore((s) => s.currency)
  const fx = useScenarioStore((s) => s.fx)
  const results = useResults()

  // Tasas del motor en USD/h → moneda activa (D3)
  const rate = (usdPerHour: number) =>
    formatMoneyPerHour(currency === 'eur' ? usdToEur(usdPerHour, fx) : usdPerHour, currency)

  return (
    <div className="flex flex-col gap-4">
      {CONTROLS.map(({ field, category, copyKey, range, step }) => {
        const copy = t.tokens[copyKey]
        const cost = results.byCategory.find((c) => c.category === category)!
        return (
          <SliderInput
            key={field}
            label={copy.label}
            unit={copy.unit}
            value={tokens[field]}
            min={range.min}
            max={range.max}
            step={step}
            onChange={(v) => setToken(field, v)}
            labelExtra={<HelpTip label={t.tokens.helpButton(copy.label)} text={copy.help} />}
            detail={t.tokens.categoryDetail(rate(cost.usdPerHour), formatPercent(cost.share))}
          />
        )
      })}
    </div>
  )
}
