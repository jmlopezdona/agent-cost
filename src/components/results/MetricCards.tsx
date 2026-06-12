import { strings } from '../../i18n/es'
import { formatUSD, formatUsdPerHour } from '../../lib/format'
import { useResults } from '../../lib/useResults'

export function MetricCards() {
  const results = useResults()

  const cards = [
    {
      id: 'blend',
      label: strings.metrics.blend,
      value: formatUsdPerHour(results.blendedRate),
      hero: false,
    },
    {
      id: 'ceiling',
      label: strings.metrics.ceiling,
      value: formatUSD(results.ceilingMonthlyUSD),
      hero: false,
    },
    {
      id: 'weighted',
      label: strings.metrics.weighted,
      value: formatUSD(results.weightedMonthlyUSD),
      hint: strings.metrics.weightedHint,
      hero: true,
    },
    {
      id: 'annual',
      label: strings.metrics.annual,
      value: formatUSD(results.weightedAnnualUSD),
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
