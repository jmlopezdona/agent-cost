import { SliderInput } from './SliderInput'
import { HelpTip } from './HelpTip'
import { useFormat, useStrings } from '../../i18n/hooks'
import { rateCategories, storageCategory } from '../../data'
import { RANGES, type Range } from '../../lib/ranges'
import { usdToEur } from '../../engine/salary'
import { useResults } from '../../lib/useResults'
import { useScenarioStore } from '../../store/useScenarioStore'
import type { CostCategory } from '../../engine/types'

/** Convierte una clave de categoría snake_case a la clave camelCase de i18n */
function toCamel(key: string): string {
  return key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())
}

/** Paso del control por categoría; el resto cae a 1 */
const STEP: Record<string, number> = {
  output: 5,
  cache_write: 10,
}

export function TokenRatesSection() {
  const t = useStrings()
  const { formatMoneyPerHour, formatPercent } = useFormat()
  const providerId = useScenarioStore((s) => s.scenario.providerId)
  const tokens = useScenarioStore((s) => s.scenario.tokens)
  const setToken = useScenarioStore((s) => s.setToken)
  const storageEnabled = useScenarioStore((s) => s.storageEnabled)
  const currency = useScenarioStore((s) => s.currency)
  const fx = useScenarioStore((s) => s.fx)
  const results = useResults()

  // Tasas del motor en USD/h → moneda activa (D3)
  const rate = (usdPerHour: number) =>
    formatMoneyPerHour(currency === 'eur' ? usdToEur(usdPerHour, fx) : usdPerHour, currency)

  // Controles de tasa: una entrada por categoría `rate` del proveedor activo (D6)
  const rateCats = rateCategories(providerId)
  // Categoría de almacenamiento (tokens retenidos): solo visible con el término activo (D3)
  const storageCat = storageEnabled ? storageCategory(providerId) : undefined

  const renderControl = (cat: CostCategory, withDetail: boolean) => {
    const copy = (
      t.tokens as unknown as Record<string, { label: string; unit: string; help: string }>
    )[toCamel(cat.key)]
    const range = (RANGES as Record<string, Range>)[cat.rateKey] ?? { min: 0, max: 1000 }
    const cost = withDetail ? results.byCategory.find((c) => c.category === cat.key) : undefined
    return (
      <SliderInput
        key={cat.key}
        label={copy.label}
        unit={copy.unit}
        value={tokens[cat.rateKey] ?? 0}
        min={range.min}
        max={range.max}
        step={STEP[cat.key] ?? 1}
        onChange={(v) => setToken(cat.rateKey, v)}
        labelExtra={<HelpTip label={t.tokens.helpButton(copy.label)} text={copy.help} />}
        detail={
          cost
            ? t.tokens.categoryDetail(rate(cost.usdPerHour), formatPercent(cost.share))
            : undefined
        }
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {rateCats.map((cat) => renderControl(cat, true))}
      {storageCat && renderControl(storageCat, false)}
    </div>
  )
}
