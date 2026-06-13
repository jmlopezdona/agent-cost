import { useFormat, useStrings } from '../../i18n/hooks'
import { usdToEur } from '../../engine/salary'
import { useResults } from '../../lib/useResults'
import { useScenarioStore } from '../../store/useScenarioStore'

export function MetricCards({ large = false }: { large?: boolean }) {
  const t = useStrings()
  const { formatMoney, formatMoneyPerHour } = useFormat()
  const results = useResults()
  const currency = useScenarioStore((s) => s.currency)
  const fx = useScenarioStore((s) => s.fx)

  // El motor devuelve USD; cuando la moneda activa es EUR se convierte con fx (D3)
  const toDisplay = (usd: number) => (currency === 'eur' ? usdToEur(usd, fx) : usd)

  const cards = [
    {
      id: 'blend',
      label: t.metrics.blend,
      value: formatMoneyPerHour(toDisplay(results.blendedRate), currency),
      hero: false,
    },
    {
      id: 'ceiling',
      label: t.metrics.ceiling,
      value: formatMoney(toDisplay(results.ceilingMonthlyUSD), currency),
      hero: false,
    },
    {
      id: 'weighted',
      label: t.metrics.weighted,
      value: formatMoney(toDisplay(results.weightedMonthlyUSD), currency),
      hint: t.metrics.weightedHint,
      hero: true,
    },
    {
      id: 'annual',
      label: t.metrics.annual,
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
          <p className={large ? 'text-sm text-muted' : 'text-xs text-muted'}>{card.label}</p>
          <p
            data-testid={`metric-${card.id}`}
            className={`mt-1 font-bold tabular-nums ${
              card.hero
                ? large
                  ? 'text-5xl text-accent'
                  : 'text-3xl text-accent'
                : large
                  ? 'text-3xl'
                  : 'text-xl'
            }`}
          >
            {card.value}
          </p>
          {card.hint && (
            <p className={`mt-0.5 text-muted ${large ? 'text-sm' : 'text-xs'}`}>{card.hint}</p>
          )}
        </div>
      ))}
    </div>
  )
}
