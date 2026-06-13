/**
 * Registro de los canvas de Chart.js para la exportación PNG (D7).
 * Cada gráfico registra un getter de su canvas; el módulo de export lo lee
 * en el momento de exportar, sin acoplar los componentes a la exportación.
 */
type CanvasGetter = () => HTMLCanvasElement | null

export const CHART_IDS = ['breakdown', 'ceiling', 'salary'] as const
export type ChartId = (typeof CHART_IDS)[number]

const registry = new Map<ChartId, CanvasGetter>()

export function registerChart(id: ChartId, get: CanvasGetter): () => void {
  registry.set(id, get)
  return () => {
    if (registry.get(id) === get) registry.delete(id)
  }
}

export function getChartCanvas(id: ChartId): HTMLCanvasElement | null {
  return registry.get(id)?.() ?? null
}

export function getRegisteredCharts(): { id: ChartId; canvas: HTMLCanvasElement }[] {
  const out: { id: ChartId; canvas: HTMLCanvasElement }[] = []
  for (const id of CHART_IDS) {
    const canvas = getChartCanvas(id)
    if (canvas) out.push({ id, canvas })
  }
  return out
}
