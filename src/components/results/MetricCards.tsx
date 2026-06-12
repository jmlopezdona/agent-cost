import { strings } from '../../i18n/es'
import { formatMoney, formatMoneyPerHour } from '../../lib/format'
import { usdToEur } from '../../engine/salary'
import { useResults } from '../../lib/useResults'
import { useScenarioStore } from '../../store/useScenarioStore'

export function MetricCards() {
  const results = useResults()
  const currency = useScenarioStore((s) => s.currency)
  const fx = useScenarioStore((s) => s.fx)

  // El motor devuelve USD; cuando la moneda activa es EUR se convierte con fx (D3)
  const toDisplay = (usd: number) => (currency === 'eur' ? usdToEur(usd, fx) : usd)

  const cards = [
    {
      id: 'blend',
      label: strings.metrics.blend,
      value: formatMoneyPerHour(toDisplay(results.blendedRate), currency),
      hero: false,
    },
    {
      id: 'ceiling',
      label: strings.metrics.ceiling,
      value: formatMoney(toDisplay(results.ceilingMonthlyUSD), currency),
      hero: false,
    },
    {
      id: 'weighted',
      label: strings.metrics.weighted,
      value: formatMoney(toDisplay(results.weightedMonthlyUSD), currency),
      hint: strings.metrics.weightedHint,
      hero: true,
    },
    {
      id: 'annual',
      label: strings.metrics.annual,
      value: formatMoney(toDisplay(results.weightedAnnualUSD), currency),
      hero: false,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-lg border p-4 ${
            card.hero
              ? 'order-first col-span-2 border-accent bg-accent-soft lg:order-none lg:col-span-1'
              : 'border-line bg-raised'
          }`}
        >
          <p className="text-xs text-muted">{card.label}</p>
          <p
            data-testid={`metric-${card.id}`}
            className={`mt-1 font-bold tabular-nums ${card.hero ? 'text-3xl text-accent' : 'text-xl'}`}
          >
            {card.value}
          </p>
          {card.hint && <p className="mt-0.5 text-xs text-muted">{card.hint}</p>}
        </div>
      ))}
    </div>
  )
}
