import { useFormat, useStrings } from '../../i18n/hooks'
import { usdToEur } from '../../engine/salary'
import { pricingTable } from '../../data'
import { useResults } from '../../lib/useResults'
import { mixHasApproxScore } from '../../lib/swePro'
import { useScenarioStore } from '../../store/useScenarioStore'

export function MetricCards({ large = false }: { large?: boolean }) {
  const t = useStrings()
  const { formatMoney, formatMoneyPerHour, formatScore } = useFormat()
  const results = useResults()
  const currency = useScenarioStore((s) => s.currency)
  const fx = useScenarioStore((s) => s.fx)
  const providerId = useScenarioStore((s) => s.scenario.providerId)
  const mix = useScenarioStore((s) => s.scenario.mix)

  // El motor devuelve USD; cuando la moneda activa es EUR se convierte con fx (D3)
  const toDisplay = (usd: number) => (currency === 'eur' ? usdToEur(usd, fx) : usd)

  // El score no es comparable a ciegas: marca ≈ si la mezcla activa mezcla bases/estimaciones (D5)
  const hasScore = results.weightedSwePro > 0
  const approx = hasScore && mixHasApproxScore(mix, pricingTable.providers[providerId])
  const scoreText = `${approx ? '≈' : ''}${formatScore(results.weightedSwePro)}`

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
    // Desempeño SWE-Pro ponderado del mix: % con marca de aproximación cuando aplica (D5)
    {
      id: 'swePro',
      label: t.metrics.swePro,
      value: scoreText,
      valueAria: approx ? `${t.performance.approx} ${formatScore(results.weightedSwePro)}` : undefined,
      hint: approx ? t.performance.approxHint : undefined,
      hero: false,
    },
    // Coste por punto de desempeño: "n/d" cuando no hay scores en la mezcla (D3)
    {
      id: 'costPerPoint',
      label: t.metrics.costPerPoint,
      value: hasScore ? formatMoney(toDisplay(results.costPerPointUSD), currency) : t.performance.na,
      hint: t.metrics.costPerPointHint,
      hero: false,
    },
    // Coste de almacenamiento de caché: métrica mensual propia, solo cuando aplica (D3, Gemini)
    ...(results.storageMonthlyUSD > 0
      ? [
          {
            id: 'storage',
            label: t.metrics.storage,
            value: formatMoney(toDisplay(results.storageMonthlyUSD), currency),
            hint: t.metrics.storageHint,
            hero: false,
          },
        ]
      : []),
  ]

  // Desktop (incluida la vista de presentación): todas las tarjetas en una fila —6, o 7 si Gemini
  // añade la de almacenamiento—. En móvil/tablet siguen en 2 columnas.
  const lgCols = cards.length >= 7 ? 'lg:grid-cols-7' : 'lg:grid-cols-6'

  return (
    <div className={`grid grid-cols-2 gap-3 ${lgCols}`}>
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
          {/* Tamaño uniforme entre tarjetas: el héroe se distingue por el recuadro de acento,
              no por una letra mayor (evita que la cifra más larga quede apretada en la columna) */}
          <p
            data-testid={`metric-${card.id}`}
            aria-label={'valueAria' in card ? card.valueAria : undefined}
            className={`mt-1 font-bold tabular-nums whitespace-nowrap ${
              large ? 'text-2xl' : 'text-xl'
            } ${card.hero ? 'text-accent' : ''}`}
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
