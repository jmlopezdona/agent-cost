import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  DoughnutController,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js'
import { cssVar } from '../../lib/theme'
import type { Strings } from '../../i18n'
import type { TokenCategory } from '../../engine/types'

// Registro selectivo: solo lo que usan donut y barras (D3, presupuesto de bundle)
Chart.register(
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  DoughnutController,
  Legend,
  LinearScale,
  Tooltip,
)

/** Etiquetas de categoría del locale activo; el componente con el hook pasa su tabla (D3) */
export function categoryLabels(t: Strings): Record<TokenCategory, string> {
  return t.charts.categories
}

export const CATEGORY_CSS_VARS: Record<TokenCategory, string> = {
  cacheRead: '--chart-cache-read',
  output: '--chart-output',
  cacheWrite: '--chart-cache-write',
  input: '--chart-input',
}

/**
 * Señal secundaria al color por categoría (CA-07.2): cada serie del donut suma
 * un patrón de borde distinto, de modo que sea diferenciable sin percibir color.
 */
export const CATEGORY_BORDER_DASH: Record<TokenCategory, number[]> = {
  cacheRead: [], // continuo
  output: [6, 3], // discontinuo
  cacheWrite: [2, 2], // punteado
  input: [8, 3, 2, 3], // trazo-punto
}

/** Colores del tema activo para Chart.js; recalcular cuando cambie `dark` (CA-07.1) */
export function chartTheme() {
  return {
    ink: cssVar('--ink'),
    muted: cssVar('--muted'),
    grid: cssVar('--chart-grid'),
    surface: cssVar('--raised'),
    categoryColors: (Object.keys(CATEGORY_CSS_VARS) as TokenCategory[]).reduce(
      (acc, cat) => ({ ...acc, [cat]: cssVar(CATEGORY_CSS_VARS[cat]) }),
      {} as Record<TokenCategory, string>,
    ),
    agent: cssVar('--chart-agent'),
    human: cssVar('--chart-human'),
    ceiling: cssVar('--chart-ceiling'),
  }
}
