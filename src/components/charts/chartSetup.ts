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

/** Convierte una clave de categoría snake_case a la clave camelCase de i18n */
function toCamel(key: string): string {
  return key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())
}

/** Etiqueta de una categoría (por clave del costModel) en el locale activo */
export function categoryLabel(t: Strings, categoryKey: string): string {
  const labels = t.charts.categories as Record<string, string>
  return labels[toCamel(categoryKey)] ?? categoryKey
}

/** CSS var de color por categoría; categorías sin color propio reutilizan una afín */
const CATEGORY_CSS_VARS: Record<string, string> = {
  input: '--chart-input',
  output: '--chart-output',
  cache_read: '--chart-cache-read',
  cache_write: '--chart-cache-write',
  cached_input: '--chart-cache-read',
  cache_storage: '--chart-cache-write',
}

function categoryCssVar(categoryKey: string): string {
  return CATEGORY_CSS_VARS[categoryKey] ?? '--chart-input'
}

/**
 * Señal secundaria al color por categoría (CA-07.2): cada serie del donut suma
 * un patrón de borde distinto, de modo que sea diferenciable sin percibir color.
 */
const CATEGORY_BORDER_DASH: Record<string, number[]> = {
  cache_read: [],
  output: [6, 3],
  cache_write: [2, 2],
  input: [8, 3, 2, 3],
  cached_input: [4, 2],
  cache_storage: [2, 2],
}

export function categoryBorderDash(categoryKey: string): number[] {
  return CATEGORY_BORDER_DASH[categoryKey] ?? []
}

/** Color del tema activo para una categoría concreta */
export function categoryColor(categoryKey: string): string {
  return cssVar(categoryCssVar(categoryKey))
}

/** Colores del tema activo para Chart.js; recalcular cuando cambie `dark` (CA-07.1) */
export function chartTheme() {
  return {
    ink: cssVar('--ink'),
    muted: cssVar('--muted'),
    grid: cssVar('--chart-grid'),
    surface: cssVar('--raised'),
    agent: cssVar('--chart-agent'),
    human: cssVar('--chart-human'),
    ceiling: cssVar('--chart-ceiling'),
  }
}
