import type { PriceOverrides, Results, Scenario } from '../engine/types'
import type { Currency } from '../data'
import { cssVar } from './theme'
import { getChartCanvas, getRegisteredCharts, type ChartId } from './chartRegistry'

/** Estado necesario para exportar el escenario (parámetros + modificadores) */
export interface ExportInput {
  presetId: string
  presetName: string
  scenario: Scenario
  fx: number
  currency: Currency
  batchEnabled: boolean
  batchFraction: number
  regional: boolean
  employerMultiplier: number
  effectiveHours: number
  priceOverrides: PriceOverrides
  results: Results
}

/** Etiquetas de exportación en el idioma activo (D9); las cifras no dependen del idioma */
export interface ExportLabels {
  preset: string
  parameters: string
  modifiers: string
  results: string
  csvColKey: string
  csvColValue: string
}

/** Etiquetas por defecto (español) si no se inyectan; mantiene el export estable sin contexto i18n */
const DEFAULT_LABELS: ExportLabels = {
  preset: 'preset',
  parameters: 'parametros',
  modifiers: 'modificadores',
  results: 'resultados',
  csvColKey: 'clave',
  csvColValue: 'valor',
}

/** Objeto serializable con parámetros, modificadores y resultados (RF-09); etiquetas en idioma activo (D9) */
export function buildExportData(input: ExportInput, labels: ExportLabels = DEFAULT_LABELS) {
  const { scenario, results } = input
  return {
    [labels.preset]: `${input.presetId} — ${input.presetName}`,
    [labels.parameters]: {
      tokens: scenario.tokens,
      mix: scenario.mix,
      hoursPerDay: scenario.hoursPerDay,
      daysPerWeek: scenario.daysPerWeek,
      dutyCycle: scenario.dutyCycle,
      agents: scenario.agents,
    },
    [labels.modifiers]: {
      batchEnabled: input.batchEnabled,
      batchFraction: input.batchEnabled ? input.batchFraction : 0,
      regional: input.regional,
      fxEurPerUsd: input.fx,
      currency: input.currency,
      employerMultiplier: input.employerMultiplier,
      effectiveHours: input.effectiveHours,
      priceOverrides: input.priceOverrides,
    },
    [labels.results]: {
      blendedRateUSD: results.blendedRate,
      ceilingMonthlyUSD: results.ceilingMonthlyUSD,
      weightedMonthlyUSD: results.weightedMonthlyUSD,
      weightedAnnualUSD: results.weightedAnnualUSD,
      byCategory: results.byCategory,
    },
  }
}

/** Aplana el objeto de export a filas clave/valor para CSV */
function flatten(obj: unknown, prefix = ''): Array<[string, string]> {
  const rows: Array<[string, string]> = []
  if (obj !== null && typeof obj === 'object' && !Array.isArray(obj)) {
    for (const [key, value] of Object.entries(obj)) {
      rows.push(...flatten(value, prefix ? `${prefix}.${key}` : key))
    }
  } else if (Array.isArray(obj)) {
    rows.push([prefix, JSON.stringify(obj)])
  } else {
    rows.push([prefix, String(obj)])
  }
  return rows
}

function csvEscape(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

export function toCSV(input: ExportInput, labels: ExportLabels = DEFAULT_LABELS): string {
  const rows = flatten(buildExportData(input, labels))
  const header = `${csvEscape(labels.csvColKey)},${csvEscape(labels.csvColValue)}`
  const lines = [header, ...rows.map(([k, v]) => `${csvEscape(k)},${csvEscape(v)}`)]
  return lines.join('\n')
}

export function toJSON(input: ExportInput, labels: ExportLabels = DEFAULT_LABELS): string {
  return JSON.stringify(buildExportData(input, labels), null, 2)
}

function download(filename: string, mime: string, content: string): void {
  if (typeof document === 'undefined') return
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function downloadDataUrl(filename: string, dataUrl: string): void {
  if (typeof document === 'undefined') return
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
}

export function exportJSON(input: ExportInput, fileBase: string, labels?: ExportLabels): void {
  download(`${fileBase}.json`, 'application/json', toJSON(input, labels))
}

export function exportCSV(input: ExportInput, fileBase: string, labels?: ExportLabels): void {
  download(`${fileBase}.csv`, 'text/csv;charset=utf-8', toCSV(input, labels))
}

/** Dibuja un canvas sobre fondo del tema activo y devuelve el dataURL PNG */
function withBackground(canvas: HTMLCanvasElement): string {
  const out = document.createElement('canvas')
  out.width = canvas.width
  out.height = canvas.height
  const ctx = out.getContext('2d')
  if (!ctx) return canvas.toDataURL('image/png')
  ctx.fillStyle = cssVar('--raised') || '#ffffff'
  ctx.fillRect(0, 0, out.width, out.height)
  ctx.drawImage(canvas, 0, 0)
  return out.toDataURL('image/png')
}

/** PNG de un gráfico individual respetando el tema activo (D7) */
export function exportChartPNG(id: ChartId, fileBase: string): void {
  const canvas = getChartCanvas(id)
  if (!canvas) return
  downloadDataUrl(`${fileBase}-${id}.png`, withBackground(canvas))
}

/** PNG de montaje con los tres gráficos apilados, sin librerías nuevas (D7) */
export function exportAllChartsPNG(fileBase: string): void {
  if (typeof document === 'undefined') return
  const charts = getRegisteredCharts()
  if (charts.length === 0) return

  const gap = 24
  const width = Math.max(...charts.map((c) => c.canvas.width))
  const height = charts.reduce((sum, c) => sum + c.canvas.height, 0) + gap * (charts.length - 1)

  const out = document.createElement('canvas')
  out.width = width
  out.height = height
  const ctx = out.getContext('2d')
  if (!ctx) return
  ctx.fillStyle = cssVar('--raised') || '#ffffff'
  ctx.fillRect(0, 0, width, height)

  let y = 0
  for (const { canvas } of charts) {
    ctx.drawImage(canvas, Math.round((width - canvas.width) / 2), y)
    y += canvas.height + gap
  }
  downloadDataUrl(`${fileBase}-todo.png`, out.toDataURL('image/png'))
}
