import { Section } from '../layout/Section'
import { SliderInput } from './SliderInput'
import { HelpTip } from './HelpTip'
import { strings } from '../../i18n/es'
import { RANGES } from '../../lib/ranges'
import { formatPercent, formatUsdPerHour } from '../../lib/format'
import { useResults } from '../../lib/useResults'
import { useScenarioStore } from '../../store/useScenarioStore'
import type { TokenCategory, TokenRates } from '../../engine/types'

const CONTROLS: Array<{
  field: keyof TokenRates
  category: TokenCategory
  copy: { label: string; unit: string; help: string }
  range: { min: number; max: number }
  step: number
}> = [
  { field: 'inputK', category: 'input', copy: strings.tokens.input, range: RANGES.inputK, step: 1 },
  {
    field: 'outputK',
    category: 'output',
    copy: strings.tokens.output,
    range: RANGES.outputK,
    step: 5,
  },
  {
    field: 'cacheReadM',
    category: 'cacheRead',
    copy: strings.tokens.cacheRead,
    range: RANGES.cacheReadM,
    step: 1,
  },
  {
    field: 'cacheWriteK',
    category: 'cacheWrite',
    copy: strings.tokens.cacheWrite,
    range: RANGES.cacheWriteK,
    step: 10,
  },
]

export function TokenRatesSection() {
  const tokens = useScenarioStore((s) => s.scenario.tokens)
  const setToken = useScenarioStore((s) => s.setToken)
  const results = useResults()

  return (
    <Section title={strings.tokens.sectionTitle} hint={strings.tokens.sectionHint}>
      {CONTROLS.map(({ field, category, copy, range, step }) => {
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
            labelExtra={<HelpTip label={strings.tokens.helpButton(copy.label)} text={copy.help} />}
            detail={strings.tokens.categoryDetail(
              formatUsdPerHour(cost.usdPerHour),
              formatPercent(cost.share),
            )}
          />
        )
      })}
    </Section>
  )
}
