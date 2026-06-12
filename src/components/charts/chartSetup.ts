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
import { strings } from '../../i18n/es'
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

export const CATEGORY_LABELS: Record<TokenCategory, string> = strings.charts.categories

export const CATEGORY_CSS_VARS: Record<TokenCategory, string> = {
  cacheRead: '--chart-cache-read',
  output: '--chart-output',
  cacheWrite: '--chart-cache-write',
  input: '--chart-input',
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
